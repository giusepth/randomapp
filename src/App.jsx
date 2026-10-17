import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

/* ---------------------------------------------------------------------------
   Draw configuration.
   DRAW_TICKS * DRAW_INTERVAL_MS is the length of the on-button shuffle tease
   before the winner is revealed.
   ------------------------------------------------------------------------ */
const DRAW_TICKS = 6
const DRAW_INTERVAL_MS = 110

const SAMPLE_NAMES = [
  'María González',
  'Alejandro Ruiz',
  'Valentina Castro',
  'Mateo Benítez',
  'Camila Navarro',
  'Diego Saldívar',
  'Sofía Herrera',
  'Esteban Morales',
  'Lucía Fernández',
  'Gabriel Vargas',
  'Daniela Mendoza',
  'Javier Paredes',
]

const PRESETS = [1, 2, 3, 5]

/* Podium presentation for the first three winners; everyone else is "N° Ganador". */
const PODIUM = [
  { rank: '1° Lugar', icon: 'military_tech', variant: 'gold' },
  { rank: '2° Lugar', icon: 'workspace_premium', variant: 'silver' },
  { rank: '3° Lugar', icon: 'emoji_events', variant: 'bronze' },
]

const CONFETTI_COLORS = ['#4f46e5', '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4']

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

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

