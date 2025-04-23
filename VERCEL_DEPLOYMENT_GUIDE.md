# Vercel Deployment Guide

## Environment Variables

To ensure your application connects to the backend API correctly, you need to set the following environment variables in your Vercel project:

1. Go to your Vercel project dashboard
2. Click on "Settings" tab
3. Click on "Environment Variables" in the left sidebar
4. Add the following environment variables:

| Name | Value | Description |
|------|-------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://backend-project-pemuda.onrender.com/api/v1` | The base URL for your backend API |
| `NEXT_PUBLIC_USE_FALLBACK_DATA` | `false` | Set to `false` to ensure real data is used |

5. Click "Save" to apply the changes
6. Redeploy your application to apply the new environment variables

## Troubleshooting

If you're still seeing dummy data after setting these environment variables, try the following:

1. Check the browser console for any API errors
2. Verify that your authentication token is being stored correctly
3. Make sure your backend API is accessible from the Vercel deployment
4. Try clearing your browser cache and local storage

## Testing Authentication

To verify that authentication is working correctly:

1. Open your deployed application
2. Log in with valid credentials
3. Open the browser developer tools (F12)
4. Go to the "Application" tab
5. Check "Local Storage" to ensure the token is being stored
6. Check the "Network" tab to see if API requests include the Authorization header

If you see any issues with authentication, make sure your login API endpoint is correctly configured.
