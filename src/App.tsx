import React from 'react';
import { Route, Routes, Navigate, useLocation, Outlet, Link } from 'react-router-dom';
import {
  Login,
  Register,
  MyFavorites,
  Navbar,
  Footer,
  HealthCheck,
  ErrorBoundary,
  SongSearch, // Keep for direct access if needed
  RequestForm // This will be the new default target
} from './components';
import { useAuth } from './context/AuthContext';

// --- Protected Route Component ---
const ProtectedRoute: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <p className="text-gray-600">Checking authentication...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('ProtectedRoute: Not authenticated, redirecting to login.');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children || <Outlet />}</>;
};

// --- Main Application Layout and Routing ---
function App() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 font-sans">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <ErrorBoundary>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/health" element={<HealthCheck />} />
            {/* Keep /search available directly */}
            <Route path="/search" element={<SongSearch />} />
            {/* /request now serves as the primary entry point for requests */}
            <Route path="/request" element={<RequestForm />} />
            {/* Example: <Route path="/venues" element={<VenueList />} /> */}
            {/* Example: <Route path="/songs/:songId" element={<SongDetails />} /> */}

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/favorites" element={<MyFavorites />} />
              {/* <Route path="/profile" element={<UserProfile />} /> */}
            </Route>

            {/* Default Route Logic */}
            <Route
              path="/"
              element={
                isLoading ? (
                  <div className="flex justify-center items-center py-20">
                    <p className="text-gray-600">Loading...</p>
                  </div>
                ) : isAuthenticated ? (
                  // Logged-in users go to favorites (or dashboard later)
                  <Navigate to="/favorites" replace />
                ) : (
                  // *** CHANGE: Unauthenticated users now land on the request page (venue selection) ***
                  <Navigate to="/request" replace />
                )
              }
            />

            {/* Catch-all 404 Not Found Route */}
            <Route path="*" element={
              <div className="text-center py-16">
                <h1 className="text-4xl font-bold text-gray-700 mb-4">404 - Not Found</h1>
                <p className="text-gray-500">Oops! The page you are looking for does not exist.</p>
                <Link to="/" className="mt-6 inline-block px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
                  Go Home
                </Link>
              </div>
            } />
          </Routes>
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  );
}

export default App;
