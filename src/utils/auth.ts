import { User } from '../types'; // Import User type

const TOKEN_KEY = 'authToken';
const USER_KEY = 'authUser'; // Key for storing user object

// --- Token Management ---

export const setAuthToken = (token: string): void => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    console.log('Auth Token stored in localStorage.');
  } catch (error) {
    console.error('Error storing auth token in localStorage:', error);
    // Handle potential storage errors (e.g., storage full, security restrictions)
  }
};

export const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error retrieving auth token from localStorage:', error);
    return null;
  }
};

export const removeAuthToken = (): void => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    console.log('Auth Token removed from localStorage.');
  } catch (error) {
    console.error('Error removing auth token from localStorage:', error);
  }
};


// --- User Object Management ---

export const setUserInStorage = (user: User): void => {
  try {
    // Ensure sensitive data (like password) is not stored if present
    const { ...userToStore } = user; // Simple shallow copy, adjust if password field exists on User type
    localStorage.setItem(USER_KEY, JSON.stringify(userToStore));
    console.log('User object stored in localStorage.');
  } catch (error) {
    console.error('Error storing user object in localStorage:', error);
  }
};

export const getUserFromStorage = (): User | null => {
  try {
    const storedUser = localStorage.getItem(USER_KEY);
    if (storedUser) {
      const user: User = JSON.parse(storedUser);
      // Optional: Add validation here to ensure the parsed object matches the User shape
      if (user && typeof user === 'object' && user.email) { // Basic check
         console.log('User object retrieved from localStorage:', user);
         return user;
      } else {
         console.warn('Invalid user object found in localStorage. Removing.');
         removeUserFromStorage(); // Clean up invalid data
         return null;
      }
    }
    return null;
  } catch (error) {
    console.error('Error retrieving or parsing user object from localStorage:', error);
    // Clean up potentially corrupted data
    removeUserFromStorage();
    return null;
  }
};

export const removeUserFromStorage = (): void => {
  try {
    localStorage.removeItem(USER_KEY);
    console.log('User object removed from localStorage.');
  } catch (error) {
    console.error('Error removing user object from localStorage:', error);
  }
};
