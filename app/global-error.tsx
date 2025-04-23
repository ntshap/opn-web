'use client'
 
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          padding: '20px',
          textAlign: 'center',
          backgroundColor: '#f8f9fa',
          fontFamily: 'Arial, sans-serif'
        }}>
          <h1 style={{ color: '#dc3545', marginBottom: '20px' }}>Something went wrong!</h1>
          <p style={{ marginBottom: '20px', maxWidth: '600px' }}>
            We're sorry, but there was a critical error loading the application. Our team has been notified.
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
      </body>
    </html>
  )
}
