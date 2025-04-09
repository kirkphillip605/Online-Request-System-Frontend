/**
 * Components Barrel File
 *
 * This file re-exports all components from the current directory and subdirectories.
 * It simplifies importing components in other parts of the application.
 *
 * Example Usage:
 * import { Login, Register, Navbar } from './components';
 */

export { default as Login } from './Login';
export { default as Register } from './Register';
export { default as Navbar } from './Navbar';
export { default as Footer } from './Footer';
export { default as HealthCheck } from './HealthCheck';
export { default as ErrorBoundary } from './ErrorBoundary';
export { default as SongSearch } from './SongSearch';
export { default as SongList } from './SongList';
export { default as VenueSelection } from './VenueSelection';
export { default as RequestForm } from './RequestForm';
export { default as MyFavorites } from './MyFavorites';
// export { default as SongDetails } from './SongDetails'; // Uncomment when created
