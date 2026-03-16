# How to Access the Dashboard

The dashboard is a protected route that requires authentication. Here's how to access it:

## Option 1: Register a New Account

1. Go to http://localhost:3000/register
2. Fill in the registration form:
   - **Step 1**: Enter your name and email
   - **Step 2**: Create a password (minimum 8 characters)
   - **Step 3**: Enter your Claude API key (required)
     - Get it from https://console.anthropic.com/
   - Tavily API key is optional

3. After successful registration, you'll be automatically redirected to the dashboard

## Option 2: Login with Existing Account

1. Go to http://localhost:3000/login
2. Enter your email and password
3. Click "SIGN IN"
4. You'll be automatically redirected to the dashboard

## If You Still Can't Access the Dashboard

### Check the Browser Console
1. Open browser developer tools (F12)
2. Look for any error messages in the Console tab
3. Common issues:
   - Network errors connecting to backend
   - Invalid credentials
   - Missing or expired token

### Verify Backend Connection
The app is configured to connect to:
```
https://potomac-analyst-workbench-production.up.railway.app
```

Make sure this backend is running and accessible.

### Clear Browser Data
1. Clear localStorage: 
   - Open browser console (F12)
   - Run: `localStorage.clear()`
   - Refresh the page

### Direct Dashboard Access
Once logged in, you can access the dashboard directly at:
http://localhost:3000/dashboard

## Test Credentials (if you have them set up on your backend)
If you've created test accounts on your backend, use those credentials to login.

## Authentication Flow
1. Login/Register → Backend validates → Returns JWT token
2. Token saved in localStorage as `auth_token`
3. AuthContext checks token on app load
4. Protected routes check for valid user
5. If no user, redirect to login

## Need to Create a Test Account Without Claude API Key?

For testing purposes, you can temporarily modify the registration to not require the Claude API key:

1. Edit `src/page-components/RegisterPage.tsx`
2. Remove the Claude API key validation in `validateStep3()`
3. Save and the app will hot-reload

Remember to add the API key later for the AI features to work!