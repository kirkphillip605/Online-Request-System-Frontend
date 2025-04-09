import React, { useState, useEffect } from 'react';
import { getVenues } from '../utils/api';
import { Venue, ApiError } from '../types';
import { MapPin, Loader2, AlertCircle, Search, XCircle } from 'lucide-react';

interface VenueSelectionProps {
  onVenueSelect: (venue: Venue) => void; // Callback when a venue is selected
  selectedVenueId?: number | null; // Optional: ID of the currently selected venue
  clearSelection?: () => void; // Optional: Callback to clear the selection
}

const VenueSelection: React.FC<VenueSelectionProps> = ({ onVenueSelect, selectedVenueId, clearSelection }) => {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch venues on component mount
  useEffect(() => {
    const fetchVenues = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getVenues(); // Fetch all public venues
        // Assuming handleRequest throws ApiError on failure
        setVenues(response.venues || []);
      } catch (err: any) {
        console.error('Error fetching venues:', err);
        const apiError = err as ApiError;
        setError(apiError.errorString || apiError.message || 'Failed to load venues.');
        setVenues([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVenues();
  }, []); // Empty dependency array ensures fetch only on mount

  // Filter venues based on search term (client-side)
  const filteredVenues = venues.filter(venue =>
    venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    venue.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    venue.state?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedVenue = venues.find(v => v.venue_id === selectedVenueId);

  // If a venue is already selected, show that instead of the list
  if (selectedVenue && clearSelection) {
     return (
        <div className="p-4 border border-indigo-200 bg-indigo-50 rounded-md flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-gray-600">Selected Venue:</p>
            <p className="text-lg font-semibold text-indigo-800">{selectedVenue.name}</p>
             {!selectedVenue.accepting && (
                 <p className="text-xs font-semibold text-red-600 mt-1">Note: This venue is currently not accepting requests.</p>
             )}
          </div>
          <button
            onClick={clearSelection}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center space-x-1 p-1 rounded hover:bg-indigo-100"
            title="Change Venue"
          >
             <XCircle className="h-4 w-4" />
             <span>Change</span>
          </button>
        </div>
     );
  }

  // Show selection list if no venue is selected
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-700">Select a Venue</h3>

      {/* Search Input */}
       <div className="relative">
         <label htmlFor="venue-search" className="sr-only">Search Venues</label>
         <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
         <input
           id="venue-search"
           type="text"
           placeholder="Search venues by name, city, or state..."
           value={searchTerm}
           onChange={(e) => setSearchTerm(e.target.value)}
           className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
         />
       </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-5">
          <Loader2 className="h-6 w-6 text-indigo-600 animate-spin" />
          <span className="ml-2 text-gray-600">Loading venues...</span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="flex items-center p-3 bg-red-100 text-red-700 rounded-md border border-red-200">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
          <span className="text-sm">Error: {error}</span>
        </div>
      )}

      {/* Venue List */}
      {!loading && !error && (
        <ul className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-md p-2 bg-gray-50">
          {filteredVenues.length > 0 ? (
            filteredVenues.map((venue) => (
              <li key={venue.venue_id}>
                <button
                  onClick={() => onVenueSelect(venue)}
                  // Disable selection if venue is not accepting requests
                  // Backend also validates this, but good UX to disable here.
                  disabled={!venue.accepting}
                  className={`w-full text-left p-3 rounded-md flex items-center justify-between ${
                    venue.accepting
                      ? 'hover:bg-indigo-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-300'
                      : 'opacity-60 cursor-not-allowed bg-gray-100'
                  } transition-colors duration-150`}
                  title={venue.accepting ? `Select ${venue.name}` : `${venue.name} (Not accepting requests)`}
                >
                  {/* Venue Details */}
                  <div className="flex items-center space-x-3 min-w-0">
                     <MapPin className={`h-5 w-5 flex-shrink-0 ${venue.accepting ? 'text-indigo-600' : 'text-gray-400'}`} />
                    <div className="min-w-0">
                      <p className={`font-medium truncate ${venue.accepting ? 'text-gray-800' : 'text-gray-500'}`}>{venue.name}</p>
                      {(venue.city || venue.state) && (
                        <p className={`text-sm truncate ${venue.accepting ? 'text-gray-500' : 'text-gray-400'}`}>
                          {venue.city}{venue.city && venue.state ? ', ' : ''}{venue.state}
                        </p>
                      )}
                    </div>
                  </div>
                  {/* Accepting Status Indicator */}
                   {!venue.accepting && (
                     <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded flex-shrink-0">Not Accepting</span>
                   )}
                </button>
              </li>
            ))
          ) : (
            // No Venues Message
            <li className="text-center text-gray-500 py-4 px-2">
              {venues.length === 0 ? 'No venues available at this time.' : 'No venues match your search.'}
            </li>
          )}
        </ul>
      )}
    </div>
  );
};

export default VenueSelection;
