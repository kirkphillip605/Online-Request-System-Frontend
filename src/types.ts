// Define interfaces for your data structures based on API specification

// --- Auth ---
export interface User {
  id: number; // Internal frontend ID derived from patronId
  patronId: number; // Original ID from backend patron object
  first_name: string;
  last_name: string;
  email: string;
  mobile_number?: string; // Optional based on backend model
}

// Matches patron.auth.controller login response
export interface LoginResponse {
  token: string;
  patron: {
    patronId: number; // Matches backend key
    first_name: string;
    last_name: string;
    email: string;
  };
  message?: string; // Optional success message
  error?: boolean; // Indicates error presence
  errorString?: string; // Specific error message from backend
}

// Matches patron.auth.controller register response
export interface RegisterResponse {
   error: boolean; // Indicates error presence
   patron: { // Backend returns the created patron object
     patron_id: number;
     first_name: string | null;
     last_name: string | null;
     email: string;
     mobile_number: string | null;
     createdAt: string;
     updatedAt: string;
   };
   errorString?: string; // Specific error message from backend
}

// --- Songs ---
// Matches SongDB model structure (used in various responses)
export interface Song {
  song_id: number;
  artist: string;
  title: string;
  // Optional: Include join table info if provided by the API endpoint
  Favorite?: { createdAt?: string }; // Example: from getFavoriteSongs join
}

// Matches song.controller searchSongs response structure
export interface SongSearchResponse {
  error: boolean;
  totalItems: number;
  songs: Song[]; // Array of Song objects
  totalPages: number;
  currentPage: number;
  errorString?: string;
}

// Matches song.controller listArtists response structure
export interface ListArtistsResponse {
  error: boolean;
  totalItems: number;
  artists: string[]; // Array of artist names
  totalPages: number;
  currentPage: number;
  errorString?: string;
}

// Matches song.controller getSongById response structure
export interface GetSongByIdResponse {
    error: boolean;
    song: Song; // Song object nested under 'song' key
    errorString?: string;
}


// --- Venues ---
// Matches Venue model structure
export interface Venue {
  venue_id: number;
  name: string;
  url_name?: string | null;
  accepting?: boolean; // Indicates if venue accepts requests
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  lat?: number | null;
  lon?: number | null;
  distance?: number; // Included when using geo-query
}

// Matches public.venues.controller listVenues response structure
export interface GetVenuesResponse {
  error: boolean;
  venues: Venue[];
  errorString?: string;
}

// --- Requests ---
// Matches Request model structure (used in response)
export interface SongRequest {
    request_id: number;
    venue_id: number;
    artist: string;
    title: string;
    singer: string; // Name of the person making the request
    request_time: string; // ISO date string
    key_change: number; // Semitone adjustment
}

// Matches request.controller submitRequest input requirements
export interface SongRequestInput {
  venue_id: number;
  artist: string;
  title: string;
  singer_name: string; // Matches 'singer_name' in controller
  key_change?: number; // Optional, defaults to 0 on backend
}

// Matches request.controller submitRequest response structure
export interface SongRequestResponse {
  error: boolean;
  message: string; // Success or error message
  request?: SongRequest; // Request object nested under 'request' key on success
  errorString?: string;
  details?: any; // For validation errors from backend
}

// --- Favorites ---
// Matches favorite.controller listFavorites response structure
export interface GetFavoritesResponse {
  error: boolean;
  favorites: Song[]; // Array of Song objects (joined via Favorite table)
  errorString?: string;
}

// Matches favorite.controller addFavorite response structure
export interface AddFavoriteResponse {
  error: boolean;
  message: string; // Success message
  favorite: { // Contains the join table entry details
      patron_id: number;
      song_id: number;
      createdAt: string;
      updatedAt: string; // Note: Favorite model has updatedAt: false, but Sequelize might add it
  };
  errorString?: string;
}

// Matches favorite.controller removeFavorite response structure (on error)
// Success is 204 No Content, so no specific success response body needed.
export interface RemoveFavoriteResponse {
  error: boolean;
  errorString: string;
}


// --- Health ---
// Structure for the /api/health endpoint response (if JSON)
export interface HealthCheckResponse {
  status: string; // e.g., 'OK'
  uptime: string; // Backend uptime string
  // Add other fields if the actual health check provides them
}


// --- Generic API Error Structure ---
// Standardized structure for handling errors returned from the API utility
export interface ApiError extends Error { // Extends base Error
  error: boolean; // Always true for errors from backend structure
  errorString: string; // Primary error message from backend or fetch handler
  details?: any; // Optional details (e.g., validation errors from backend)
  status?: number; // HTTP status code
  isApiError?: boolean; // Flag to identify these specific errors
  apiResponse?: any; // Full API response body for context
}
