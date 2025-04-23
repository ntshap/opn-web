/**
 * This script bypasses the Next.js plugin by:
 * 1. Generating static HTML files
 * 2. Copying them to the publish directory
 */
const fs = require('fs');
const path = require('path');

console.log('Starting bypass-nextjs script...');

// Create the static-site directory if it doesn't exist
const staticDir = path.join(__dirname, '..', 'static-site');
if (!fs.existsSync(staticDir)) {
  fs.mkdirSync(staticDir, { recursive: true });
}

// Create index.html
const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OPN Admin</title>
  <style>
    body { font-family: Arial; margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background: #f5f5f5; }
    .container { max-width: 500px; padding: 2rem; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
    h1 { color: #4f46e5; }
    .button { display: inline-block; background: #4f46e5; color: white; padding: 10px 20px; border-radius: 4px; text-decoration: none; margin-top: 1rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1>OPN Admin Portal</h1>
    <p>Welcome to the OPN Admin Portal</p>
    <p>Please use the links below to navigate:</p>
    <a href="/login" class="button">Login</a>
  </div>
  <script>
    // Redirect to login after 2 seconds
    setTimeout(() => { window.location.href = '/login'; }, 2000);
  </script>
</body>
</html>`;

// Create login.html
const loginHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OPN Admin - Login</title>
  <style>
    body { font-family: Arial; margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background: #f5f5f5; }
    .container { width: 100%; max-width: 400px; padding: 2rem; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    h1 { color: #4f46e5; text-align: center; }
    .form-group { margin-bottom: 1rem; }
    label { display: block; margin-bottom: 0.5rem; font-weight: bold; }
    input { width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
    .button { display: block; width: 100%; background: #4f46e5; color: white; padding: 10px; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Login</h1>
    <form onsubmit="event.preventDefault(); window.location.href='/dashboard';">
      <div class="form-group">
        <label for="username">Username</label>
        <input type="text" id="username" placeholder="Enter your username" required>
      </div>
      <div class="form-group">
        <label for="password">Password</label>
        <input type="password" id="password" placeholder="Enter your password" required>
      </div>
      <button type="submit" class="button">Login</button>
    </form>
  </div>
</body>
</html>`;

// Create dashboard.html
const dashboardHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OPN Admin - Dashboard</title>
  <style>
    body { font-family: Arial; margin: 0; padding: 0; background: #f5f5f5; }
    .header { background: #4f46e5; color: white; padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; }
    .header h1 { margin: 0; font-size: 1.5rem; }
    .content { padding: 2rem; max-width: 1200px; margin: 0 auto; }
    .card { background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); padding: 1.5rem; margin-bottom: 1.5rem; }
    .card h2 { margin-top: 0; color: #4f46e5; }
    .button { display: inline-block; background: #4f46e5; color: white; padding: 8px 16px; border-radius: 4px; text-decoration: none; margin-right: 0.5rem; }
    .logout { background: transparent; border: 1px solid white; color: white; padding: 8px 16px; border-radius: 4px; text-decoration: none; }
  </style>
</head>
<body>
  <div class="header">
    <h1>OPN Admin Dashboard</h1>
    <a href="/login" class="logout">Logout</a>
  </div>
  <div class="content">
    <div class="card">
      <h2>Welcome to the Dashboard</h2>
      <p>This is a static demo of the OPN Admin Dashboard.</p>
    </div>
    <div class="card">
      <h2>Quick Links</h2>
      <p>
        <a href="#" class="button">Events</a>
        <a href="#" class="button">Finances</a>
        <a href="#" class="button">Members</a>
        <a href="#" class="button">News</a>
      </p>
    </div>
  </div>
</body>
</html>`;

// Create 404.html
const notFoundHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OPN Admin - Page Not Found</title>
  <style>
    body { font-family: Arial; margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background: #f5f5f5; text-align: center; }
    .container { max-width: 500px; padding: 2rem; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    h1 { font-size: 6rem; margin: 0; color: #4f46e5; }
    h2 { margin-top: 0; color: #333; }
    .button { display: inline-block; background: #4f46e5; color: white; padding: 10px 20px; border-radius: 4px; text-decoration: none; margin-top: 1rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1>404</h1>
    <h2>Page Not Found</h2>
    <p>The page you are looking for doesn't exist or has been moved.</p>
    <a href="/" class="button">Go to Home</a>
  </div>
</body>
</html>`;

// Create _redirects file
const redirects = `# Handle specific routes
/login    /login.html    200
/dashboard    /dashboard.html    200

# Handle 404s
/*    /index.html    200`;

// Write files
fs.writeFileSync(path.join(staticDir, 'index.html'), indexHtml);
fs.writeFileSync(path.join(staticDir, 'login.html'), loginHtml);
fs.writeFileSync(path.join(staticDir, 'dashboard.html'), dashboardHtml);
fs.writeFileSync(path.join(staticDir, '404.html'), notFoundHtml);
fs.writeFileSync(path.join(staticDir, '_redirects'), redirects);

console.log('Static files generated successfully!');
console.log('bypass-nextjs script completed successfully!');
