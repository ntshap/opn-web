export default function NotFound() {
  return (
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
      <h1 style={{ 
        fontSize: '6rem', 
        fontWeight: 'bold', 
        color: '#4f46e5',
        margin: '0'
      }}>404</h1>
      <h2 style={{ 
        fontSize: '2rem', 
        color: '#333',
        marginTop: '0',
        marginBottom: '20px'
      }}>Page Not Found</h2>
      <p style={{ 
        fontSize: '1.1rem',
        color: '#666',
        maxWidth: '500px',
        marginBottom: '30px'
      }}>
        The page you are looking for doesn't exist or has been moved.
      </p>
      <a 
        href="/"
        style={{
          backgroundColor: '#4f46e5',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '6px',
          textDecoration: 'none',
          fontWeight: 'bold',
          fontSize: '1rem'
        }}
      >
        Go to Home
      </a>
    </div>
  )
}
