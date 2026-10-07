import { useMemo, useState } from 'react'
import data from '../data/glds53.json'
import { STUDY } from '../data/study'

interface Gene {
  id: string
  symbol: string
  name: string
  group: string
  pubP: number | null
  housekeeping: boolean
  pre: (number | null)[]
  post: (number | null)[]
  lfc: (number | null)[]
  n: number
  mean: number | null
  t: number | null
  p: number | null
  q: number | null
  up: number
  down: number
}

const genes = data.genes as Gene[]
const testedGenes = genes.filter((g) => g.p !== null)
const crew = data.astronauts as { id: string; sex: string }[]

const pFmt = (p: number | null) => (p === null ? '–' : p < 0.001 ? p.toExponential(1).replace('e', '×10^') : p.toFixed(3))
const sup = (s: string) => {
  const [a, b] = s.split('^')
  return b ? (
    <>
      {a}
      <sup>{b}</sup>
    </>
  ) : (
    s
  )
}
const lfcFmt = (x: number | null) => (x === null ? '–' : `${x > 0 ? '+' : x < 0 ? '−' : ''}${Math.abs(x).toFixed(2)}`)

/** Diverging fill: down toward the deep end of the limb gradient, up toward the warm end. */
function heatFill(x: number | null, cap: number) {
  if (x === null) return 'url(#hatch)'
  const t = Math.min(1, Math.abs(x) / cap)
  const pct = Math.round(t * 92)
  return x < 0 ? `color-mix(in oklab, var(--limb-1) ${pct}%, var(--surface))` : `color-mix(in oklab, var(--limb-3) ${pct}%, var(--surface))`
}

