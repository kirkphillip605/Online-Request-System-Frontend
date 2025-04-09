import React, { useState, useEffect } from 'react';
import { getHealth } from '../utils/api';
import { HealthCheckResponse, ApiError } from '../types';
import { Loader2, CheckCircle, AlertTriangle, Server } from 'lucide-react';

const HealthCheck: React.FC = () => {
  const [status, setStatus] = useState<string | null>(null);
  const [uptime, setUptime] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      setLoading(true);
      setError(null);
      setStatus(null);
      setUptime(null);

      try {
        const response = await getHealth();

        // Check if the response is a string (plain text) or an object
        if (typeof response === 'string') {
          // Simple text response, e.g., "OK"
          setStatus(response);
          setUptime('N/A'); // Uptime not available in simple response
        } else if (typeof response === 'object' && response !== null && 'status' in response) {
          // JSON response with expected structure
          const healthResponse = response as HealthCheckResponse;
          setStatus(healthResponse.status || 'Unknown');
          setUptime(healthResponse.uptime || 'N/A');
        } else {
          // Unexpected response format
          setStatus('Unexpected Response Format');
          setUptime('N/A');
          console.warn("Unexpected health check response format:", response);
        }

      } catch (err: any) {
        console.error('Health Check Error:', err);
        const apiError = err as ApiError;
        setError(apiError.errorString || apiError.message || 'Failed to connect to API.');
        setStatus('Error');
        setUptime('N/A');
      } finally {
        setLoading(false);
      }
    };

    checkHealth();
    // Optional: Set up an interval to periodically check health
    // const intervalId = setInterval(checkHealth, 30000); // Check every 30 seconds
    // return () => clearInterval(intervalId); // Cleanup interval on unmount
  }, []); // Run only on mount (or add dependencies if needed)

  // Determine status color and icon
  let statusColor = 'text-gray-500';
  let IconComponent = Loader2;
  let iconAnimation = 'animate-spin';

  if (!loading) {
    iconAnimation = ''; // Stop spinning once loaded
    if (status === 'OK' || (typeof status === 'string' && status.toLowerCase().includes('ok'))) {
      statusColor = 'text-green-600';
      IconComponent = CheckCircle;
    } else if (error || status === 'Error') {
      statusColor = 'text-red-600';
      IconComponent = AlertTriangle;
    } else {
        statusColor = 'text-yellow-600'; // For unknown or unexpected statuses
        IconComponent = AlertTriangle;
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center flex items-center justify-center space-x-2">
        <Server className="h-6 w-6" />
        <span>API Health Status</span>
      </h2>

      <div className={`flex items-center justify-center p-4 rounded-md border ${
          loading ? 'border-gray-200 bg-gray-50' :
          statusColor === 'text-green-600' ? 'border-green-200 bg-green-50' :
          statusColor === 'text-red-600' ? 'border-red-200 bg-red-50' :
          'border-yellow-200 bg-yellow-50'
      }`}>
        <IconComponent className={`h-8 w-8 mr-4 ${statusColor} ${iconAnimation}`} />
        <div className="text-left">
          <p className={`text-lg font-medium ${statusColor}`}>
            {loading ? 'Checking...' : (status || 'Unknown')}
          </p>
          {error && !loading && (
            <p className="text-sm text-red-700 mt-1">{error}</p>
          )}
          {!loading && !error && uptime && uptime !== 'N/A' && (
            <p className="text-sm text-gray-600 mt-1">Uptime: {uptime}</p>
          )}
        </div>
      </div>
       {/* Optional: Add a button to re-check */}
       {/* <div className="mt-4 text-center">
           <button
               onClick={checkHealth} // Assuming checkHealth is defined in scope
               disabled={loading}
               className="px-4 py-1 text-sm font-medium text-indigo-700 bg-indigo-100 border border-transparent rounded-md hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
           >
               {loading ? 'Checking...' : 'Re-check'}
           </button>
       </div> */}
    </div>
  );
};

export default HealthCheck;
