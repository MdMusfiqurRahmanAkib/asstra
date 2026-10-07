import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../context'
import { DOMAINS, INDICATORS, SYMPTOMS, type Indicator, type SymptomId } from '../lib/indicators'
import { flightDay, formatDate, type Entry } from '../lib/store'
import { baselineFor, median } from '../lib/baseline'
import { fmt, fmtNum } from '../lib/format'
import { Vigilance } from '../components/Vigilance'
import { IconTimer } from '../components/Icons'

type Draft = Record<string, string>

export function CheckIn() {
  const { state, today, upsertEntry, deleteEntry, toast, go } = useApp()
  const [date, setDate] = useState(today)
  const existing = state.entries.find((e) => e.date === date)
  const [draft, setDraft] = useState<Draft>({})
  const [symptoms, setSymptoms] = useState<SymptomId[]>([])
  const [dose, setDose] = useState('')
  const [note, setNote] = useState('')
  const [pvt, setPvt] = useState(false)

  useEffect(() => {
    const d: Draft = {}
    for (const ind of INDICATORS) {
      const v = existing?.values[ind.id]
      if (typeof v === 'number' && ind.id !== 'symptoms') d[ind.id] = ind.kind === 'number' ? fmtNum(v, ind) : String(v)
    }
    setDraft(d)
    setSymptoms(existing?.symptoms ?? [])
    setDose(existing?.doseCum !== undefined ? String(existing.doseCum) : '')
    setNote(existing?.note ?? '')
  }, [date, existing])

  const usual = useMemo(() => {
    const out: Record<string, number | undefined> = {}
    for (const ind of INDICATORS) {
      const b = baselineFor(ind, state.entries, state.profile, date)
      out[ind.id] = b.length >= 5 ? median(b) : undefined
    }
    return out
  }, [state.entries, state.profile, date])

  const set = (id: string, v: string) => setDraft((d) => ({ ...d, [id]: v }))
  const toggleSym = (id: SymptomId) => setSymptoms((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  const filled = Object.values(draft).filter((v) => v !== '').length
  const fd = flightDay(date, state.profile)

  const save = () => {
    const values: Entry['values'] = {}
    for (const ind of INDICATORS) {
      if (ind.id === 'symptoms') continue
      const raw = draft[ind.id]
      if (raw === undefined || raw === '') continue
      const n = Number(raw)
      if (Number.isFinite(n)) values[ind.id] = n
    }
    values.symptoms = symptoms.length
    const d = dose.trim() === '' ? undefined : Number(dose)
    upsertEntry({ date, values, symptoms, doseCum: Number.isFinite(d) ? d : undefined, note: note.trim() || undefined })
    toast('Check-in saved')
    go('status')
  }

  return (
    <div className="stack" style={{ gap: 28 }}>
      <div className="page-head">
        <div>
          <h1>Check in</h1>
          <p>About two minutes. Skip anything you did not measure; partial check-ins still count.</p>
        </div>
        <div className="field" style={{ minWidth: 180 }}>
          <label htmlFor="ci-date">Day</label>
          <input id="ci-date" type="date" className="input num" value={date} max={today} onChange={(e) => e.target.value && setDate(e.target.value)} />
          <span className="hint num">
            {formatDate(date, { weekday: 'short', day: 'numeric', month: 'short' })}
            {fd ? `, flight day ${fd}` : ''}
            {existing ? ', editing saved entry' : ''}
          </span>
        </div>
      </div>

      {DOMAINS.map((d) => {
        const inds = INDICATORS.filter((i) => i.domain === d.id)
        return (
          <section key={d.id} className="panel flat ci-sec" aria-labelledby={`ci-${d.id}`}>
            <div className="ci-sec-head">
              <h2 id={`ci-${d.id}`} className="h3">
                {d.name}
              </h2>
              {d.id === 'mind' && (
                <button className="btn" onClick={() => setPvt(true)}>
                  <IconTimer />
                  Run vigilance test
                </button>
              )}
            </div>
            <div className="ci-grid">
              {inds.map((ind) =>
                ind.id === 'symptoms' ? (
                  <div key={ind.id} className="field ci-wide">
                    <span className="label" id="sym-l">
                      Immune symptoms today
                    </span>
                    <div className="sym-list" role="group" aria-labelledby="sym-l">
                      {SYMPTOMS.map((s) => (
                        <button key={s.id} className="sym" aria-pressed={symptoms.includes(s.id)} onClick={() => toggleSym(s.id)}>
                          {s.label}
                        </button>
                      ))}
                    </div>
                    <span className="hint">{symptoms.length ? `${symptoms.length} selected` : 'None selected means none today.'}</span>
                  </div>
                ) : (
                  <IndicatorField key={ind.id} ind={ind} value={draft[ind.id] ?? ''} usual={usual[ind.id]} onChange={(v) => set(ind.id, v)} />
                ),
              )}
              {d.id === 'body' && (
                <div className="field">
                  <label htmlFor="ci-dose">Dosimeter, mission total</label>
                  <div className="unit-input">
                    <input id="ci-dose" className="input num" inputMode="decimal" value={dose} onChange={(e) => setDose(e.target.value)} placeholder="0.0" />
                    <span className="muted small">mSv</span>
                  </div>
                  <span className="hint">Reading from your personal dosimeter.</span>
                </div>
              )}
            </div>
          </section>
        )
      })}

      <section className="panel flat ci-sec">
        <div className="field">
          <label htmlFor="ci-note">Note</label>
          <textarea id="ci-note" className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Anything that explains today: an EVA, a late call, a noisy fan." />
        </div>
      </section>

      <div className="ci-actions">
        <span className="small ink2 num">{filled + (symptoms.length ? 1 : 0)} fields filled</span>
        <div className="row">
          {existing && (
            <button
              className="btn ghost danger"
              onClick={() => {
                deleteEntry(date)
                toast('Check-in deleted')
              }}
            >
              Delete this day
            </button>
          )}
          <button className="btn primary" onClick={save}>
            Save check-in
          </button>
        </div>
      </div>

      {pvt && (
        <Vigilance
          onClose={() => setPvt(false)}
          onUse={(r) => {
            setDraft((d) => ({ ...d, reactionMs: String(r.medianMs), lapses: String(r.lapses) }))
            setPvt(false)
            toast('Test results added')
          }}
        />
      )}
    </div>
  )
}

function IndicatorField({ ind, value, usual, onChange }: { ind: Indicator; value: string; usual?: number; onChange: (v: string) => void }) {
  const id = `f-${ind.id}`
  const hint = usual !== undefined && ind.kind !== 'flag' ? `${ind.help} Usually ${fmt(usual, ind)}.` : ind.help

  if (ind.kind === 'scale') {
    return (
      <div className="field">
        <span className="label" id={`${id}-l`}>
          {ind.label}
        </span>
        <div className="scale" role="radiogroup" aria-labelledby={`${id}-l`}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} role="radio" aria-checked={value === String(n)} onClick={() => onChange(value === String(n) ? '' : String(n))} className="num">
              {n}
            </button>
          ))}
        </div>
        <span className="scale-ends xsmall muted">
          <span>{ind.scaleLabels![0]}</span>
          <span>{ind.scaleLabels![1]}</span>
        </span>
      </div>
    )
  }

  if (ind.kind === 'flag') {
    return (
      <div className="field">
        <span className="label" id={`${id}-l`}>
          {ind.label}
        </span>
        <div className="seg" role="radiogroup" aria-labelledby={`${id}-l`}>
          {[
            { v: '0', l: 'No' },
            { v: '1', l: 'Yes' },
          ].map((o) => (
            <button key={o.v} role="radio" aria-checked={value === o.v} onClick={() => onChange(value === o.v ? '' : o.v)}>
              {o.l}
            </button>
          ))}
        </div>
        <span className="hint">{ind.help}</span>
      </div>
    )
  }

  const nudge = (dir: 1 | -1) => {
    const cur = value === '' ? (usual ?? ind.min ?? 0) : Number(value)
    const next = Math.min(ind.max ?? Infinity, Math.max(ind.min ?? -Infinity, cur + dir * (ind.step ?? 1)))
    onChange(fmtNum(next, ind))
  }

  return (
    <div className="field">
      <label htmlFor={id}>{ind.label}</label>
      <div className="unit-input stepper">
        <button type="button" aria-label={`Decrease ${ind.label}`} onClick={() => nudge(-1)}>
          −
        </button>
        <input
          id={id}
          className="input num"
          inputMode="decimal"
          value={value}
          placeholder={usual !== undefined ? fmtNum(usual, ind) : ''}
          onChange={(e) => onChange(e.target.value.replace(',', '.'))}
        />
        <button type="button" aria-label={`Increase ${ind.label}`} onClick={() => nudge(1)}>
          +
        </button>
        {ind.unit && <span className="muted small unit">{ind.unit.replace('/', 'of ')}</span>}
      </div>
      <span className="hint">{hint}</span>
    </div>
  )
}
