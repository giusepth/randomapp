import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const DRAW_TICKS = 10
const DRAW_INTERVAL_MS = 80

function shuffleNames(names) {
  const pool = [...names]
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool
}

function parseNames(rawText) {
  return rawText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function dedupe(names) {
  return [...new Set(names)]
}

function winnerSizeClass(count) {
  if (count <= 1) return 'size-huge'
  if (count <= 4) return 'size-big'
  return 'size-many'
}

function App() {
  const [rawText, setRawText] = useState('')
  const [amount, setAmount] = useState(1)
  const [allowDuplicates, setAllowDuplicates] = useState(false)
  const [winners, setWinners] = useState([])
  const [error, setError] = useState('')
  const [drawing, setDrawing] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const dialogRef = useRef(null)
  const intervalRef = useRef(null)

  const parsed = useMemo(() => parseNames(rawText), [rawText])
  const pool = useMemo(
    () => (allowDuplicates ? parsed : dedupe(parsed)),
    [parsed, allowDuplicates],
  )

  // Keep the native <dialog> in sync with React state.
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (isModalOpen && !dialog.open) dialog.showModal()
    if (!isModalOpen && dialog.open) dialog.close()
  }, [isModalOpen])

  // Never leave a shuffle timer running behind us.
  useEffect(() => () => clearInterval(intervalRef.current), [])

  function stopShuffle() {
    clearInterval(intervalRef.current)
    intervalRef.current = null
  }

  function closeModal() {
    stopShuffle()
    setDrawing(false)
    setIsModalOpen(false)
  }

  function validate() {
    if (pool.length < 2) {
      return 'Debés ingresar al menos 2 nombres, uno por línea.'
    }
    if (!Number.isInteger(amount) || amount < 1) {
      return 'La cantidad de jurados debe ser un número entero mayor a 0.'
    }
    if (amount > pool.length) {
      return allowDuplicates
        ? `Solo hay ${pool.length} nombres disponibles.`
        : `Solo hay ${pool.length} nombres únicos. Podés activar "permitir repetidos" para sortear más.`
    }
    return ''
  }

  function draw() {
    const problem = validate()
    if (problem) {
      setWinners([])
      setError(problem)
      return
    }

    setError('')
    setDrawing(true)
    setIsModalOpen(true)

    // Fill the modal on the very first frame so it never opens empty.
    setWinners(shuffleNames(pool).slice(0, amount))

    let ticks = 0
    stopShuffle()
    intervalRef.current = setInterval(() => {
      ticks += 1
      const slice = shuffleNames(pool).slice(0, amount)
      if (ticks >= DRAW_TICKS) {
        stopShuffle()
        setWinners(slice)
        setDrawing(false)
        return
      }
      setWinners(slice)
    }, DRAW_INTERVAL_MS)
  }

  function copyResults() {
    const lines = winners.map((name, i) => `${i + 1}. ${name}`).join('\n')
    navigator.clipboard.writeText(lines)
  }

  return (
    <>
      {/*
        The masthead sits outside .container on purpose: its tinted band has to
        span the full viewport width, and .masthead-inner re-centres the content
        on the same column as the sheet below.
      */}
      <header className="masthead">
        <div className="masthead-inner">
          {/*
            Reserved brand zone.
            Replace the placeholder emblem inside .logo-zone with the real asset:
              <img className="logo" src="/logo.svg" alt="Nombre de la institución" />
            There is room for the institution name plus one or two logos; keep
            logos inside .logo-zone so the lockup stays balanced.
          */}
          <div className="brand">
            <div className="logo-zone">
              <svg
                className="emblem"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                focusable="false"
              >
                <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M7 9h10M7 13h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M7 17h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="17.5" cy="13" r="1.6" fill="currentColor" />
              </svg>
            </div>
            <div className="brand-text">
              <h1>Sorteador de Jurados</h1>
              {/* Institution name — replace with the real one. */}
              <p className="org-name">Institución</p>
            </div>
          </div>
          <p className="lede">
            Ingresa los participantes (un nombre por línea) y elige cuántos
            jurados sortear.
          </p>
        </div>
      </header>

      <main className="container">
        <div className="sheet">
          <section className="section">
            <div className="section-head">
              <h2 className="section-title">Participantes</h2>
              <span className="count">{pool.length}</span>
            </div>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={'Ana Gómez\nJuan Pérez\nMaría López\nPedro Ruiz'}
              rows={12}
            />
            <label className="check">
              <input
                type="checkbox"
                checked={allowDuplicates}
                onChange={(e) => setAllowDuplicates(e.target.checked)}
              />
              Permitir nombres repetidos
            </label>
          </section>

          <section className="section">
            <h2 className="section-title">Configuración</h2>
            <div className="row">
              <label htmlFor="amount">Cantidad de jurados</label>
              <input
                id="amount"
                type="number"
                min={1}
                max={pool.length || undefined}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </div>
            <button type="button" className="btn btn-primary" onClick={draw} disabled={drawing}>
              {drawing ? (
                'Sorteando…'
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
                    <polyline points="16 3 21 3 21 8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                    <polyline points="21 16 21 21 16 21" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="4" y1="20" x2="21" y2="3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                    <line x1="15" y1="15" x2="21" y2="21" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                    <line x1="4" y1="4" x2="9" y2="9" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                  </svg>
                  Sortear
                </>
              )}
            </button>
            {error && <p className="error">{error}</p>}
          </section>
        </div>

        <dialog
          ref={dialogRef}
          className="winner-modal"
          aria-labelledby="winner-title"
          onClose={closeModal}
          onClick={(e) => {
            if (e.target === dialogRef.current) closeModal()
          }}
        >
          <div className="modal-card">
            <div className="modal-head">
              <h2 id="winner-title" className="modal-title">
                {drawing ? 'Sorteando jurados…' : 'Jurados seleccionados'}
              </h2>
              <button type="button" className="modal-close" onClick={closeModal} aria-label="Cerrar">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <ol className={`winner-list ${winnerSizeClass(amount)} ${drawing ? 'is-drawing' : ''}`}>
              {winners.map((name, i) => (
                <li key={`${name}-${i}`}>
                  {winners.length > 1 && <span className="rank">{i + 1}</span>}
                  <span className="name">{name}</span>
                </li>
              ))}
            </ol>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={copyResults}
                disabled={drawing || !winners.length}
              >
                Copiar resultado
              </button>
              <button type="button" className="btn btn-primary btn-compact" onClick={closeModal}>
                Cerrar
              </button>
            </div>
          </div>
        </dialog>

        <footer className="footer">
          MVP — sin base de datos ni persistencia: todo queda en memoria.
        </footer>
      </main>
    </>
  )
}

export default App
