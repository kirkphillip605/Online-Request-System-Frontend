import {
  Song,
  Venue,
  LoginResponse,
  RegisterResponse,
  SongSearchResponse,
  ListArtistsResponse,
  GetSongByIdResponse,
  GetVenuesResponse,
  SongRequestInput,
  SongRequestResponse,
  HealthCheckResponse,
  GetFavoritesResponse,
  AddFavoriteResponse,
  RemoveFavoriteResponse,
  ApiError, // Use the refined ApiError type
  User
} from '../types';

// Use import.meta.env for Vite environment variables
const API_HOST = import.meta.env.VITE_API_HOST || 'http://localhost';
const API_PORT = import.meta.env.VITE_API_PORT || '3000';
const API_BASE_URL = `${API_HOST}:${API_PORT}/api`;

console.log(`API Base URL configured: ${API_BASE_URL}`);

/**
 * Creates a standardized ApiError object.
 * @param message - The primary error message.
 * @param status - Optional HTTP status code.
 * @param details - Optional additional details (e.g., validation errors).
 * @param responseData - Optional raw API response data.
 * @returns An ApiError object.
 */
const createApiError = (
  message: string,
  status?: number,
  details?: any,
  responseData?: any
): ApiError => {
  const error = new Error(message) as ApiError;
  error.error = true; // Mark as an API-structured error
  error.errorString = message;
  error.status = status;
  error.details = details;
  error.isApiError = true;
  error.apiResponse = responseData;
  return error;
};


// Helper function to handle API requests and standardize responses/errors
const handleRequest = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json', // Default to JSON, override if needed (like health check)
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  console.log('API Request:', url, { method: config.method || 'GET', headers: config.headers, body: config.body ? '(body present)' : '(no body)' });

  try {
    const response = await fetch(url, config);
    console.log('API Response Status:', response.status, response.statusText);

    // Handle 204 No Content (Success, no body) - e.g., DELETE favorite
    if (response.status === 204) {
      console.log('API Response: 204 No Content');
      // Return an empty object cast to T, assuming the caller handles it
      return {} as T;
    }

    // Get response text to handle both JSON and non-JSON responses
    const responseText = await response.text();

    // Attempt to parse JSON
    let responseData: any;
    try {
      responseData = JSON.parse(responseText);
      console.log('API Response Data:', responseData);
    } catch (jsonError) {
      // Handle cases where response is not JSON (e.g., plain text health check, or unexpected server error HTML)
      console.warn('Failed to parse API response as JSON. Text:', responseText.substring(0, 100) + '...'); // Log snippet

      if (!response.ok) {
        // If fetch failed and response wasn't JSON, throw a generic error using status text or response text
        throw createApiError(
          `Request failed: ${response.status} ${response.statusText || responseText}`,
          response.status
        );
      } else {
        // If fetch was ok but response wasn't JSON (e.g., health check returning "OK")
        // Return the text directly, cast to T. Caller must expect this possibility.
        return responseText as unknown as T;
      }
    }

    // Check for backend-defined error structure within the JSON response
    // Backend uses { error: true, errorString: "...", details?: ... }
    if (responseData.error === true) {
      console.error('API Error Data:', responseData);
      throw createApiError(
        responseData.errorString || `API Error: ${response.status}`,
        response.status,
        responseData.details,
        responseData
      );
    }

    // If response.ok is false, but backend didn't send { error: true }
    // Still treat it as an error, using the parsed data if available
    if (!response.ok) {
        console.error('API Error (Not OK, no error flag):', responseData);
        throw createApiError(
            responseData.message || responseData.errorString || `Request failed: ${response.status}`,
            response.status,
            responseData.details,
            responseData
        );
    }


    // Success: return the parsed JSON data
    return responseData as T;

  } catch (error: any) {
    // Catch fetch errors (network issues) or errors thrown above
    console.error('API Fetch/Processing Error:', error);

    // Ensure the error thrown is an ApiError instance
    if (error.isApiError) {
      throw error; // Re-throw the already formatted ApiError
    } else {
      // Wrap other errors (e.g., network errors) in the ApiError structure
      throw createApiError(
        error.message || 'An unexpected network or processing error occurred.',
        undefined, // Status might not be available for network errors
        error.stack // Include stack for debugging if available
      );
    }
  }
};


// Helper to create Authorization headers
const getAuthHeaders = (token: string): HeadersInit => {
  if (!token) {
    // This case should ideally be prevented by UI logic, but log a warning.
    console.warn('Attempted to get Auth Headers without a token.');
    // Returning empty headers might be safer than throwing here,
    // letting the API endpoint handle the missing auth.
    return {};
  }
  return {
    Authorization: `Bearer ${token}`,
  };
};

// === PUBLIC ENDPOINTS ===

