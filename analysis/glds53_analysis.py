"""
Paired re-analysis of NASA GeneLab GLDS-53 (GEO GSE47126).

Inputs (from the OSDR OSD-53 page and GEO GPL140, placed in analysis/raw/):
  GLDS-53_microarray_E-GEOD-47126.processed/GSM*_sample_table.txt
  GLDS-53_microarray_E-GEOD-47126.additional/GSE47126_Fold_change_data.txt
  GPL140_annotation.txt

Output: src/data/glds53.json used by the Evidence page.

Method
  value     processed VALUE (background subtracted, normalised to housekeeping genes)
  change    d = log2(post + 1) - log2(pre + 1) for each astronaut with both values
  included  genes with at least 4 astronauts paired, the same rule the authors used
  tests     two-sided paired t-test on d; exact Wilcoxon signed-rank as a check
  multiple  Benjamini-Hochberg false discovery rate across included genes
"""
import io
import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from scipy import stats

ROOT = Path(__file__).resolve().parent
RAW = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'raw'
OUT = ROOT.parent / 'src' / 'data' / 'glds53.json'

CREW = [  # from OSD-53 ISA sample table
    ('A', 'Male', 'GSM1145430', 'GSM1145431'),
    ('B', 'Female', 'GSM1145432', 'GSM1145433'),
    ('C', 'Female', 'GSM1145434', 'GSM1145435'),
    ('D', 'Male', 'GSM1145436', 'GSM1145437'),
    ('E', 'Male', 'GSM1145438', 'GSM1145439'),
    ('F', 'Male', 'GSM1145440', 'GSM1145441'),
]
MIN_PAIRS = 4

# Pathway groups, curated from the GPL140 gene names. HOUSEKEEPING are the
# normalisation genes named in the study protocol and are excluded from testing.
HOUSEKEEPING = {'905', '16', '901', '902'}  # UBC, GAPDH, TUBA1, HLA-C


def load_values():
    cols = {}
    for f in sorted((RAW / 'GLDS-53_microarray_E-GEOD-47126.processed').glob('*_sample_table.txt')):
        s = pd.read_csv(f, sep='\t', dtype={'Reporter Identifier': str})
        cols[f.name.split('_')[0]] = s.set_index('Reporter Identifier')['VALUE'].astype(float)
    return pd.DataFrame(cols)


def load_annotation():
    t = (RAW / 'GPL140_annotation.txt').read_text()
    i = t.index('ID\tGENE_NAME')
    return pd.read_csv(io.StringIO(t[i:]), sep='\t', dtype=str).set_index('ID')


def load_published():
    lines = (RAW / 'GLDS-53_microarray_E-GEOD-47126.additional' / 'GSE47126_Fold_change_data.txt').read_text().split('\n')
    rows = [l.split('\t') for l in lines[4:] if l.strip() and l.split('\t')[0]]
    out = {}
    for r in rows:
        num = lambda x: float(x) if x not in ('', 'null') else None
        out[r[0]] = {
            'pre': [num(x) for x in r[2:8]],
            'post': [num(x) for x in r[8:14]],
            'log2ratio': num(r[17]),
            'p': num(r[20]) if len(r) > 20 else None,
        }
    return out


def load_symbols():
    """Current HGNC symbols and pathway groups, curated by hand from GPL140 names and Entrez IDs."""
    t = pd.read_csv(ROOT / 'gpl140_symbols.tsv', sep='\t', dtype=str)
    return dict(zip(t.id, t.symbol)), dict(zip(t.id, t.group))


def bh(p):
    p = np.asarray(p, float)
    n = len(p)
    order = np.argsort(p)
    ranked = p[order] * n / (np.arange(n) + 1)
    q = np.minimum.accumulate(ranked[::-1])[::-1]
    out = np.empty(n)
    out[order] = np.minimum(q, 1)
    return out


