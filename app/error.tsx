'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Unhandled error:', error)
  }, [error])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      padding: '20px',
      textAlign: 'center',
      backgroundColor: '#f8f9fa'
    }}>
      <h1 style={{ color: '#dc3545', marginBottom: '20px' }}>Something went wrong!</h1>
      <p style={{ marginBottom: '20px', maxWidth: '600px' }}>
        We're sorry, but there was an error loading this page. Our team has been notified.
      </p>
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => reset()}
          style={{
            backgroundColor: '#0d6efd',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          Try again
        </button>
        <a
          href="/"
          style={{
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            textDecoration: 'none',
            display: 'inline-block'
          }}
        >
          Go to Home
        </a>
      </div>
      <details style={{ 
        marginTop: '20px', 
        padding: '10px', 
        backgroundColor: '#f1f1f1', 
        borderRadius: '5px',
        maxWidth: '800px',
        textAlign: 'left'
      }}>
        <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Technical Details</summary>
        <pre style={{ 
          whiteSpace: 'pre-wrap', 
          wordBreak: 'break-word',
          padding: '10px',
          backgroundColor: '#e9ecef',
          borderRadius: '5px',
          marginTop: '10px',
          fontSize: '14px'
        }}>
          {error?.message || 'Unknown error'}
          {error?.stack ? `\n\n${error.stack}` : ''}
        </pre>
      </details>
    </div>
  )
}