// 1. Patron Registration: POST /api/patron/auth/register
export const registerUser = async (userData: Omit<User, 'id' | 'patronId'> & { password: string }): Promise<RegisterResponse> => {
  const { id, patronId, ...dataToSend } = userData; // Exclude internal IDs
  return handleRequest<RegisterResponse>(`${API_BASE_URL}/patron/auth/register`, {
    method: 'POST',
    body: JSON.stringify(dataToSend), // Backend expects: first_name, last_name, email, mobile_number, password
  });
};

// 2. Patron Login: POST /api/patron/auth/login
export const loginUser = async (credentials: Pick<User, 'email'> & { password: string }): Promise<LoginResponse> => {
  return handleRequest<LoginResponse>(`${API_BASE_URL}/patron/auth/login`, {
    method: 'POST',
    body: JSON.stringify(credentials), // Backend expects: email, password
  });
};

// 3. Songs Endpoints
// A. Search Songs: GET /api/songs/search?q={query}&artist={artist}&title={title}&page={page}&size={size}
export const searchSongs = async (params: {
  q?: string;
  artist?: string;
  title?: string;
  page?: number;
  size?: number;
}): Promise<SongSearchResponse> => {
  const filteredParams: Record<string, string> = {};
  Object.entries(params).forEach(([key, value]) => {
    // Ensure only non-empty values are included
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      filteredParams[key] = String(value);
    }
  });
  const queryParams = new URLSearchParams(filteredParams).toString();
  const url = `${API_BASE_URL}/songs/search${queryParams ? `?${queryParams}` : ''}`;
  return handleRequest<SongSearchResponse>(url);
};

// B. List Artists: GET /api/songs/artists?page={page}&size={size}
export const listArtists = async (page: number = 1, size: number = 100): Promise<ListArtistsResponse> => {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  return handleRequest<ListArtistsResponse>(`${API_BASE_URL}/songs/artists?${params.toString()}`);
};

// C. Get Song by ID: GET /api/songs/{songId}
export const getSongById = async (songId: number | string): Promise<GetSongByIdResponse> => {
  return handleRequest<GetSongByIdResponse>(`${API_BASE_URL}/songs/${encodeURIComponent(String(songId))}`);
};

// 4. Venues Endpoints: GET /api/public/venues?id={id}&url_name={url_name}&lat={lat}&lon={lon}&distance={distance}
export const getVenues = async (params: {
  id?: number;
  url_name?: string;
  lat?: number;
  lon?: number;
  distance?: number; // in km
} = {}): Promise<GetVenuesResponse> => {
  const filteredParams: Record<string, string> = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      filteredParams[key] = String(value);
    }
  });
  const queryParams = new URLSearchParams(filteredParams).toString();
  const url = `${API_BASE_URL}/public/venues${queryParams ? `?${queryParams}` : ''}`;
  return handleRequest<GetVenuesResponse>(url);
};


// 5. Public Requests: POST /api/requests
export const submitRequest = async (requestData: SongRequestInput): Promise<SongRequestResponse> => {
  // Backend expects: venue_id, artist, title, singer_name, key_change
  return handleRequest<SongRequestResponse>(`${API_BASE_URL}/requests`, {
    method: 'POST',
    body: JSON.stringify(requestData),
  });
};

// 6. Health Check: GET /api/health
export const getHealth = async (): Promise<HealthCheckResponse | string> => {
  // Attempt to get health status, accepting JSON or plain text
  return handleRequest<HealthCheckResponse | string>(`${API_BASE_URL}/health`, {
     headers: { Accept: 'application/json, text/plain, */*' } // Accept multiple types
  });
  // Errors will be thrown by handleRequest if the request fails
};


// === PATRON ACCESSIBLE ENDPOINTS (Require Auth) ===

// 7. List My Favorites: GET /api/patron/favorites
export const getFavoriteSongs = async (token: string): Promise<GetFavoritesResponse> => {
  if (!token) throw createApiError("Authentication token is required.", 401);
  return handleRequest<GetFavoritesResponse>(`${API_BASE_URL}/patron/favorites`, {
    headers: getAuthHeaders(token),
  });
};

// 8. Add Song to Favorites: POST /api/patron/favorites
export const addSongToFavorites = async (token: string, songId: number): Promise<AddFavoriteResponse> => {
  if (!token) throw createApiError("Authentication token is required.", 401);
  // Backend expects: { song_id: number }
  return handleRequest<AddFavoriteResponse>(`${API_BASE_URL}/patron/favorites`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ song_id: songId }),
  });
};

// 9. Remove Song from Favorites: DELETE /api/patron/favorites/{songId}
// Returns {} on success (204 No Content), throws ApiError on failure.
export const removeSongFromFavorites = async (token: string, songId: number | string): Promise<{}> => {
  if (!token) throw createApiError("Authentication token is required.", 401);
  // Expecting 204 No Content on success, handleRequest returns {}
  return handleRequest<{}>(`${API_BASE_URL}/patron/favorites/${encodeURIComponent(String(songId))}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
  });
};
