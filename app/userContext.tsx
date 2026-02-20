import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

/**
 * Interface defining the shape of user data
 */
interface User {
  id: string;
  username: string;
}

/**
 * Interface for the User Context value
 * Provides current user info and setter function
 */
interface UserContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
}

/**
 * Create the User Context with undefined as default
 * This will be populated by the UserProvider
 */
const UserContext = createContext<UserContextType | undefined>(undefined);

/**
 * UserProvider component that wraps the app
 * Provides user authentication state to all child components
 * Persists current user to AsyncStorage to survive app backgrounding
 * 
 * @param children - React components to wrap with user context
 */
export function UserProvider({ children }: { children: ReactNode }) {
  // State to track the currently logged-in user
  const [currentUser, setCurrentUserState] = useState<User | null>(null);

  // Load saved user from AsyncStorage when provider mounts
  useEffect(() => {
    const loadSavedUser = async () => {
      try {
        const savedUser = await AsyncStorage.getItem('currentUser');
        if (savedUser) {
          setCurrentUserState(JSON.parse(savedUser));
        }
      } catch (error) {
        console.error('Error loading saved user:', error);
      }
    };
    loadSavedUser();
  }, []);

  // Wrapper function to save user to AsyncStorage whenever it changes
  const setCurrentUser = async (user: User | null) => {
    try {
      if (user) {
        // Save user to AsyncStorage
        await AsyncStorage.setItem('currentUser', JSON.stringify(user));
      } else {
        // Remove user from AsyncStorage on logout
        await AsyncStorage.removeItem('currentUser');
      }
      // Update state
      setCurrentUserState(user);
    } catch (error) {
      console.error('Error saving user:', error);
      // Still update state even if save fails
      setCurrentUserState(user);
    }
  };

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser }}>
      {children}
    </UserContext.Provider>
  );
}

/**
 * Custom hook to access user context
 * Must be used within a UserProvider component
 * 
 * @returns Current user and setter function
 * @throws Error if used outside of UserProvider
 */
export function useUser(): UserContextType {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}