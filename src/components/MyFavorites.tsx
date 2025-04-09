import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getFavoriteSongs } from '../utils/api';
import { Song, ApiError } from '../types';
import SongList from './SongList';
import { Loader2, AlertCircle, Heart } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom'; // Import useNavigate

const MyFavorites: React.FC = () => {
  const { token, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate(); // Hook for navigation
  const [favoriteSongs, setFavoriteSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFavorites = useCallback(async () => {
    if (!token) {
      setError("Authentication token not found. Please log in.");
      setLoading(false);
      setFavoriteSongs([]);
      return;
    }

    console.log("Fetching favorite songs...");
    setLoading(true);
    setError(null);
    try {
      const response = await getFavoriteSongs(token);
      setFavoriteSongs(Array.isArray(response.favorites) ? response.favorites : []);
      console.log(`Fetched ${response.favorites?.length || 0} favorites.`);
    } catch (err: any) {
      console.error('Error fetching favorites:', err);
      const apiError = err as ApiError;
      setError(apiError.errorString || apiError.message || 'Failed to load favorite songs.');
      setFavoriteSongs([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isAuthenticated && !isAuthLoading) {
      fetchFavorites();
    } else if (!isAuthenticated && !isAuthLoading) {
      setError("You must be logged in to view your favorites.");
      setFavoriteSongs([]);
      setLoading(false);
    }
  }, [isAuthenticated, isAuthLoading, fetchFavorites]);

  const handleFavoritesChanged = useCallback(() => {
    console.log("Favorites changed, re-fetching...");
    fetchFavorites();
  }, [fetchFavorites]);

  // *** NEW: Handler for Request Button Click in SongList ***
  const handleRequestClick = (song: Song) => {
    console.log('Request clicked for favorite song:', song.title);
    // Navigate to the request form, passing the song details
    navigate('/request', { state: { selectedSong: song } });
  };

  if (isAuthLoading) {
      return (
          <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
              <span className="ml-3 text-gray-600">Loading authentication...</span>
          </div>
      );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-4 pb-4 border-b border-gray-200">
         <Heart className="h-8 w-8 text-red-500" />
        <h2 className="text-3xl font-semibold text-gray-800">My Favorite Songs</h2>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
          <span className="ml-3 text-gray-600">Loading favorites...</span>
        </div>
      )}

      {error && !loading && (
        <div className="flex items-center p-4 bg-red-100 text-red-700 rounded-md border border-red-200">
          <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />
          <span className="text-sm">{error}</span>
           {!isAuthenticated && (
               <Link to="/login" className="ml-auto text-sm font-medium text-indigo-600 hover:text-indigo-500">
                   Login
               </Link>
           )}
        </div>
      )}

      {!loading && !error && isAuthenticated && (
        <SongList
          songs={favoriteSongs}
          isFavoriteList={true}
          onFavoritesChange={handleFavoritesChanged}
          showFavoriteButton={true} // Show remove favorite button
          showRequestButton={true} // *** NEW: Also show request button ***
          onRequestClick={handleRequestClick} // *** NEW: Pass the handler ***
        />
      )}

       {!loading && !error && isAuthenticated && favoriteSongs.length === 0 && (
         <div className="text-center py-10 px-4">
             <p className="text-gray-500 mb-4">You haven't added any songs to your favorites yet.</p>
             <Link to="/search" className="inline-block px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
                 Find Songs to Add
             </Link>
         </div>
       )}

    </div>
  );
};

export default MyFavorites;
