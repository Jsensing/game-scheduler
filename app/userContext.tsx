// Create a new file: contexts/UserContext.tsx
import React, { createContext, useContext, useState } from 'react';

interface UserContextType {
  currentUser: { id: string; username: string } | null;
  setCurrentUser: (user: { id: string; username: string } | null) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string } | null>(null);

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within UserProvider');
  return context;
}