def main():
    V = load_values()
    ann = load_annotation()
    pub = load_published()
    SYM, GROUP = load_symbols()
    assert set(SYM) == set(V.index), 'symbol table must cover every probe'

    # Check: the per-astronaut values in the authors' fold-change table must equal the sample tables.
    mism = 0
    for gid, rec in pub.items():
        for k, (_, _, pre, post) in enumerate(CREW):
            for col, val in ((pre, rec['pre'][k]), (post, rec['post'][k])):
                v = V.at[gid, col] if gid in V.index else np.nan
                if (val is None) != np.isnan(v) or (val is not None and abs(val - v) > 1e-9):
                    mism += 1
    print('cross-check mismatches between sample tables and published table:', mism)

    genes = []
    for gid in V.index:
        pre = np.array([V.at[gid, c[2]] for c in CREW])
        post = np.array([V.at[gid, c[3]] for c in CREW])
        ok = ~np.isnan(pre) & ~np.isnan(post)
        d = np.where(ok, np.log2(post + 1) - np.log2(pre + 1), np.nan)
        n = int(ok.sum())
        row = ann.loc[gid]
        rec = {
            'id': gid,
            'symbol': SYM[gid],
            'group': GROUP[gid],
            'name': str(row['GENE_NAME']).split(';')[0].strip(),
            'gb': row['GB_LIST'],
            'pre': [None if np.isnan(x) else round(float(np.log2(x + 1)), 4) for x in pre],
            'post': [None if np.isnan(x) else round(float(np.log2(x + 1)), 4) for x in post],
            'lfc': [None if np.isnan(x) else round(float(x), 4) for x in d],
            'n': n,
            'mean': round(float(np.nanmean(d)), 4) if n else None,
            'up': int(np.sum(d[ok] > 0)),
            'down': int(np.sum(d[ok] < 0)),
            'housekeeping': GROUP[gid] == 'Reference',
            'pubLog2': pub.get(gid, {}).get('log2ratio'),
            'pubP': pub.get(gid, {}).get('p'),
            't': None,
            'p': None,
            'pW': None,
            'q': None,
        }
        if n >= MIN_PAIRS and GROUP[gid] != 'Reference':
            dd = d[ok]
            if np.allclose(dd, dd[0]):
                rec['t'], rec['p'] = None, 1.0 if dd[0] == 0 else None
            else:
                t = stats.ttest_1samp(dd, 0.0)
                rec['t'], rec['p'] = round(float(t.statistic), 4), float(t.pvalue)
            nz = dd[dd != 0]
            if len(nz) >= 1:
                rec['pW'] = float(stats.wilcoxon(nz, alternative='two-sided', method='exact').pvalue) if len(nz) >= 2 else 1.0
        genes.append(rec)

    tested = [g for g in genes if g['p'] is not None]
    q = bh([g['p'] for g in tested])
    for g, qq in zip(tested, q):
        g['q'] = float(qq)

    full6 = [g for g in genes if g['n'] == 6 and not g['housekeeping']]
    moved = [g for g in full6 if g['up'] + g['down'] == 6]
    unanimous = [g for g in moved if g['up'] == 6 or g['down'] == 6]

    summary = {
        'nProbes': len(genes),
        'nTested': len(tested),
        'nFull6': len(full6),
        'nFull6Moved': len(moved),
        'nUnanimous': len(unanimous),
        'unanimous': [g['symbol'] for g in unanimous],
        'nP05': sum(1 for g in tested if g['p'] < 0.05),
        'nQ05': sum(1 for g in tested if g['q'] < 0.05),
        'nQ10': sum(1 for g in tested if g['q'] < 0.10),
        'minQ': min(g['q'] for g in tested) if tested else None,
        'detectedPerSample': {c: int(V[c].notna().sum()) for c in V.columns},
        'nPubP05': sum(1 for g in genes if g['pubP'] is not None and g['pubP'] < 0.05),
    }

    for g in genes:
        for k in ('p', 'pW', 'q', 'pubP'):
            if g[k] is not None:
                g[k] = float(f"{g[k]:.4g}")

    payload = {
        'source': {
            'osd': 'OSD-53',
            'glds': 'GLDS-53',
            'geo': 'GSE47126',
            'platform': 'GPL140 Atlas Human Stress Array',
            'doi': '10.25966/qsf7-cr81',
            'paperDoi': '10.1038/npjmgrav.2016.39',
        },
        'astronauts': [{'id': c[0], 'sex': c[1], 'preSample': c[2], 'postSample': c[3]} for c in CREW],
        'summary': summary,
        'genes': [g for g in genes if g['n'] > 0],
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, separators=(',', ':')))
    print(json.dumps(summary, indent=1))
    top = sorted(tested, key=lambda g: g['p'])[:25]
    for g in top:
        print(f"{g['id']:>5} {g['symbol']:<12} n={g['n']} up={g['up']} down={g['down']} mean={g['mean']:+.3f} p={g['p']:.4f} pW={g['pW']} q={g['q']:.3f} pubP={g['pubP']} pubL2={g['pubLog2']}")


if __name__ == '__main__':
    main()
