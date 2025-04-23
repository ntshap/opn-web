// Custom client-side script for Netlify static export
// This script has been disabled to prevent redirect loops

(function() {
  console.log('_app.js: Static redirects disabled to prevent redirect loops');
  
  // Check if our disable flag is set
  if (window.disableStaticRedirects) {
    console.log('Static redirects already disabled by _disable-redirects.js');
    return;
  }
  
  // Set the flag to disable redirects
  window.disableStaticRedirects = true;
})();
