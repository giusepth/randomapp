import { useMemo, useState } from 'react'
import './App.css'

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

function App() {
  const [rawText, setRawText] = useState('')
  const [amount, setAmount] = useState(1)
  const [allowDuplicates, setAllowDuplicates] = useState(false)
  const [winners, setWinners] = useState([])
  const [error, setError] = useState('')
  const [drawing, setDrawing] = useState(false)

  const parsed = useMemo(() => parseNames(rawText), [rawText])
  const pool = useMemo(
    () => (allowDuplicates ? parsed : dedupe(parsed)),
    [parsed, allowDuplicates],
  )

  function draw() {
    if (pool.length < 2) {
      setWinners([])
      setError('Debés ingresar al menos 2 nombres, uno por línea.')
      return
    }
    if (!Number.isInteger(amount) || amount < 1) {
      setWinners([])
      setError('La cantidad de jurados debe ser un número entero mayor a 0.')
      return
    }
    if (amount > pool.length) {
      setWinners([])
      setError(
        allowDuplicates
          ? `Solo hay ${pool.length} nombres disponibles.`
          : `Solo hay ${pool.length} nombres únicos. Podés activar "permitir repetidos" para sortear más.`,
      )
      return
    }

    setError('')
    setDrawing(true)
    // Brief shuffle animation for suspense, then reveal winners.
    let ticks = 0
    const interval = setInterval(() => {
      setWinners(shuffleNames(pool).slice(0, amount))
      ticks += 1
      if (ticks >= 10) {
        clearInterval(interval)
        setWinners(shuffleNames(pool).slice(0, amount))
        setDrawing(false)
      }
    }, 80)
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

      {winners.length > 0 && (
        <section className="panel results" aria-live="polite">
          <div className="list-header">
            <h2>🏆 Jurados seleccionados</h2>
            <button className="ghost" onClick={copyResults} disabled={drawing}>
              Copiar resultado
            </button>
          </div>
          <ol>
            {winners.map((name, i) => (
              <li key={`${name}-${i}`}>{name}</li>
            ))}
          </ol>
        </section>
      )}

      <footer>MVP — sin base de datos ni persistencia: todo queda en memoria.</footer>
    </main>
  )
}

export default App
