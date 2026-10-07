import { useCallback, useEffect, useRef, useState } from 'react'
import { median } from '../lib/baseline'

/**
 * Brief psychomotor vigilance test (PVT-B, Basner, Mollicone and Dinges 2011): 3 minutes,
 * a counter appears 1 to 4 s after the previous response (including 1 s of feedback),
 * responses under 100 ms are false starts and responses over 355 ms are lapses.
 */
export const LAPSE_MS = 355
interface Result {
  medianMs: number
  lapses: number
  falseStarts: number
  trials: number
}

type Phase = 'intro' | 'wait' | 'go' | 'done'

export function Vigilance({ onClose, onUse }: { onClose: () => void; onUse: (r: Result) => void }) {
  const [duration, setDuration] = useState(180)
  const [phase, setPhase] = useState<Phase>('intro')
  const [counter, setCounter] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [lastRt, setLastRt] = useState<number | null>(null)
  const rts = useRef<number[]>([])
  const falseStarts = useRef(0)
  const startAt = useRef(0)
  const goAt = useRef(0)
  const timer = useRef<number | undefined>(undefined)
  const raf = useRef<number | undefined>(undefined)
  const [result, setResult] = useState<Result | null>(null)
  const padRef = useRef<HTMLButtonElement>(null)

  const finish = useCallback(() => {
    window.clearTimeout(timer.current)
    cancelAnimationFrame(raf.current!)
    const xs = rts.current
    setResult({
      medianMs: xs.length ? Math.round(median(xs)) : 0,
      lapses: xs.filter((x) => x > LAPSE_MS).length,
      falseStarts: falseStarts.current,
      trials: xs.length,
    })
    setPhase('done')
  }, [])

  const schedule = useCallback(() => {
    setPhase('wait')
    const wait = 1000 + Math.random() * 3000
    timer.current = window.setTimeout(() => {
      if (performance.now() - startAt.current > duration * 1000) return finish()
      goAt.current = performance.now()
      setPhase('go')
      const tick = () => {
        setCounter(Math.round(performance.now() - goAt.current))
        raf.current = requestAnimationFrame(tick)
      }
      raf.current = requestAnimationFrame(tick)
    }, wait)
  }, [duration, finish])

  const start = () => {
    rts.current = []
    falseStarts.current = 0
    startAt.current = performance.now()
    setLastRt(null)
    setElapsed(0)
    schedule()
    setTimeout(() => padRef.current?.focus(), 0)
  }

  const respond = useCallback(() => {
    if (phase === 'wait') {
      falseStarts.current += 1
      setLastRt(-1)
      return
    }
    if (phase !== 'go') return
    const rt = performance.now() - goAt.current
    cancelAnimationFrame(raf.current!)
    if (rt < 100) falseStarts.current += 1
    else rts.current.push(rt)
    setLastRt(Math.round(rt))
    if (performance.now() - startAt.current >= duration * 1000) finish()
    else schedule()
  }, [phase, duration, finish, schedule])

  useEffect(() => {
    if (phase !== 'wait' && phase !== 'go') return
    const id = window.setInterval(() => {
      const e = (performance.now() - startAt.current) / 1000
      setElapsed(e)
      if (e >= duration + 10 && phase === 'wait') finish()
    }, 250)
    return () => window.clearInterval(id)
  }, [phase, duration, finish])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.code === 'Space' && (phase === 'wait' || phase === 'go')) {
        e.preventDefault()
        respond()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, respond, onClose])

  useEffect(
    () => () => {
      window.clearTimeout(timer.current)
      cancelAnimationFrame(raf.current!)
    },
    [],
  )

  return (
    <div className="modal-scrim" role="dialog" aria-modal="true" aria-labelledby="pvt-h">
      <div className="modal">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h2 id="pvt-h">Vigilance test</h2>
          <button className="btn ghost" onClick={onClose}>
            Close
          </button>
        </div>

        {phase === 'intro' && (
          <div className="stack" style={{ marginTop: 12 }}>
            <p className="ink2">
              A counter appears at random moments. Tap the pad or press the space bar the moment you see it. Do not tap early. Run it at the
              same time each day so your results compare fairly. This is the 3-minute format validated for use in flight.
            </p>
            <div className="seg" role="radiogroup" aria-label="Test length">
              {[
                { v: 180, l: '3 minutes, standard' },
                { v: 60, l: '1 minute, practice' },
              ].map((o) => (
                <button key={o.v} role="radio" aria-checked={duration === o.v} onClick={() => setDuration(o.v)}>
                  {o.l}
                </button>
              ))}
            </div>
            {duration !== 180 && <p className="xsmall muted">Practice runs are shorter and are not saved to your log.</p>}
            <div>
              <button className="btn primary" onClick={start}>
                Start test
              </button>
            </div>
          </div>
        )}

        {(phase === 'wait' || phase === 'go') && (
          <>
            <div className="pvt-progress" aria-hidden="true">
              <span style={{ width: `${Math.min(100, (elapsed / duration) * 100)}%` }} />
            </div>
            <button ref={padRef} className={`pvt-pad ${phase}`} onPointerDown={respond} aria-label="Response pad">
              {phase === 'go' ? (
                <span className="pvt-count num">{counter}</span>
              ) : (
                <span className="pvt-wait small">{lastRt === -1 ? 'Too early. Wait for the counter.' : lastRt ? `${lastRt} ms` : 'Watch this space'}</span>
              )}
            </button>
            <p className="xsmall muted num">
              {Math.max(0, Math.ceil(duration - elapsed))} s left, {rts.current.length} responses
            </p>
          </>
        )}

        {phase === 'done' && result && (
          <div className="stack" style={{ marginTop: 12 }}>
            <div className="pvt-results">
              <div>
                <div className="rc-big num">{result.medianMs}</div>
                <div className="xsmall ink2">median ms</div>
              </div>
              <div>
                <div className="rc-big num">{result.lapses}</div>
                <div className="xsmall ink2">lapses over 355 ms</div>
              </div>
              <div>
                <div className="rc-big num">{result.falseStarts}</div>
                <div className="xsmall ink2">false starts</div>
              </div>
            </div>
            <p className="xsmall muted num">{result.trials} valid responses.</p>
            <div className="row">
              {duration === 180 && result.trials > 0 && (
                <button className="btn primary" onClick={() => onUse(result)}>
                  Add to check-in
                </button>
              )}
              <button className="btn" onClick={() => setPhase('intro')}>
                Run again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
