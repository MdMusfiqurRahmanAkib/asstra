import data from './glds53.json'

const s = data.summary
const tested = data.genes.filter((g) => g.p !== null).sort((a, b) => (a.p as number) - (b.p as number))
const hits = tested.filter((g) => (g.p as number) < 0.05)
const up = hits.filter((g) => (g.mean as number) > 0).map((g) => g.symbol)
const down = hits.filter((g) => (g.mean as number) < 0).map((g) => g.symbol)
const list = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`)
const others = s.nFull6Moved - s.nUnanimous

export const STUDY = {
  lede: `GeneLab study GLDS-53 measured 234 stress-response genes in the whole blood of six Space Shuttle astronauts, ten days before launch and two to three hours after landing. Astra re-analyses the deposited values one astronaut at a time.`,
  facts: [
    { value: '6', label: 'astronauts, 4 men and 2 women' },
    { value: '234', label: 'stress-response genes on the array' },
    { value: 'L−10, R+0', label: '10 days before launch, 2 to 3 hours after landing' },
    { value: String(s.nTested), label: 'genes measured in at least 4 astronauts' },
  ],
  heatLine: `Change after flight in each astronaut for the 24 genes with the strongest paired evidence. Grey cells were filtered out for that astronaut in the original data.`,
  agreeLine: `${s.nFull6Moved} genes were measured in all six astronauts and changed in every one of them. Only ${list(s.unanimous)} moved the same way in all six. The other ${others} rose in some astronauts and fell in others.`,
  agreeFoot:
    'This is the reason Astra compares you with your own baseline: the same flight pushed the same pathway in different directions in different people.',
  volcanoLine: `Each point is one of the ${s.nTested} genes measured in at least four astronauts. ${hits.length} reach p < 0.05 in a paired t-test: ${list(up)} up, ${list(down)} down. None survive correction for testing ${s.nTested} genes (smallest false discovery rate q = ${s.minQ.toFixed(2)}), so they are leads, not proof.`,
  tableFoot: `p is a two-sided paired t-test on log2(value + 1); q is the Benjamini-Hochberg false discovery rate across ${s.nTested} tested genes. Published p is the authors' own unpaired test from GSE47126.`,
  pathways: [
    {
      name: 'Protein folding and degradation',
      genes: 'HSPB1, HSP90AB1, BAG1, GLMN, HSPA6',
      watch: 'Temperature, symptoms and stress. Heat shock proteins answer the same stresses that come with fever, infection and strain.',
    },
    {
      name: 'DNA repair',
      genes: 'XRCC1, RAD23A, PCNA, MLH1',
      watch: 'Radiation dose against the career limit. DNA damage cannot be felt, so the dosimeter is the daily proxy.',
    },
    {
      name: 'Oxidative stress',
      genes: 'GPX1, CAT, CYB5R3',
      watch: 'Radiation dose, sleep and exercise load, the daily exposures that change oxidative load.',
    },
    {
      name: 'Stress signalling',
      genes: 'FOS, DDIT3',
      watch: 'Stress, mood and sleep. FOS is an early-response gene that rises within hours of acute stress, including landing.',
    },
  ],
  directionLine: `of the ${s.nFull6Moved} genes that changed in all six astronauts, only ${s.nUnanimous} moved the same way in all six.`,
  methodsLine: `Astra uses the processed values deposited in GLDS-53, which the authors background-subtracted and normalised to housekeeping genes, and checks that they match the authors' fold-change table exactly. For each astronaut the change is log2(post + 1) − log2(pre + 1). Genes measured in at least four astronauts (${s.nTested} of 234, the authors' own inclusion rule) are tested with a two-sided paired t-test, an exact Wilcoxon signed-rank test as a check, and Benjamini-Hochberg correction across the ${s.nTested} tests. Gene symbols were updated by hand from the platform annotation (GPL140). The script and inputs are in the project repository under analysis/.`,
  limitsLine:
    'Six astronauts on short Shuttle flights, one sample before and one after. The after sample was drawn two to three hours after landing, so it mixes the effects of flight with the stress of re-entry and landing. The original raw data were lost to hurricane damage, so only processed values exist, and three of the six astronauts have most genes filtered out. The array covers 234 stress genes, not the whole genome. The results here are hypotheses that shaped Astra’s design, not clinical markers.',
  extraRefs: [
    {
      text: 'Barger LK et al. Prevalence of sleep deficiency and use of hypnotic drugs in astronauts before, during, and after spaceflight. The Lancet Neurology (2014).',
      href: 'https://doi.org/10.1016/S1474-4422(14)70122-X',
      link: 'doi:10.1016/S1474-4422(14)70122-X',
    },
    {
      text: 'Basner M, Mollicone D, Dinges DF. Validity and sensitivity of a brief psychomotor vigilance test (PVT-B) to total and partial sleep deprivation. Acta Astronautica 69, 949–959 (2011).',
      href: 'https://doi.org/10.1016/j.actaastro.2011.07.015',
      link: 'doi:10.1016/j.actaastro.2011.07.015',
    },
    {
      text: 'Crucian B et al. Incidence of clinical symptoms during long-duration orbital spaceflight. International Journal of General Medicine 9, 383–391 (2016).',
      href: 'https://doi.org/10.2147/IJGM.S114188',
      link: 'doi:10.2147/IJGM.S114188',
    },
    {
      text: 'Mehta SK et al. Latent virus reactivation in astronauts on the International Space Station. npj Microgravity (2017).',
      href: 'https://doi.org/10.1038/s41526-017-0015-y',
      link: 'doi:10.1038/s41526-017-0015-y',
    },
    {
      text: 'NASA Office of the Chief Health and Medical Officer. Radiation protection technical brief, NASA-STD-3001 Volume 1 Rev B, requirement V1 4030.',
      href: 'https://www.nasa.gov/wp-content/uploads/2023/03/radiation-protection-technical-brief-ochmo.pdf',
      link: 'nasa.gov',
    },
    {
      text: 'NCBI GEO. Series GSE47126 and platform GPL140, Atlas Human Stress Array.',
      href: 'https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE47126',
      link: 'GSE47126',
    },
  ],
}
