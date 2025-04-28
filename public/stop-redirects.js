// EMERGENCY SCRIPT TO COMPLETELY STOP ALL REDIRECTS
(function() {
  console.log('EMERGENCY REDIRECT BLOCKER ACTIVATED');

  // Clear all storage to reset authentication state
  localStorage.clear();
  sessionStorage.clear();

  // Clear all cookies
  document.cookie.split(";").forEach(function(c) {
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  });

  // Set a flag to indicate we've blocked redirects
  sessionStorage.setItem('REDIRECT_BLOCKER_ACTIVE', 'true');

  // Override window.location methods to prevent redirects
  const originalAssign = window.location.assign;
  const originalReplace = window.location.replace;
  const originalHref = Object.getOwnPropertyDescriptor(window.location, 'href');

  // Block location.href assignments
  Object.defineProperty(window.location, 'href', {
    set: function(value) {
      console.log('BLOCKED REDIRECT TO: ' + value);
      return value;
    },
    get: function() {
      return originalHref.get.call(this);
    }
  });

  // Block location.assign
  window.location.assign = function(url) {
    console.log('BLOCKED location.assign REDIRECT TO: ' + url);
    return;
  };

  // Block location.replace
  window.location.replace = function(url) {
    console.log('BLOCKED location.replace REDIRECT TO: ' + url);
    return;
  };

  // Add a message to the page
  window.addEventListener('DOMContentLoaded', function() {
    const div = document.createElement('div');
    div.style.position = 'fixed';
    div.style.top = '0';
    div.style.left = '0';
    div.style.right = '0';
    div.style.backgroundColor = '#f44336';
    div.style.color = 'white';
    div.style.padding = '10px';
    div.style.textAlign = 'center';
    div.style.zIndex = '9999';
    div.innerHTML = '<strong>REDIRECT BLOCKER ACTIVE</strong> - All redirects have been disabled to prevent loops. <a href="/emergency" style="color:white;text-decoration:underline;font-weight:bold;">GO TO EMERGENCY PAGE</a> | <a href="/login" style="color:white;text-decoration:underline;">Login</a> | <a href="/dashboard" style="color:white;text-decoration:underline;">Dashboard</a>';
    document.body.appendChild(div);
  });
})();
