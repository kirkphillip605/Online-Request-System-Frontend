import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuthToken, setAuthToken, removeAuthToken, getUserFromStorage, setUserInStorage, removeUserFromStorage } from '../utils/auth';
import { User, ApiError } from '../types'; // Import ApiError

interface AuthContextProps {
  isAuthenticated: boolean;
  token: string | null;
  user: User | null;
  isLoading: boolean; // Indicates if initial auth check is running
  login: (token: string, user: User) => void;
  logout: () => void;
  // Optional: Add a function to update user info if needed later
  // updateUser: (updatedUser: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start loading until check is done
  const navigate = useNavigate();

  // Effect to initialize auth state from storage on component mount
  useEffect(() => {
    console.log('AuthProvider: Initializing auth state...');
    setIsLoading(true); // Ensure loading is true at the start of the check
    try {
      const storedToken = getAuthToken();
      const storedUser = getUserFromStorage();

      if (storedToken && storedUser) {
        console.log('AuthProvider: Found token and user in storage.', storedUser);
        // Basic validation: Check if user object has expected properties
        if (storedUser.id && storedUser.email && storedUser.patronId) {
            // TODO: Optionally add an API call here to verify token validity
            // e.g., fetch('/api/patron/profile').then(...).catch(logout);
            setTokenState(storedToken);
            setUserState(storedUser);
            console.log('AuthProvider: State updated from storage.');
        } else {
            console.warn('AuthProvider: Stored user data is invalid. Clearing auth state.');
            removeAuthToken();
            removeUserFromStorage();
            setTokenState(null);
            setUserState(null);
        }
      } else {
        console.log('AuthProvider: No valid token/user found in storage.');
        // Ensure state is clean if no token/user
        setTokenState(null);
        setUserState(null);
      }
    } catch (error) {
        console.error("AuthProvider: Error during initialization:", error);
        // Clear state in case of error during storage access
        removeAuthToken();
        removeUserFromStorage();
        setTokenState(null);
        setUserState(null);
    } finally {
        setIsLoading(false); // Finished initial auth check
        console.log('AuthProvider: Initialization complete.');
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  const login = useCallback((newToken: string, loggedInUser: User) => {
    console.log('AuthContext: login called with user:', loggedInUser);
    try {
        setAuthToken(newToken); // Store token in localStorage
        setUserInStorage(loggedInUser); // Store user info in localStorage
        setTokenState(newToken);
        setUserState(loggedInUser); // Update state
        console.log('AuthContext: State updated after login. Navigating to /favorites...');
        navigate('/favorites', { replace: true }); // Navigate after successful login
    } catch (error) {
        console.error("AuthContext: Error during login state update:", error);
        // Handle potential storage errors
    }
  }, [navigate]);

  const logout = useCallback(() => {
    console.log('AuthContext: logout called.');
    try {
        removeAuthToken(); // Remove token from localStorage
        removeUserFromStorage(); // Remove user from localStorage
        setTokenState(null);
        setUserState(null); // Clear user state
        console.log('AuthContext: State cleared. Navigating to /login...');
        navigate('/login', { replace: true }); // Navigate after logout
    } catch (error) {
        console.error("AuthContext: Error during logout state update:", error);
    }
  }, [navigate]);

  // Determine authentication status based on token presence (could be enhanced with token validation)
  const isAuthenticated = !!token && !!user;

  // Value provided to consuming components
  const contextValue: AuthContextProps = {
    isAuthenticated,
    token,
    user,
    isLoading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {/* Render children only after initial loading is complete */}
      {!isLoading ? children : (
         // Display a loading indicator during the initial auth check
         <div className="flex justify-center items-center h-screen bg-gray-100">
           <div className="text-center">
             {/* Optional: Add a spinner */}
             <p className="text-lg font-medium text-gray-700">Loading Application...</p>
           </div>
         </div>
      )}
    </AuthContext.Provider>
  );
};

// Custom hook to use the AuthContext
export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
