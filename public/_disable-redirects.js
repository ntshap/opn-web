// This script disables all automatic redirects to prevent redirect loops

console.log('Disabling automatic redirects');

// Override any existing redirect functions
window.disableStaticRedirects = true;

// Override window.location methods to log but not redirect
const originalReplace = window.location.replace;
const originalAssign = window.location.assign;
const originalHref = Object.getOwnPropertyDescriptor(window.location, 'href');

// Check if we're in a redirect loop
let redirectCount = parseInt(sessionStorage.getItem('redirectCount') || '0');
const now = Date.now();
const lastRedirectTime = parseInt(sessionStorage.getItem('lastRedirectTime') || '0');

// If last redirect was more than 10 seconds ago, reset the count
if (now - lastRedirectTime > 10000) {
  redirectCount = 0;
}

// Update redirect count and time
redirectCount++;
sessionStorage.setItem('redirectCount', redirectCount.toString());
sessionStorage.setItem('lastRedirectTime', now.toString());

// If we've redirected more than 3 times in 10 seconds, disable redirects
if (redirectCount > 3) {
  console.warn('Detected redirect loop, disabling automatic redirects');

  // Disable window.location.replace
  window.location.replace = function(url) {
    console.warn('Blocked redirect to:', url);
    return undefined;
  };

  // Disable window.location.assign
  window.location.assign = function(url) {
    console.warn('Blocked redirect to:', url);
    return undefined;
  };

  // Disable setting window.location.href
  if (originalHref && originalHref.set) {
    Object.defineProperty(window.location, 'href', {
      get: originalHref.get,
      set: function(url) {
        console.warn('Blocked redirect to:', url);
        return url;
      }
    });
  }

  // Also disable history.pushState and history.replaceState
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function() {
    console.warn('Blocked history.pushState');
    return undefined;
  };

  history.replaceState = function() {
    console.warn('Blocked history.replaceState');
    return undefined;
  };

  // Reset redirect count after 30 seconds
  setTimeout(function() {
    sessionStorage.setItem('redirectCount', '0');
    console.log('Reset redirect count');
  }, 30000);
}

// Function to run when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, ensuring no static redirects occur');

  // Find and disable any redirect scripts
  const scripts = document.querySelectorAll('script');
  scripts.forEach(script => {
    if (script.textContent &&
        (script.textContent.includes('window.location.href') ||
         script.textContent.includes('isAuthenticated'))) {
      console.log('Found a potential redirect script, disabling it');
      script.textContent = '// Disabled to prevent redirect loops';
    }
  });
});
