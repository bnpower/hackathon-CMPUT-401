import { useEffect, useState } from 'react'
import api from '../api/client'
import JobCard from '../components/JobCard'
import './DashboardPage.css'

export default function DashboardPage() {
  const [applications, setApplications] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get('/applications/?page_size=100')
      .then(({ data }) => setApplications(data.results ?? data))
      .catch(() => setError('Could not load applications. Are you signed in?'))
  }, [])

  return (
    <main className="feed">
      <h1 className="feed__title">Job Applications</h1>
      {error && <p role="alert">{error}</p>}
      <div className="feed__list">
        {applications.map((application) => (
          <JobCard key={application.id} application={application} />
        ))}
      </div>
    </main>
  )
}
