// Emergency script to break redirect loops
// Add ?break-loop=true to any URL to clear all auth tokens and redirect counts

(function() {
  if (typeof window === 'undefined') return;
  
  // Check if the break-loop parameter is present
  const params = new URLSearchParams(window.location.search);
  if (params.has('break-loop')) {
    console.log('BREAKING REDIRECT LOOP: Clearing all tokens and redirect counts');
    
    // Clear localStorage
    localStorage.clear();
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Clear cookies
    document.cookie.split(";").forEach(function(c) {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    
    // Redirect to login page without any parameters
    window.location.href = '/login';
  }
})();
