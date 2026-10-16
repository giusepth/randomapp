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
    <main className="container">
      <header>
        <h1>🎲 Sorteador de Jurados</h1>
        <p>Ingresa los participantes (un nombre por línea) y elige cuántos jurados sortear.</p>
      </header>

      <section className="panel">
        <div className="list-header">
          <h2>Participantes</h2>
          <span className="badge">{pool.length}</span>
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

      <section className="panel">
        <h2>Configuración</h2>
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
        <button className="primary" onClick={draw} disabled={drawing}>
          {drawing ? 'Sorteando…' : '🎯 Sortear'}
        </button>
        {error && <p className="error">{error}</p>}
      </section>

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
          <button className="modal-close" onClick={closeModal} aria-label="Cerrar">
            ✕
          </button>

          <h2 id="winner-title">
            {drawing ? '🎲 Sorteando jurados…' : '🏆 Jurados seleccionados'}
          </h2>

          <ol className={`winner-list ${winnerSizeClass(amount)} ${drawing ? 'is-drawing' : ''}`}>
            {winners.map((name, i) => (
              <li key={`${name}-${i}`}>
                {winners.length > 1 && <span className="rank">{i + 1}</span>}
                <span className="name">{name}</span>
              </li>
            ))}
          </ol>

          <div className="modal-actions">
            <button className="ghost" onClick={copyResults} disabled={drawing || !winners.length}>
              Copiar resultado
            </button>
            <button className="primary compact" onClick={closeModal}>
              Cerrar
            </button>
          </div>
        </div>
      </dialog>

      <footer>MVP — sin base de datos ni persistencia: todo queda en memoria.</footer>
    </main>
  )
}

export default App
