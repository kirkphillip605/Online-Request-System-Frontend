import React from 'react';
import { Song } from '../types'; // Assuming Song type is defined

interface SongDetailsProps {
  song: Song | null; // Allow null if no song is selected
  // Add other props as needed, e.g., actions like 'Add to Favorites'
}

const SongDetails: React.FC<SongDetailsProps> = ({ song }) => {
  if (!song) {
    return <div className="p-4 text-center text-gray-500">Select a song to see details.</div>;
  }

  return (
    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800">{song.title}</h3>
      <p className="text-md text-gray-600 mb-2">{song.artist}</p>
      {/* Display other details if available */}
      {song.genre && <p className="text-sm text-gray-500">Genre: {song.genre}</p>}
      {song.duration && (
        <p className="text-sm text-gray-500">
          Duration: {Math.floor(song.duration / 60)}:{String(song.duration % 60).padStart(2, '0')}
        </p>
      )}
      {/* Add action buttons here (e.g., Add to Favorites, Request) */}
    </div>
  );
};

export default SongDetails;
