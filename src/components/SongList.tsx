import React, { useState } from 'react';
import { Song, ApiError } from '../types';
import { useAuth } from '../context/AuthContext';
import { addSongToFavorites, removeSongFromFavorites } from '../utils/api';
import { Heart, Loader2, Music, XCircle, AlertTriangle, Send } from 'lucide-react'; // Added Send

// --- Individual Song List Item ---
interface SongListItemProps {
  song: Song;
  // Controls whether the favorite button (Add/Remove) is shown at all.
  showFavoriteButton?: boolean;
  // Indicates if this item is part of the "My Favorites" list.
  // If true, shows a Remove button. If false, shows an Add button.
  isFavoriteList?: boolean;
  // Callback triggered when a favorite is successfully added or removed.
  onFavoritesChange?: () => void;
  // *** NEW: Callback for Request Button ***
  onRequestClick?: (song: Song) => void;
  // *** NEW: Controls whether the request button is shown ***
  showRequestButton?: boolean;
}

const SongListItem: React.FC<SongListItemProps> = ({
  song,
  showFavoriteButton = false,
  isFavoriteList = false,
  onFavoritesChange,
  onRequestClick, // New prop
  showRequestButton = false, // New prop
}) => {
  const { isAuthenticated, token } = useAuth();
  // State specifically for the favorite action on this item
  const [loadingFavorite, setLoadingFavorite] = useState(false);
  const [errorFavorite, setErrorFavorite] = useState<string | null>(null);

  // Handler for adding/removing a favorite
  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering other click events if item is wrapped

    if (!isAuthenticated || !token) {
      setErrorFavorite("Please log in to manage favorites.");
      return;
    }
    if (loadingFavorite) return;

    setLoadingFavorite(true);
    setErrorFavorite(null);

    try {
      if (isFavoriteList) {
        await removeSongFromFavorites(token, song.song_id);
        onFavoritesChange?.();
      } else {
        await addSongToFavorites(token, song.song_id);
        // Optionally show success indicator
        onFavoritesChange?.();
      }
    } catch (err: any) {
      console.error("Error toggling favorite:", err);
      const apiError = err as ApiError;
      setErrorFavorite(apiError.errorString || apiError.message || "Failed to update favorite status.");
    } finally {
      setLoadingFavorite(false);
    }
  };

  // *** NEW: Handler for Request Button Click ***
  const handleRequestClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering other click events
    if (onRequestClick) {
      onRequestClick(song);
    }
  };

  // Determine which buttons to show
  const canShowAddFavorite = showFavoriteButton && isAuthenticated && !isFavoriteList;
  const canShowRemoveFavorite = showFavoriteButton && isAuthenticated && isFavoriteList;
  const canShowRequest = showRequestButton; // Show request button based on prop

  return (
    <li
      className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 flex items-center justify-between space-x-4"
    >
      {/* Song Info */}
      <div className="flex items-center space-x-3 min-w-0">
         <Music className="h-5 w-5 text-indigo-500 flex-shrink-0" />
        <div className="min-w-0">
          <p className="font-medium text-gray-800 truncate" title={song.title}>{song.title}</p>
          <p className="text-sm text-gray-600 truncate" title={song.artist}>{song.artist}</p>
          {errorFavorite && (
            <p className="text-xs text-red-500 mt-1 flex items-center">
                <AlertTriangle className="h-3 w-3 mr-1" /> {errorFavorite}
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons Area */}
      <div className="flex-shrink-0 flex items-center space-x-2">
        {/* Request Button */}
        {canShowRequest && (
          <button
            onClick={handleRequestClick}
            className="p-2 rounded-full text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 transition-colors duration-200"
            aria-label="Request this Song"
            title="Request this Song"
          >
            <Send className="h-5 w-5" />
          </button>
        )}

        {/* Add to Favorites Button */}
        {canShowAddFavorite && (
          <button
            onClick={handleToggleFavorite}
            disabled={loadingFavorite}
            className="p-2 rounded-full text-gray-500 hover:bg-red-100 hover:text-red-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Add to Favorites"
            title="Add to Favorites"
          >
            {loadingFavorite ? <Loader2 className="h-5 w-5 animate-spin" /> : <Heart className="h-5 w-5" />}
          </button>
        )}

        {/* Remove from Favorites Button */}
         {canShowRemoveFavorite && (
           <button
             onClick={handleToggleFavorite}
             disabled={loadingFavorite}
             className="p-2 rounded-full text-red-500 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
             aria-label="Remove from Favorites"
             title="Remove from Favorites"
           >
             {loadingFavorite ? <Loader2 className="h-5 w-5 animate-spin" /> : <XCircle className="h-5 w-5" />}
           </button>
         )}
      </div>
    </li>
  );
};


// --- Main Song List Component ---
interface SongListProps {
  songs: Song[];
  showFavoriteButton?: boolean;
  isFavoriteList?: boolean;
  onFavoritesChange?: () => void;
  // *** NEW: Propagate request click handler ***
  onRequestClick?: (song: Song) => void;
  // *** NEW: Propagate show request button flag ***
  showRequestButton?: boolean;
}

const SongList: React.FC<SongListProps> = ({
    songs,
    showFavoriteButton = false,
    isFavoriteList = false,
    onFavoritesChange,
    onRequestClick, // New prop
    showRequestButton = false, // New prop
}) => {

  if (!songs || songs.length === 0) {
    const message = isFavoriteList
      ? "You haven't added any favorite songs yet."
      : "No songs to display.";
    return <p className="text-gray-500 text-center py-6">{message}</p>;
  }

  return (
    <ul className="space-y-3">
      {songs.map((song) => (
        <SongListItem
          key={song.song_id} // Use song_id if available and unique, otherwise fallback
          song={song}
          showFavoriteButton={showFavoriteButton}
          isFavoriteList={isFavoriteList}
          onFavoritesChange={onFavoritesChange}
          onRequestClick={onRequestClick} // Pass down
          showRequestButton={showRequestButton} // Pass down
        />
      ))}
    </ul>
  );
};

export default SongList;
