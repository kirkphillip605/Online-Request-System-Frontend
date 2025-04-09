import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce a value.
 * It delays updating the returned value until after the specified delay
 * has passed without the input value changing.
 *
 * @template T The type of the value to debounce.
 * @param {T} value The value to debounce.
 * @param {number} delay The debounce delay in milliseconds.
 * @returns {T} The debounced value.
 */
function useDebounce<T>(value: T, delay: number): T {
  // State to store the debounced value
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up a timer to update the debounced value after the delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timer if the value changes before the delay has passed,
    // or if the component unmounts, or if the delay changes.
    // This prevents the debounced value from updating prematurely.
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Re-run the effect only if the value or delay changes

  // Return the latest debounced value
  return debouncedValue;
}

// Export the hook as the default export
export default useDebounce;

// Also export as a named export for flexibility, although default is common for single hooks per file.
export { useDebounce };
