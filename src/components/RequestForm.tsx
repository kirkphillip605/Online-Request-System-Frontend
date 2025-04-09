import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom'; // Import useLocation, useNavigate
import { submitRequest, searchSongs, getVenues } from '../utils/api'; // Added getVenues
import { SongRequestInput, Venue, ApiError, Song, SongSearchResponse } from '../types';
import VenueSelection from './VenueSelection';
import { useDebounce } from '../hooks/useDebounce';
import { Send, Loader2, AlertCircle, CheckCircle, Music, User as UserIcon, Hash, ChevronDown, Search, X, ListMusic } from 'lucide-react';

const SONG_SEARCH_DEBOUNCE_DELAY = 500; // ms
const LOCALSTORAGE_VENUE_ID_KEY = 'karaokeApp_selectedVenueId';
const LOCALSTORAGE_SINGER_NAME_KEY = 'karaokeApp_singerName';

const RequestForm: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const initialSongFromState = location.state?.selectedSong as Song | undefined;

  // --- Component State ---
  const [allVenues, setAllVenues] = useState<Venue[]>([]); // Store all venues for lookup
  const [venuesLoading, setVenuesLoading] = useState(true); // Loading state for venues
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [singerName, setSingerName] = useState<string>(
    // Initialize from localStorage
    () => localStorage.getItem(LOCALSTORAGE_SINGER_NAME_KEY) || ''
  );
  const [keyChange, setKeyChange] = useState<number>(0);

  // Song Search & Selection State
  const [songQuery, setSongQuery] = useState('');
  const [songResults, setSongResults] = useState<Song[]>([]);
  const [selectedSong, setSelectedSong] = useState<Song | null>(initialSongFromState || null); // Initialize from location state
  const [songSearchLoading, setSongSearchLoading] = useState(false);
  const [songSearchError, setSongSearchError] = useState<string | null>(null);
  const debouncedSongQuery = useDebounce(songQuery, SONG_SEARCH_DEBOUNCE_DELAY);

  // Form Submission State
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccessMessage, setSubmitSuccessMessage] = useState<string | null>(null);

  // Ref to prevent clearing location state on first render effect
  const locationStateHandled = useRef(false);

  // --- Effects ---

  // Fetch all venues on mount for lookup
  useEffect(() => {
    const fetchAllVenues = async () => {
      console.log("RequestForm: Fetching all venues...");
      setVenuesLoading(true);
      try {
        const response = await getVenues();
        const fetchedVenues = response.venues || [];
        setAllVenues(fetchedVenues);
        console.log(`RequestForm: Fetched ${fetchedVenues.length} venues.`);

        // Try to set initial venue from localStorage AFTER venues are loaded
        const storedVenueIdStr = localStorage.getItem(LOCALSTORAGE_VENUE_ID_KEY);
        if (storedVenueIdStr) {
          const storedVenueId = parseInt(storedVenueIdStr, 10);
          const foundVenue = fetchedVenues.find(v => v.venue_id === storedVenueId);
          if (foundVenue && foundVenue.accepting) {
            console.log("RequestForm: Setting venue from localStorage:", foundVenue.name);
            setSelectedVenue(foundVenue);
          } else if (foundVenue) {
             console.log("RequestForm: Found venue in localStorage but it's not accepting requests:", foundVenue.name);
             localStorage.removeItem(LOCALSTORAGE_VENUE_ID_KEY); // Clear invalid stored venue
          } else {
             console.log("RequestForm: Venue ID from localStorage not found in fetched venues.");
             localStorage.removeItem(LOCALSTORAGE_VENUE_ID_KEY); // Clear invalid stored venue
          }
        }
      } catch (err) {
        console.error("RequestForm: Error fetching venues:", err);
        // Handle error appropriately, maybe show a message
      } finally {
        setVenuesLoading(false);
      }
    };
    fetchAllVenues();
  }, []); // Fetch only once on mount

  // Clear location state after processing initial song
   useEffect(() => {
       if (initialSongFromState && !locationStateHandled.current) {
           console.log("RequestForm: Initial song received from navigation state:", initialSongFromState.title);
           // Clear the state to prevent re-applying if the component re-renders
           // or if the user navigates back and forth.
           navigate(location.pathname, { replace: true, state: {} });
           locationStateHandled.current = true;
       }
   }, [initialSongFromState, location.pathname, navigate]);

  // Persist selected venue ID to localStorage
  useEffect(() => {
    if (selectedVenue) {
      localStorage.setItem(LOCALSTORAGE_VENUE_ID_KEY, String(selectedVenue.venue_id));
      console.log("RequestForm: Persisted venue ID:", selectedVenue.venue_id);
    } else {
      // If venue is deselected, remove it from storage
      localStorage.removeItem(LOCALSTORAGE_VENUE_ID_KEY);
      console.log("RequestForm: Cleared persisted venue ID.");
    }
  }, [selectedVenue]);

  // Persist singer name to localStorage (debounced slightly)
  const debouncedSingerName = useDebounce(singerName, 300);
  useEffect(() => {
    if (debouncedSingerName) {
      localStorage.setItem(LOCALSTORAGE_SINGER_NAME_KEY, debouncedSingerName);
      // console.log("RequestForm: Persisted singer name:", debouncedSingerName); // Can be noisy
    } else {
      localStorage.removeItem(LOCALSTORAGE_SINGER_NAME_KEY);
    }
  }, [debouncedSingerName]);


  // --- Handlers ---

  // Venue Selection
  const handleVenueSelect = (venue: Venue) => {
    if (!venue.accepting) {
      setSubmitError(`Venue "${venue.name}" is not currently accepting requests.`);
      setSelectedVenue(null); // Don't select non-accepting venue
    } else {
      setSelectedVenue(venue);
      setSubmitError(null); // Clear errors
      setSubmitSuccessMessage(null); // Clear success message
      // Don't reset song selection if venue changes, user might want same song at diff venue
    }
  };

  const clearVenueSelection = () => {
    setSelectedVenue(null);
    setSubmitError(null);
    setSubmitSuccessMessage(null);
    // Don't clear song selection here either
  };

  // Song Search Logic (only if no song is selected)
  const performSongSearch = useCallback(async () => {
    // Don't search if a song is already selected
    if (selectedSong || !debouncedSongQuery.trim() || !selectedVenue?.accepting) {
      setSongResults([]);
      setSongSearchError(null);
      setSongSearchLoading(false);
      return;
    }

    setSongSearchLoading(true);
    setSongSearchError(null);
    setSongResults([]);

    try {
      const response: SongSearchResponse = await searchSongs({ q: debouncedSongQuery, size: 10 });
      setSongResults(response.songs || []);
      if (response.totalItems === 0) {
        setSongSearchError('No songs found matching your search.');
      }
    } catch (err: any) {
      console.error('Song Search Error in Request Form:', err);
      const apiError = err as ApiError;
      setSongSearchError(apiError.errorString || apiError.message || 'Failed to search songs.');
      setSongResults([]);
    } finally {
      setSongSearchLoading(false);
    }
  }, [debouncedSongQuery, selectedSong, selectedVenue]); // Dependencies

  // Trigger song search when debounced query changes (and venue selected)
  useEffect(() => {
    performSongSearch();
  }, [performSongSearch]); // performSongSearch includes necessary dependencies

  // Song Selection
  const handleSongSelect = (song: Song) => {
    setSelectedSong(song);
    setSongQuery('');
    setSongResults([]);
    setSongSearchError(null);
    setSubmitError(null);
  };

  const clearSelectedSong = () => {
    setSelectedSong(null);
    // Reset related form state if needed, but keep name/venue
  };

  // Singer Name Change
  const handleSingerNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSingerName(e.target.value);
  };

  // Key Change
  const handleKeyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setKeyChange(parseInt(e.target.value, 10));
  };

  // Form Submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);
    setSubmitSuccessMessage(null);

    if (!selectedVenue) {
      setSubmitError("Please select an active venue first.");
      return;
    }
    if (!selectedSong) {
      setSubmitError("Please select a song.");
      return;
    }
    if (!singerName.trim()) {
      setSubmitError("Your Name is required.");
      return;
    }
    // Double-check venue acceptance status before submitting
    const currentVenue = allVenues.find(v => v.venue_id === selectedVenue.venue_id);
    if (!currentVenue || !currentVenue.accepting) {
        setSubmitError(`Venue "${selectedVenue.name}" is no longer accepting requests. Please select another venue.`);
        setSelectedVenue(null); // Clear invalid selection
        localStorage.removeItem(LOCALSTORAGE_VENUE_ID_KEY); // Clear from storage too
        return;
    }

    setSubmitLoading(true);

    const requestData: SongRequestInput = {
      venue_id: selectedVenue.venue_id,
      artist: selectedSong.artist,
      title: selectedSong.title,
      singer_name: singerName.trim(),
      key_change: keyChange,
      // song_id: selectedSong.song_id, // Send song_id if backend uses it
    };

    try {
      const response = await submitRequest(requestData);
      setSubmitSuccessMessage(response.message || 'Request submitted successfully!');
      // Clear only song-specific fields after success? Or full clear?
      // Let's clear song, name, key. Keep venue for next request.
      setSelectedSong(null);
      setSingerName(''); // Clear name state (will also clear localStorage via effect)
      setKeyChange(0);
      // Clear location state again just in case
      navigate(location.pathname, { replace: true, state: {} });
      locationStateHandled.current = false; // Allow potential future navigation state

    } catch (err: any) {
      console.error('Submit Request Error:', err);
      const apiError = err as ApiError;
      // ... (error handling as before) ...
       if (apiError.details && Array.isArray(apiError.details)) {
         const validationErrors = apiError.details.map((d: any) => d.message || String(d)).join(', ');
         setSubmitError(`Submission failed: ${apiError.errorString}. Details: ${validationErrors}`);
       } else {
         setSubmitError(apiError.errorString || apiError.message || 'Failed to submit request.');
       }
    } finally {
      setSubmitLoading(false);
    }
  };

  // Key change options (same as before)
  const keyChangeOptions = [
    { value: 0, label: "Original Key (0)" }, -1, -2, -3, -4, -5, -6, 1, 2, 3, 4, 5, 6
  ].map(val => ({ value: val, label: typeof val === 'number' ? (val === 0 ? "Original Key (0)" : `${val > 0 ? '+' : ''}${val} Semitone${Math.abs(val) !== 1 ? 's' : ''}`) : val.label }));


  return (
    <div className="max-w-2xl mx-auto space-y-8 p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold text-center text-gray-800">Submit a Song Request</h2>

      {/* 1. Venue Selection */}
      {venuesLoading ? (
         <div className="flex justify-center items-center py-5">
           <Loader2 className="h-6 w-6 text-indigo-600 animate-spin" />
           <span className="ml-2 text-gray-600">Loading venues...</span>
         </div>
      ) : (
        <VenueSelection
          onVenueSelect={handleVenueSelect}
          selectedVenueId={selectedVenue?.venue_id}
          clearSelection={clearVenueSelection}
          // Pass all venues down if VenueSelection needs them, or let it fetch its own
          // venues={allVenues} // Optional: pass fetched venues down
        />
      )}

      {/* 2. Request Form (shown only when venue is selected and accepting) */}
      {selectedVenue && selectedVenue.accepting && (
        <form onSubmit={handleSubmit} className="space-y-6 border-t border-gray-200 pt-6">
          {/* Global Form Error/Success Messages */}
          {submitError && !submitSuccessMessage && (
            <div className="flex items-center p-4 bg-red-100 text-red-700 rounded-md border border-red-200">
              <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />
              <span className="text-sm">{submitError}</span>
            </div>
          )}
          {submitSuccessMessage && (
            <div className="flex items-center p-4 bg-green-100 text-green-700 rounded-md border border-green-200">
              <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0" />
              <span className="text-sm">{submitSuccessMessage}</span>
            </div>
          )}

          {/* 3. Song Selection Area */}
          <div className="space-y-3 p-4 border border-gray-200 rounded-md bg-gray-50">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {selectedSong ? 'Selected Song' : 'Select Song'} <span className="text-red-500">*</span>
            </label>

            {selectedSong ? (
              <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-200 rounded-md">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-indigo-800 truncate">{selectedSong.title}</p>
                  <p className="text-xs text-indigo-600 truncate">{selectedSong.artist}</p>
                </div>
                <button
                  type="button"
                  onClick={clearSelectedSong}
                  disabled={submitLoading || !!submitSuccessMessage} // Disable if submitting/success
                  className="ml-2 p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 rounded-full flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Change Song"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                {/* Song Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search for song title or artist..."
                    value={songQuery}
                    onChange={(e) => setSongQuery(e.target.value)}
                    disabled={submitLoading || !!submitSuccessMessage} // Disable if submitting/success
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100"
                  />
                </div>
                {/* Loading/Error/Results */}
                {songSearchLoading && <div className="flex items-center text-sm text-gray-500 py-2"><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Searching...</div>}
                {songSearchError && !songSearchLoading && <div className="flex items-center text-sm text-red-600 py-2"><AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" /> {songSearchError}</div>}
                {!songSearchLoading && songResults.length > 0 && (
                  <ul className="mt-2 space-y-1 max-h-48 overflow-y-auto border border-gray-200 rounded-md bg-white p-1">
                    {songResults.map((song) => (
                      <li key={song.id || song.song_id}> {/* Use unique ID */}
                        <button
                          type="button"
                          onClick={() => handleSongSelect(song)}
                          className="w-full text-left p-2 rounded-md hover:bg-indigo-50 focus:outline-none focus:bg-indigo-100 transition-colors duration-150"
                        >
                          <p className="text-sm font-medium text-gray-800 truncate">{song.title}</p>
                          <p className="text-xs text-gray-500 truncate">{song.artist}</p>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>

          {/* 4. Singer Name Input (Enable if song is selected) */}
          <div className="relative">
            <label htmlFor="singerName" className="block text-sm font-medium text-gray-700 mb-1">Your Name (for the Host) <span className="text-red-500">*</span></label>
            <UserIcon className="absolute left-3 top-9 h-5 w-5 text-gray-400 pointer-events-none" />
            <input
              id="singerName" type="text" placeholder="Your Name"
              value={singerName}
              onChange={handleSingerNameChange} // Use specific handler
              required aria-required="true"
              disabled={!selectedSong || submitLoading || !!submitSuccessMessage}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* 5. Key Change Select (Enable if song is selected) */}
          <div className="relative">
            <label htmlFor="keyChange" className="block text-sm font-medium text-gray-700 mb-1">Key Change (Optional)</label>
            <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            <select
              id="keyChange" value={keyChange} onChange={handleKeyChange}
              disabled={!selectedSong || submitLoading || !!submitSuccessMessage}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm appearance-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              {keyChangeOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>

          {/* 6. Submit Button */}
          <div>
            <button
              type="submit"
              disabled={!selectedSong || !singerName.trim() || submitLoading || !!submitSuccessMessage} // Also disable if name is empty
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity duration-200"
            >
              {submitLoading ? (
                <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Submitting...</>
              ) : (
                <><Send className="h-5 w-5 mr-2" /> Submit Request</>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Message if venue selected but not accepting */}
       {selectedVenue && !selectedVenue.accepting && !venuesLoading && (
           <div className="flex items-center p-4 bg-yellow-100 text-yellow-800 rounded-md border border-yellow-200 mt-6">
             <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0 text-yellow-600" />
             <span className="text-sm">The selected venue, "{selectedVenue.name}", is not currently accepting requests. Please choose another venue.</span>
           </div>
       )}
    </div>
  );
};

export default RequestForm;
