'use client'

import { useState, useEffect } from 'react'

export default function TestPage() {
  const [data, setData] = useState<{ total: number; data: unknown[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching data...')
        const response = await fetch('/api/topics/ai-agent')
        const result = await response.json()
        console.log('Received:', result)
        setData(result)
      } catch (err) {
        console.error('Error:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  return (
    <div>
      <h1>Test Page</h1>
      <p>Total: {data?.total}</p>
      <p>Data length: {data?.data?.length}</p>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}