function App() {
  const [rawText, setRawText] = useState('')
  const [amount, setAmount] = useState(1)
  const [allowDuplicates, setAllowDuplicates] = useState(false)
  const [fxEnabled, setFxEnabled] = useState(true)
  const [winners, setWinners] = useState([])
  const [drawing, setDrawing] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [error, setError] = useState('')
  const [history, setHistory] = useState([])
  const [toast, setToast] = useState(null)
  const [poolSize, setPoolSize] = useState(0)
  const [preview, setPreview] = useState('')

  const dialogRef = useRef(null)
  const intervalRef = useRef(null)
  const toastTimerRef = useRef(null)
  const canvasRef = useRef(null)
  const particlesRef = useRef([])
  const animRef = useRef(null)

  const parsed = useMemo(() => parseNames(rawText), [rawText])
  // The pool of drawable entries: with duplicates allowed, every line is its
  // own entry (a repeated name gets a repeated chance); otherwise unique names.
  const pool = useMemo(
    () => (allowDuplicates ? parsed : dedupe(parsed)),
    [parsed, allowDuplicates],
  )
  const cleanCount = pool.length
  const lineCount = Math.max(parsed.length, 1)

  const probability = useMemo(() => {
    if (cleanCount === 0) return 0
    return Math.min(100, (amount / cleanCount) * 100)
  }, [amount, cleanCount])

  // Keep the native <dialog> in sync with React state.
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (isModalOpen && !dialog.open) dialog.showModal()
    if (!isModalOpen && dialog.open) dialog.close()
  }, [isModalOpen])

  // Never leave a shuffle timer or toast timer running behind us.
  useEffect(
    () => () => {
      clearInterval(intervalRef.current)
      clearTimeout(toastTimerRef.current)
      if (animRef.current) cancelAnimationFrame(animRef.current)
    },
    [],
  )

  function showToast(message, variant = 'success') {
    clearTimeout(toastTimerRef.current)
    setToast({ message, variant })
    toastTimerRef.current = setTimeout(() => setToast(null), 2800)
  }

  function stopShuffle() {
    clearInterval(intervalRef.current)
    intervalRef.current = null
  }

  function closeModal() {
    stopShuffle()
    setDrawing(false)
    setPreview('')
    setIsModalOpen(false)
  }

  /* ---- Confetti -------------------------------------------------------- */

  function resizeCanvas() {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }

  function triggerConfetti() {
    if (!fxEnabled || prefersReducedMotion()) return
    const canvas = canvasRef.current
    if (!canvas) return
    resizeCanvas()
    const source = canvas
    particlesRef.current = Array.from({ length: 90 }, () => ({
      x: source.width / 2,
      y: source.height / 2 - 50,
      vx: (Math.random() - 0.5) * 16,
      vy: (Math.random() - 0.7) * 18,
      size: Math.random() * 8 + 4,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 12,
      alpha: 1,
    }))
    if (!animRef.current) animRef.current = requestAnimationFrame(updateConfetti)
  }

  function updateConfetti() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    let active = false

    for (const p of particlesRef.current) {
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.45 // gravity
      p.rotation += p.rotSpeed
      p.alpha -= 0.012
      if (p.alpha > 0) {
        active = true
        ctx.save()
        ctx.globalAlpha = Math.max(0, p.alpha)
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rotation * Math.PI) / 180)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.4)
        ctx.restore()
      }
    }

    if (active) {
      animRef.current = requestAnimationFrame(updateConfetti)
    } else {
      animRef.current = null
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }

  /* ---- Input helpers --------------------------------------------------- */

  function updateRawText(next) {
    setRawText(next)
    setError('')
  }

  function handleInc() {
    const current = amount || 1
    if (allowDuplicates || cleanCount === 0 || current < cleanCount) {
      setAmount(current + 1)
      setError('')
    }
  }

  function handleDec() {
    setAmount((prev) => (prev > 1 ? prev - 1 : 1))
    setError('')
  }

  function loadSample() {
    updateRawText(SAMPLE_NAMES.join('\n'))
    showToast('Lista de ejemplo cargada', 'success')
  }

  function shuffleInput() {
    const list = dedupe(parseNames(rawText))
    if (list.length <= 1) return
    updateRawText(shuffleNames(list).join('\n'))
    showToast('Orden mezclado aleatoriamente', 'success')
  }

  function removeDuplicates() {
    updateRawText(dedupe(parseNames(rawText)).join('\n'))
    showToast('Duplicados eliminados', 'success')
  }

  function clearInput() {
    updateRawText('')
    showToast('Lista limpiada', 'warning')
  }

  /* ---- Draw ------------------------------------------------------------ */

  function validate() {
    if (cleanCount < 2) {
      return 'Debés ingresar al menos 2 nombres, uno por línea.'
    }
    if (!Number.isInteger(amount) || amount < 1) {
      return 'La cantidad de ganadores debe ser un número entero mayor a 0.'
    }
    if (amount > cleanCount) {
      return allowDuplicates
        ? `Solo hay ${cleanCount} nombres disponibles.`
        : `Solo hay ${cleanCount} nombres únicos. Podés activar "permitir repetidos" para sortear más.`
    }
    return ''
  }

  // Validation for the reduced pool used by "Excluir y repetir": same rules as
  // validate(), but measured against `sourceCount` only, because the participant
  // field has already been rewritten by the exclusion at this point.
  function validateExcluding(sourceCount) {
    if (!Number.isInteger(amount) || amount < 1) {
      return 'La cantidad de ganadores debe ser un número entero mayor a 0.'
    }
    if (sourceCount < 2) {
      return 'Quedan menos de 2 participantes para volver a sortear.'
    }
    if (amount > sourceCount) {
      return `Solo hay ${sourceCount} nombres disponibles tras excluir a los ganadores.`
    }
    return ''
  }

  function draw({ exclude = false } = {}) {
    // "Excluir y repetir" drops the current winners from the input, then draws.
    let source = pool
    if (exclude && winners.length) {
      const remaining = parseNames(rawText).filter((name) => !winners.includes(name))
      updateRawText(remaining.join('\n'))
      source = allowDuplicates ? remaining : dedupe(remaining)
    }

    // Validate against the pool this draw will actually use: after an exclusion,
    // the pool is the reduced `source`, not the still-stale `cleanCount`.
    const sourceCount = source.length
    const problem = exclude ? validateExcluding(sourceCount) : validate()
    if (problem) {
      setWinners([])
      setError(problem)
      setDrawing(false)
      return
    }

    // Clamp so a stale winner count can never exceed what the pool can give.
    const wCount = allowDuplicates
      ? Math.min(amount, 100)
      : Math.min(amount || 1, sourceCount)

    setError('')
    setDrawing(true)
    setIsModalOpen(true)
    setPoolSize(sourceCount)
    setPreview(source[Math.floor(Math.random() * sourceCount)] || '')

    // The first frame is a full draw, not a placeholder, so the modal never
    // opens empty and history records exactly the names the reveal settles on.
    const firstSlice = shuffleNames(source).slice(0, wCount)
    setWinners(firstSlice)
    setHistory((prev) => [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        time: new Date().toLocaleTimeString('es-AR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        winners: firstSlice,
        poolSize: sourceCount,
      },
      ...prev,
    ])

    let ticks = 0
    stopShuffle()
    intervalRef.current = setInterval(() => {
      ticks += 1
      const slice = shuffleNames(source).slice(0, wCount)
      setPreview(source[Math.floor(Math.random() * sourceCount)] || '')
      if (ticks >= DRAW_TICKS) {
        stopShuffle()
        setWinners(slice)
        setDrawing(false)
        setPreview('')
        triggerConfetti()
        return
      }
      setWinners(slice)
    }, DRAW_INTERVAL_MS)
  }

  async function copyResults() {
    const lines = winners.map((name, i) => `${i + 1}. ${name}`).join('\n')
    try {
      await navigator.clipboard.writeText(lines)
      showToast('Ganadores copiados al portapapeles', 'success')
    } catch {
      showToast('No se pudo copiar al portapapeles', 'warning')
    }
  }

  const countLabel = `${cleanCount} ${cleanCount === 1 ? 'nombre cargado' : 'nombres cargados'}`
  const probabilityLabel = cleanCount === 0 ? '0%' : `${probability.toFixed(1)}%`

  return (
    <div className="app">
      <header className="site-header">
        <div className="shell site-header__inner">
          <div className="brand">
            <span className="brand__mark material-symbols-outlined" aria-hidden="true">shuffle</span>
            <span className="brand__name">RandomSelector</span>
            <span className="pill pill--success brand__pill">Sorteo Rápido</span>
          </div>

          <nav className="site-nav" aria-label="Secciones">
            <a
              className="site-nav__item site-nav__item--active"
              href="#"
              aria-current="page"
              onClick={(e) => e.preventDefault()}
            >
              Nombres
            </a>
            <button type="button" className="site-nav__item" disabled title="Próximamente">
              Ruleta
            </button>
            <button type="button" className="site-nav__item" disabled title="Próximamente">
              Equipos
            </button>
            <button type="button" className="site-nav__item" disabled title="Próximamente">
              Historial
            </button>
          </nav>

          <div className="header-tools">
            <span className="kbd-hint">
              <span className="material-symbols-outlined" aria-hidden="true">keyboard</span>
              <kbd>Espacio</kbd>
            </span>
            <span className="avatar material-symbols-outlined" aria-hidden="true">person</span>
          </div>
        </div>
      </header>

      <main className="shell">
        <section className="hero">
          <span className="hero__badge">
            <span className="material-symbols-outlined" aria-hidden="true">casino</span>
            Motor Criptográfico v2.4
          </span>
          <h1 className="hero__title">Selector de Nombres Aleatorios</h1>
          <p className="hero__lede">
            Pega tu lista de participantes, elige el número de ganadores y realiza
            tu sorteo al instante con total transparencia.
          </p>

          <div className="utility-bar">
            <button type="button" className="utility-btn" onClick={loadSample}>
              <span className="material-symbols-outlined" aria-hidden="true">playlist_add</span>
              Cargar muestra
            </button>
            <button
              type="button"
              className="utility-btn utility-btn--shuffle"
              onClick={shuffleInput}
            >
              <span className="material-symbols-outlined" aria-hidden="true">shuffle</span>
              Mezclar
            </button>
            <button
              type="button"
              className="utility-btn utility-btn--dedup"
              onClick={removeDuplicates}
            >
              <span className="material-symbols-outlined" aria-hidden="true">filter_alt</span>
              Quitar duplicados
            </button>
            <button
              type="button"
              className="utility-btn utility-btn--danger"
              onClick={clearInput}
            >
              <span className="material-symbols-outlined" aria-hidden="true">delete_sweep</span>
              Limpiar
            </button>
          </div>
        </section>

        <div className="workbench">
          <div className="col-main">
            <div className="card">
              <div className="card__head">
                <h2 className="card__title">
                  <span className="live-dot" aria-hidden="true" />
                  Lista de Participantes
                </h2>
                <span className="count-badge">{countLabel}</span>
              </div>

              <div>
                <div className="editor">
                  <div className="editor__gutter" aria-hidden="true">
                    {Array.from({ length: lineCount }, (_, i) => (
                      <div key={i}>{i + 1}</div>
                    ))}
                  </div>
                  <textarea
                    id="participants"
                    className="editor__input"
                    value={rawText}
                    onChange={(e) => updateRawText(e.target.value)}
                    placeholder={'Ingresa un nombre o correo por línea...\nEjemplo:\nCarlos Martínez\nLucía Méndez'}
                    rows={12}
                    aria-label="Participantes, un nombre por línea"
                  />
                </div>
                <div className="editor__footer">
                  <span>
                    <span className="material-symbols-outlined" aria-hidden="true">format_align_left</span>
                    1 participante por línea
                  </span>
                  <span>{rawText.length} caracteres</span>
                </div>
              </div>

              <div className="toggle-grid">
                <label className="toggle">
                  <span className="toggle__label">
                    <span className="material-symbols-outlined" aria-hidden="true">content_copy</span>
                    Permitir duplicados
                  </span>
                  <input
                    type="checkbox"
                    checked={allowDuplicates}
                    onChange={(e) => {
                      setAllowDuplicates(e.target.checked)
                      setError('')
                    }}
                  />
                </label>
                <label className="toggle">
                  <span className="toggle__label toggle__label--fx">
                    <span className="material-symbols-outlined" aria-hidden="true">celebration</span>
                    Efectos &amp; Confeti
                  </span>
                  <input
                    type="checkbox"
                    checked={fxEnabled}
                    onChange={(e) => setFxEnabled(e.target.checked)}
                  />
                </label>
              </div>
            </div>

            <div className="banner">
              <div className="banner__lead">
                <span className="banner__icon material-symbols-outlined" aria-hidden="true">verified</span>
                <div>
                  <p className="banner__title">Algoritmo Fisher-Yates PRNG</p>
                  <p className="banner__text">
                    Generación aleatoria pura ejecutada en tu navegador sin sesgo.
                  </p>
                </div>
              </div>
              <span className="banner__tag">100% Imparcial</span>
            </div>
          </div>

          <div className="col-side">
            <div className="card">
              <div className="card__head">
                <h2 className="section-title">Parámetros del Sorteo</h2>
                <span className="material-symbols-outlined" style={{ color: 'var(--brand)' }} aria-hidden="true">
                  tune
                </span>
              </div>

              <div>
                <label className="field-label" htmlFor="amount">
                  Cantidad de ganadores a elegir
                </label>
                <div className="stepper" style={{ marginTop: 'var(--space-1)' }}>
                  <button
                    type="button"
                    className="stepper__btn material-symbols-outlined"
                    onClick={handleDec}
                    aria-label="Restar un ganador"
                  >
                    remove
                  </button>
                  <input
                    id="amount"
                    className="stepper__input"
                    type="number"
                    min={1}
                    value={amount}
                    onChange={(e) => {
                      setAmount(Number(e.target.value))
                      setError('')
                    }}
                  />
                  <button
                    type="button"
                    className="stepper__btn material-symbols-outlined"
                    onClick={handleInc}
                    aria-label="Sumar un ganador"
                  >
                    add
                  </button>
                </div>
                <div className="presets" style={{ paddingTop: 'var(--space-2)' }}>
                  {PRESETS.map((value) => (
                    <button
                      key={value}
                      type="button"
                      className="preset-btn"
                      onClick={() => {
                        setAmount(value)
                        setError('')
                      }}
                    >
                      {value} {value === 1 ? 'Ganador' : 'Ganadores'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="prob-card">
              <div className="prob-metric">
                <span className="prob-metric__label">Probabilidad individual</span>
                <span className="prob-metric__value">{probabilityLabel}</span>
              </div>
              <div className="prob-divider" aria-hidden="true" />
              <div className="prob-metric prob-metric--right">
                <span className="prob-metric__label">Relación Ganador / Total</span>
                <span className="prob-metric__value">
                  {amount} / {cleanCount}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="pick-btn"
              onClick={() => draw()}
              disabled={drawing}
            >
              <span className="material-symbols-outlined" aria-hidden="true">trophy</span>
              {drawing
                ? preview
                  ? `🎯 ${preview}…`
                  : 'Mezclando y seleccionando…'
                : '¡Elegir Ganadores! 🎉'}
            </button>

            {error && (
              <p className="error">
                <span className="material-symbols-outlined" aria-hidden="true">warning</span>
                {error}
              </p>
            )}

            <div className="card">
              <div className="card__head">
                <h2 className="section-title">Historial de la Sesión</h2>
                <button
                  type="button"
                  className="history__clear"
                  onClick={() => setHistory([])}
                  disabled={!history.length}
                >
                  <span className="material-symbols-outlined" aria-hidden="true">delete</span>
                  Limpiar
                </button>
              </div>
              <div className="history__list">
                {history.length === 0 ? (
                  <div className="history__empty">
                    <span className="material-symbols-outlined" aria-hidden="true">history_toggle_off</span>
                    Aún no has realizado sorteos en esta sesión.
                  </div>
                ) : (
                  history.map((entry) => (
                    <div key={entry.id} className="history__item">
                      <div className="history__meta">
                        <span>{entry.time}</span>
                        <span>
                          {entry.winners.length} / {entry.poolSize}
                        </span>
                      </div>
                      <p className="history__names">{entry.winners.join(' · ')}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="site-footer">
        <div className="shell site-footer__inner">
          <div className="site-footer__brand">
            <span className="site-footer__name">RandomSelector</span>
            <span className="site-footer__copy">
              © 2026. Sorteos aleatorios transparentes y verificables.
            </span>
          </div>
          <div className="site-footer__links">
            <span>Atajos</span>
            <span>Reglas &amp; Azar</span>
            <span>Exportar</span>
            <span>Privacidad</span>
          </div>
        </div>
      </footer>

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
          <button
            type="button"
            className="modal-close material-symbols-outlined"
            onClick={closeModal}
            aria-label="Cerrar"
          >
            close
          </button>

          <div className="modal-head">
            <span className="pill pill--success">
              <span className="material-symbols-outlined" aria-hidden="true">verified</span>
              Sorteo Verificado con Éxito
            </span>
            <span className="modal-trophy material-symbols-outlined" aria-hidden="true">
              workspace_premium
            </span>
            <h2 id="winner-title" className="modal-title">
              {drawing ? 'Sorteando…' : '¡Felicitaciones a los Ganadores!'}
            </h2>
            <p className="modal-subtitle">
              {drawing
                ? 'Seleccionando de forma imparcial…'
                : `Seleccionados de forma imparcial entre ${poolSize} participantes.`}
            </p>
          </div>

          <ol className={`winner-list ${drawing ? 'is-drawing' : ''}`}>
            {winners.map((name, i) => {
              const podium = PODIUM[i]
              const rank = podium ? podium.rank : `${i + 1}° Ganador`
              const icon = podium ? podium.icon : 'person'
              const variant = podium ? `winner-card--${podium.variant}` : ''
              const overallOdds = poolSize ? ((amount / poolSize) * 100).toFixed(1) : '0.0'
              return (
                <li key={`${name}-${i}`} className={`winner-card ${variant}`}>
                  <div className="winner-card__lead">
                    <span className="winner-card__badge material-symbols-outlined" aria-hidden="true">
                      {icon}
                    </span>
                    <div className="winner-card__meta">
                      <span className="winner-card__rank">{rank}</span>
                      <span className="winner-card__name">{name}</span>
                    </div>
                  </div>
                  <span className="winner-card__prob">{overallOdds}%</span>
                </li>
              )
            })}
          </ol>

          <div className="modal-actions">
            <div className="modal-actions__row">
              <button
                type="button"
                className="btn btn--primary"
                onClick={copyResults}
                disabled={drawing || !winners.length}
              >
                <span className="material-symbols-outlined" aria-hidden="true">content_copy</span>
                Copiar Ganadores
              </button>
              <button
                type="button"
                className="btn btn--neutral"
                onClick={() => draw()}
                disabled={drawing}
              >
                <span className="material-symbols-outlined" aria-hidden="true">cached</span>
                Volver a sortear
              </button>
              <button
                type="button"
                className="btn btn--neutral btn--danger"
                onClick={() => draw({ exclude: true })}
                disabled={drawing}
                title="Eliminar estos ganadores y volver a sortear"
              >
                <span className="material-symbols-outlined" aria-hidden="true">person_remove</span>
                Excluir y repetir
              </button>
            </div>
            <button type="button" className="btn btn--link" onClick={closeModal}>
              Cerrar ventana
            </button>
          </div>
        </div>
      </dialog>

      <div
        className={`toast ${toast ? 'toast--visible' : ''} ${
          toast?.variant === 'warning' ? 'toast--warning' : ''
        }`}
        role="status"
        aria-live="polite"
      >
        <span className="material-symbols-outlined" aria-hidden="true">
          {toast?.variant === 'warning' ? 'warning' : 'check_circle'}
        </span>
        <span className="toast__msg">{toast?.message}</span>
      </div>

      <canvas ref={canvasRef} className="fx-canvas" aria-hidden="true" />
    </div>
  )
}

export default App
