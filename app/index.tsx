import React, { useState } from 'react';
import Home from './home';
import Login from './login';
import SignUp from './signUp';
import { UserProvider } from './userContext';

/**
 * Main App component that handles navigation between authentication and main app
 * Acts as a simple router based on authentication state
 * Wrapped with UserProvider to provide user context throughout the app
 */
export default function App() {
  // State to track whether user is authenticated
  // When true, shows the Home screen; when false, shows login/signup flow
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // State to track whether user is on the sign-up screen
  // When true, shows SignUp form; when false, shows Login form
  const [isSignUp, setIsSignUp] = useState(false);

  // Wrap entire app in UserProvider to make user context available to all components
  // This allows any component to access the current logged-in user's information
  return (
    <UserProvider>
      {isLoggedIn ? (
        // If user is logged in, render the main Home component (calendar app)
        <Home />
      ) : isSignUp ? (
        // If user is on sign-up flow, render the SignUp component
        <SignUp
          // Callback fired when user successfully creates an account
          // Automatically logs them in and navigates to Home
          onSignUpSuccess={() => {
            setIsSignUp(false);
            setIsLoggedIn(true); // auto-login after signup
          }}
          // Callback to navigate back to the login screen
          onBackToLogin={() => setIsSignUp(false)}
        />
      ) : (
        // Default: render the Login component
        <Login
          // Callback fired when user successfully logs in
          // Sets authentication state to true, which triggers Home screen render
          onLogin={() => setIsLoggedIn(true)}
          // Callback to switch from login to sign-up screen
          onSwitchToSignUp={() => setIsSignUp(true)}
        />
      )}
    </UserProvider>
  );
}