export function Evidence() {
  const ranked = useMemo(() => [...testedGenes].sort((a, b) => (a.p ?? 2) - (b.p ?? 2)), [])
  const [showAll, setShowAll] = useState(false)
  const [selected, setSelected] = useState<string>(ranked[0]?.symbol ?? '')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<'p' | 'mean' | 'symbol'>('p')
  const gene = genes.find((g) => g.symbol === selected) ?? ranked[0]

  const table = useMemo(() => {
    const q = query.trim().toLowerCase()
    const rows = (showAll ? genes : testedGenes).filter((g) => !q || g.symbol.toLowerCase().includes(q) || g.name.toLowerCase().includes(q))
    return rows.sort((a, b) =>
      sort === 'symbol'
        ? a.symbol.localeCompare(b.symbol)
        : sort === 'mean'
          ? Math.abs(b.mean ?? 0) - Math.abs(a.mean ?? 0)
          : (a.p ?? 2) - (b.p ?? 2) || a.symbol.localeCompare(b.symbol),
    )
  }, [query, sort, showAll])

  if (!genes.length) {
    return (
      <div className="panel">
        <h1>Evidence</h1>
        <p className="ink2">The GLDS-53 data file is missing from this build.</p>
      </div>
    )
  }

  const top = ranked.slice(0, 24)
  const cap = 2

  return (
    <div className="stack" style={{ gap: 28 }}>
      <div className="page-head">
        <div>
          <h1>What one flight did to six astronauts’ blood</h1>
          <p>{STUDY.lede}</p>
        </div>
      </div>

      <div className="ev-facts">
        {STUDY.facts.map((f) => (
          <div key={f.label}>
            <div className="v num">{f.value}</div>
            <div className="xsmall ink2">{f.label}</div>
          </div>
        ))}
      </div>

      <section className="panel stack" aria-labelledby="heat-h">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h2 id="heat-h">Same flight, different responses</h2>
            <p className="small ink2" style={{ marginTop: 4 }}>
              {STUDY.heatLine}
            </p>
          </div>
          <HeatLegend cap={cap} />
        </div>
        <div className="scroll-x">
          <Heatmap rows={top} cap={cap} selected={gene.symbol} onSelect={setSelected} />
        </div>
      </section>

      <div className="ev-grid">
        <section className="panel stack" aria-labelledby="gene-h">
          <div>
            <h2 id="gene-h">{gene.symbol}</h2>
            <p className="xsmall muted" style={{ marginTop: 2 }}>
              {gene.name}. {gene.group}.
            </p>
            <p className="small ink2 num" style={{ marginTop: 6 }}>
              {gene.p !== null ? (
                <>
                  Mean change {lfcFmt(gene.mean)} log2, paired t-test p {sup(pFmt(gene.p))}, FDR q {sup(pFmt(gene.q))}. Up in {gene.up} of {gene.n}, down in {gene.down}.
                </>
              ) : (
                <>
                  Measured in {gene.n} of 6 astronauts, too few to test. Up in {gene.up}, down in {gene.down}.
                </>
              )}
            </p>
          </div>
          <Slope gene={gene} />
          <p className="xsmall muted">Each line is one astronaut, from ten days before launch to two to three hours after landing. Axis is log2(value + 1).</p>
        </section>

        <section className="panel stack" aria-labelledby="agree-h">
          <div>
            <h2 id="agree-h">How often the crew agreed</h2>
            <p className="small ink2" style={{ marginTop: 4 }}>
              {STUDY.agreeLine}
            </p>
          </div>
          <Agreement />
          <p className="xsmall muted">{STUDY.agreeFoot}</p>
        </section>
      </div>

      <section className="panel stack" aria-labelledby="vol-h">
        <div>
          <h2 id="vol-h">Every tested gene</h2>
          <p className="small ink2" style={{ marginTop: 4 }}>
            {STUDY.volcanoLine}
          </p>
        </div>
        <Volcano selected={gene.symbol} onSelect={setSelected} />
      </section>

      <section className="panel stack" aria-labelledby="link-h">
        <h2 id="link-h">From the lab to your check-in</h2>
        <p className="small ink2">
          Crew cannot run a transcriptome on orbit. What they can do is watch the signs these pathways show up as. Each pathway the study found changed
          maps to something Tether asks about every day.
        </p>
        <div className="pw-list">
          <div className="pw-row pw-head xsmall ink2" aria-hidden="true">
            <span>Pathway in GLDS-53</span>
            <span>Genes on this array</span>
            <span>What crew can watch</span>
          </div>
          {STUDY.pathways.map((p) => (
            <div key={p.name} className="pw-row">
              <h3 className="small">{p.name}</h3>
              <p className="small ink2 num">{p.genes}</p>
              <p className="small">{p.watch}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="panel stack" aria-labelledby="tbl-h">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h2 id="tbl-h">{showAll ? 'Every gene on the array' : 'Tested genes'}</h2>
          <div className="row">
            <label className="row small ink2" style={{ gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} style={{ accentColor: 'var(--ink)' }} />
              Show all {genes.length}
            </label>
            <input className="input" style={{ width: 180, height: 36 }} placeholder="Find a gene" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Find a gene" />
            <div className="seg" role="radiogroup" aria-label="Sort by">
              {(
                [
                  ['p', 'p-value'],
                  ['mean', 'Size'],
                  ['symbol', 'Name'],
                ] as const
              ).map(([k, l]) => (
                <button key={k} role="radio" aria-checked={sort === k} onClick={() => setSort(k)}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="scroll-x" style={{ maxHeight: 520, overflowY: 'auto' }}>
          <table className="table gene-table num">
            <thead style={{ position: 'sticky', top: 0, background: 'var(--surface)' }}>
              <tr>
                <th>Gene</th>
                {crew.map((c) => (
                  <th key={c.id} style={{ textAlign: 'right' }}>
                    {c.id}
                  </th>
                ))}
                <th style={{ textAlign: 'right' }}>Mean</th>
                <th style={{ textAlign: 'right' }}>p</th>
                <th style={{ textAlign: 'right' }}>q</th>
                <th style={{ textAlign: 'right' }}>Published p</th>
              </tr>
            </thead>
            <tbody>
              {table.map((g) => (
                <tr key={g.symbol} className={`gene-row ${g.symbol === gene.symbol ? 'sel' : ''}`} onClick={() => setSelected(g.symbol)}>
                  <td className="gene">
                    <button className="btn ghost" style={{ height: 'auto', padding: 0, color: 'inherit' }} onClick={() => setSelected(g.symbol)}>
                      {g.symbol}
                    </button>
                  </td>
                  {g.lfc.map((x, i) => (
                    <td key={i} style={{ textAlign: 'right', color: x === null ? 'var(--muted)' : undefined }}>
                      {lfcFmt(x)}
                    </td>
                  ))}
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{lfcFmt(g.mean)}</td>
                  <td style={{ textAlign: 'right' }}>{sup(pFmt(g.p))}</td>
                  <td style={{ textAlign: 'right' }}>{sup(pFmt(g.q))}</td>
                  <td style={{ textAlign: 'right' }} className="muted">
                    {sup(pFmt(g.pubP))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="xsmall muted">Values are log2 post-flight over pre-flight for each astronaut. {STUDY.tableFoot}</p>
      </section>
    </div>
  )
}

function HeatLegend({ cap }: { cap: number }) {
  return (
    <div className="xsmall ink2" style={{ display: 'grid', gap: 4, justifyItems: 'center' }}>
      <div
        className="legend-grad"
        style={{
          background: `linear-gradient(90deg, ${heatFill(-cap, cap)}, var(--surface) 50%, ${heatFill(cap, cap)})`,
          border: '1px solid var(--line)',
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', width: 160 }} className="num">
        <span>Down {cap}</span>
        <span>0</span>
        <span>Up {cap}</span>
      </div>
    </div>
  )
}

function Heatmap({ rows, cap, selected, onSelect }: { rows: Gene[]; cap: number; selected: string; onSelect: (s: string) => void }) {
  const cw = 54
  const ch = 20
  const lw = 92
  const cols = [...crew.map((c) => c.id), 'Mean']
  const w = lw + cols.length * cw + 8
  const h = 26 + rows.length * ch
  return (
    <svg className="chart" viewBox={`0 0 ${w} ${h}`} style={{ minWidth: 420, maxWidth: w * 1.4 }} role="img" aria-label="Heat map of change per astronaut for the genes with the smallest p-values">
      <defs>
        <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="6" height="6" fill="var(--surface-2)" />
          <line x1="0" y1="0" x2="0" y2="6" stroke="var(--line)" strokeWidth="2.5" />
        </pattern>
      </defs>
      {cols.map((c, j) => (
        <text key={c} x={lw + j * cw + cw / 2} y={14} textAnchor="middle" style={{ fontWeight: j === cols.length - 1 ? 700 : 500, fill: 'var(--ink-2)' }}>
          {c}
        </text>
      ))}
      {rows.map((g, i) => {
        const y = 22 + i * ch
        const vals = [...g.lfc, g.mean]
        const isSel = g.symbol === selected
        return (
          <g key={g.symbol} onClick={() => onSelect(g.symbol)} style={{ cursor: 'pointer' }}>
            <text x={lw - 8} y={y + ch / 2 + 3.5} textAnchor="end" style={{ fill: isSel ? 'var(--ink)' : 'var(--ink-2)', fontWeight: isSel ? 700 : 500 }}>
              {g.symbol}
            </text>
            {vals.map((v, j) => (
              <rect
                key={j}
                x={lw + j * cw + (j === cols.length - 1 ? 4 : 0)}
                y={y}
                width={cw}
                height={ch}
                rx={j === cols.length - 1 ? 3 : 0}
                className="heat-cell"
                style={{ fill: heatFill(v, cap) }}
              >
                <title>{`${g.symbol}, ${cols[j]}: ${lfcFmt(v)} log2`}</title>
              </rect>
            ))}
            {isSel && <rect x={lw - 2} y={y} width={cols.length * cw + 8} height={ch} fill="none" stroke="var(--ink)" strokeWidth="1.5" rx="3" />}
          </g>
        )
      })}
    </svg>
  )
}

function Slope({ gene }: { gene: Gene }) {
  const w = 420
  const h = 240
  const pad = { l: 44, r: 70, t: 14, b: 28 }
  const pairs = crew.map((c, i) => ({ id: c.id, a: gene.pre[i], b: gene.post[i] }))
  const vals = pairs.flatMap((p) => [p.a, p.b]).filter((v): v is number => v !== null)
  let lo = Math.min(...vals)
  let hi = Math.max(...vals)
  if (hi - lo < 0.5) {
    lo -= 0.25
    hi += 0.25
  }
  const y = (v: number) => pad.t + (1 - (v - lo) / (hi - lo)) * (h - pad.t - pad.b)
  const x0 = pad.l + 30
  const x1 = w - pad.r - 30
  const ticks = niceTicks(lo, hi, 4)
  // Keep end labels at least 12 px apart so close values stay readable.
  const labelY = new Map<string, number>()
  const ends = pairs.filter((p) => p.a !== null && p.b !== null).map((p) => ({ id: p.id, y: y(p.b!) })).sort((a, b) => a.y - b.y)
  let prev = -Infinity
  for (const e of ends) {
    const yy = Math.max(e.y, prev + 12)
    labelY.set(e.id, yy)
    prev = yy
  }
  return (
    <svg className="chart" viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`Pre-flight and post-flight values of ${gene.symbol} for each astronaut`}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={w - pad.r} y1={y(t)} y2={y(t)} className="grid" />
          <text x={pad.l - 6} y={y(t) + 3} textAnchor="end">
            {t.toFixed(1)}
          </text>
        </g>
      ))}
      <text x={x0} y={h - 8} textAnchor="middle" style={{ fill: 'var(--ink-2)', fontWeight: 600 }}>
        Before flight
      </text>
      <text x={x1} y={h - 8} textAnchor="middle" style={{ fill: 'var(--ink-2)', fontWeight: 600 }}>
        After landing
      </text>
      {pairs.map((p) => {
        if (p.a === null || p.b === null) return null
        const up = p.b > p.a
        const ly = labelY.get(p.id) ?? y(p.b)
        const col = up ? 'var(--limb-3)' : 'var(--limb-1)'
        return (
          <g key={p.id}>
            <line x1={x0} x2={x1} y1={y(p.a)} y2={y(p.b)} stroke={col} strokeWidth="2" strokeLinecap="round" />
            <circle cx={x0} cy={y(p.a)} r="4" fill="var(--surface)" stroke={col} strokeWidth="2" />
            <circle cx={x1} cy={y(p.b)} r="4" fill={col} />
            <text x={x1 + 10} y={ly + 3.5} style={{ fill: 'var(--ink-2)' }}>
              {p.id} {lfcFmt(p.b - p.a)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function Agreement() {
  const n = crew.length
  const moved = testedGenes.filter((g) => g.n === n && g.up + g.down === n)
  const bins = Array.from({ length: n + 1 }, (_, k) => moved.filter((g) => g.up === k).length)
  const max = Math.max(...bins)
  const w = 420
  const h = 220
  const pad = { l: 34, r: 8, t: 18, b: 40 }
  const bw = (w - pad.l - pad.r) / bins.length
  const y = (v: number) => pad.t + (1 - v / max) * (h - pad.t - pad.b)
  return (
    <svg className="chart" viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Number of genes by how many astronauts showed an increase">
      {niceTicks(0, max, 4).map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={w - pad.r} y1={y(t)} y2={y(t)} className="grid" />
          <text x={pad.l - 6} y={y(t) + 3} textAnchor="end">
            {t}
          </text>
        </g>
      ))}
      {bins.map((b, k) => {
        const unanimous = k === 0 || k === n
        return (
          <g key={k}>
            <rect
              x={pad.l + k * bw + 5}
              y={y(b)}
              width={bw - 10}
              height={Math.max(0, h - pad.b - y(b))}
              rx="3"
              fill={unanimous ? (k === 0 ? 'var(--limb-1)' : 'var(--limb-3)') : 'color-mix(in oklab, var(--muted) 45%, var(--surface))'}
            />
            <text x={pad.l + k * bw + bw / 2} y={y(b) - 5} textAnchor="middle" style={{ fill: 'var(--ink)', fontWeight: 600 }}>
              {b}
            </text>
            <text x={pad.l + k * bw + bw / 2} y={h - pad.b + 15} textAnchor="middle">
              {k} up
            </text>
          </g>
        )
      })}
      <text x={pad.l + (w - pad.l - pad.r) / 2} y={h - 6} textAnchor="middle" style={{ fill: 'var(--ink-2)' }}>
        Astronauts with an increase, out of {n}
      </text>
    </svg>
  )
}

function Volcano({ selected, onSelect }: { selected: string; onSelect: (s: string) => void }) {
  const pts = testedGenes.filter((g) => g.mean !== null)
  const w = 760
  const h = 300
  const pad = { l: 46, r: 16, t: 12, b: 38 }
  const xm = Math.max(1, ...pts.map((g) => Math.abs(g.mean!))) * 1.08
  const ym = Math.max(2, ...pts.map((g) => -Math.log10(g.p!))) * 1.08
  const x = (v: number) => pad.l + ((v + xm) / (2 * xm)) * (w - pad.l - pad.r)
  const y = (v: number) => pad.t + (1 - v / ym) * (h - pad.t - pad.b)
  const p05 = -Math.log10(0.05)
  return (
    <div className="scroll-x">
      <svg className="chart" viewBox={`0 0 ${w} ${h}`} style={{ minWidth: 520 }} role="img" aria-label="Mean change against significance for every gene">
        {niceTicks(-xm, xm, 6).map((t) => (
          <g key={`x${t}`}>
            <line x1={x(t)} x2={x(t)} y1={pad.t} y2={h - pad.b} className="grid" />
            <text x={x(t)} y={h - pad.b + 14} textAnchor="middle">
              {t.toFixed(1)}
            </text>
          </g>
        ))}
        {niceTicks(0, ym, 4).map((t) => (
          <g key={`y${t}`}>
            <text x={pad.l - 6} y={y(t) + 3} textAnchor="end">
              {t.toFixed(1)}
            </text>
          </g>
        ))}
        <line x1={pad.l} x2={w - pad.r} y1={y(p05)} y2={y(p05)} stroke="var(--watch)" strokeDasharray="4 4" />
        <text x={w - pad.r} y={y(p05) - 5} textAnchor="end" style={{ fill: 'var(--watch)' }}>
          p = 0.05
        </text>
        <text x={pad.l + (w - pad.l - pad.r) / 2} y={h - 4} textAnchor="middle" style={{ fill: 'var(--ink-2)' }}>
          Mean change after flight, log2
        </text>
        <text transform={`translate(12 ${pad.t + (h - pad.t - pad.b) / 2}) rotate(-90)`} textAnchor="middle" style={{ fill: 'var(--ink-2)' }}>
          −log10 p
        </text>
        {pts.map((g) => {
          const sig = (g.p ?? 1) < 0.05
          const isSel = g.symbol === selected
          return (
            <circle
              key={g.symbol}
              cx={x(g.mean!)}
              cy={y(-Math.log10(g.p!))}
              r={isSel ? 6 : sig ? 4 : 2.6}
              fill={sig ? (g.mean! > 0 ? 'var(--limb-3)' : 'var(--limb-1)') : 'color-mix(in oklab, var(--muted) 50%, var(--surface))'}
              stroke={isSel ? 'var(--ink)' : 'var(--surface)'}
              strokeWidth={isSel ? 2 : 1}
              style={{ cursor: 'pointer' }}
              onClick={() => onSelect(g.symbol)}
            >
              <title>{`${g.symbol}: ${lfcFmt(g.mean)} log2, p ${pFmt(g.p).replace('^', '')}`}</title>
            </circle>
          )
        })}
        {pts
          .filter((g) => (g.p ?? 1) < 0.01 || g.symbol === selected)
          .map((g) => (
            <text key={`l${g.symbol}`} x={x(g.mean!) + 7} y={y(-Math.log10(g.p!)) + 3} style={{ fill: 'var(--ink)', fontWeight: 600 }}>
              {g.symbol}
            </text>
          ))}
      </svg>
    </div>
  )
}

function niceTicks(lo: number, hi: number, n: number) {
  const span = hi - lo
  const step0 = span / n
  const mag = Math.pow(10, Math.floor(Math.log10(step0)))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => span / s <= n) ?? 10 * mag
  const out: number[] = []
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(Math.round(v * 1e6) / 1e6)
  return out
}
