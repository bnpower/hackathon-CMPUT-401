import { useEffect, useMemo, useState } from 'react'
import './App.css'

function App() {
  const apiBaseUrl = useMemo(
    () => (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, ''),
    [],
  )
  const [health, setHealth] = useState({ status: 'loading', message: 'Checking API…' })

  useEffect(() => {
    const controller = new AbortController()

    async function loadHealth() {
      try {
        const response = await fetch(`${apiBaseUrl}/api/health/`, {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`API returned ${response.status}`)
        }

        const data = await response.json()
        setHealth({
          status: 'ok',
          message: `${data.service} is ${data.status}`,
        })
      } catch (error) {
        if (error.name === 'AbortError') {
          return
        }

        setHealth({
          status: 'error',
          message: 'Backend unavailable. Start Django on port 8000 or set VITE_API_BASE_URL.',
        })
      }
    }

    loadHealth()

    return () => controller.abort()
  }, [apiBaseUrl])

  return (
    <main className="app-shell">
      <section className="hero">
        <p className="eyebrow">Hackathon starter</p>
        <h1>Django backend + React frontend</h1>
        <p className="summary">
          A minimal full-stack scaffold with a Django API, a Vite-powered React UI,
          and a GitHub Actions pipeline ready for Cybera RAC deployment.
        </p>
      </section>

      <section className="grid">
        <article className="card">
          <h2>Backend status</h2>
          <p className={`status status-${health.status}`}>{health.message}</p>
          <code>{apiBaseUrl || '(same origin)'}/api/health/</code>
        </article>

        <article className="card">
          <h2>Development</h2>
          <ol>
            <li>Run Django on port 8000.</li>
            <li>Run the React app with <code>npm run dev</code>.</li>
            <li>Use the built-in Vite proxy for <code>/api</code> requests.</li>
          </ol>
        </article>

        <article className="card">
          <h2>Deployment</h2>
          <p>
            Push to <code>main</code> to run CI and publish the scaffold to Cybera RAC
            through the included GitHub Actions workflow.
          </p>
        </article>
      </section>
    </main>
  )
}

export default App
