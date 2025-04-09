import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom'; // Import useNavigate
import { searchSongs } from '../utils/api';
import { Song, ApiError, SongSearchResponse } from '../types';
import { useDebounce } from '../hooks/useDebounce';
import SongList from './SongList';
import { Loader2, Search, AlertCircle, ListMusic } from 'lucide-react';
import { useAuth } from '../context/AuthContext'; // Import useAuth

const SEARCH_DEBOUNCE_DELAY = 500; // ms
const ITEMS_PER_PAGE = 15;

const SongSearch: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate(); // Hook for navigation
  const { isAuthenticated } = useAuth(); // Get auth state

  // State for search query, results, loading, error, and pagination
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<Song[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1', 10));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedQuery = useDebounce(query, SEARCH_DEBOUNCE_DELAY);

  // Function to perform the search API call
  const performSearch = useCallback(async (searchTerm: string, page: number) => {
    if (!searchTerm.trim()) {
      setResults([]);
      setTotalItems(0);
      setError(null);
      setLoading(false);
      return;
    }

    console.log(`Searching for: "${searchTerm}", Page: ${page}`);
    setLoading(true);
    setError(null);

    try {
      const response: SongSearchResponse = await searchSongs({
        q: searchTerm,
        page: page,
        size: ITEMS_PER_PAGE,
      });
      setResults(response.songs || []);
      setTotalItems(response.totalItems || 0);
      if (response.totalItems === 0) {
        setError('No songs found matching your search.');
      }
    } catch (err: any) {
      console.error('Song Search Error:', err);
      const apiError = err as ApiError;
      setError(apiError.errorString || apiError.message || 'Failed to search songs.');
      setResults([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // Effect to trigger search when debounced query or page changes
  useEffect(() => {
    // Update URL search params
    const newSearchParams = new URLSearchParams();
    if (debouncedQuery.trim()) {
      newSearchParams.set('q', debouncedQuery);
    }
    if (currentPage > 1) {
      newSearchParams.set('page', currentPage.toString());
    }
    setSearchParams(newSearchParams, { replace: true }); // Use replace to avoid history clutter

    // Perform the search
    performSearch(debouncedQuery, currentPage);

  }, [debouncedQuery, currentPage, performSearch, setSearchParams]);

  // Handler for input change
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
    setCurrentPage(1); // Reset to page 1 on new search term
  };

  // Pagination handlers
  const handleNextPage = () => {
    if (currentPage * ITEMS_PER_PAGE < totalItems) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  // *** NEW: Handler for Request Button Click in SongList ***
  const handleRequestClick = (song: Song) => {
    console.log('Request clicked for song:', song.title);
    // Navigate to the request form, passing the song details
    // The RequestForm will handle venue selection and name input
    navigate('/request', { state: { selectedSong: song } });
  };

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-4 pb-4 border-b border-gray-200">
        <ListMusic className="h-8 w-8 text-indigo-600" />
        <h2 className="text-3xl font-semibold text-gray-800">Search Songs</h2>
      </div>

      {/* Search Input */}
      <div className="relative">
        <label htmlFor="song-search-input" className="sr-only">Search for songs</label>
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
        <input
          id="song-search-input"
          type="text"
          placeholder="Enter song title or artist..."
          value={query}
          onChange={handleInputChange}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
          <span className="ml-3 text-gray-600">Searching...</span>
        </div>
      )}

      {/* Error Display */}
      {error && !loading && (
        <div className="flex items-center p-4 bg-red-100 text-red-700 rounded-md border border-red-200">
          <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Results List */}
      {!loading && !error && debouncedQuery.trim() && results.length > 0 && (
        <>
          <SongList
            songs={results}
            showFavoriteButton={isAuthenticated} // Show favorite button only if logged in
            showRequestButton={true} // *** NEW: Always show request button on search results ***
            onRequestClick={handleRequestClick} // *** NEW: Pass the handler ***
          />

          {/* Pagination Controls */}
          {totalItems > ITEMS_PER_PAGE && (
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages} ({totalItems} results)
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Initial state / No search term */}
      {!loading && !debouncedQuery.trim() && (
         <p className="text-gray-500 text-center py-6">Enter a search term above to find songs.</p>
      )}
    </div>
  );
};

export default SongSearch;
