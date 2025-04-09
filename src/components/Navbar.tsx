import React, { useState } from 'react'; // Added useState for mobile menu
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, LogIn, UserPlus, Music, Search, Heart, Send, Activity, Menu, X } from 'lucide-react'; // Added Menu, X

const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Common styles for NavLink
  const getNavLinkClass = ({ isActive }: { isActive: boolean }): string => {
    const baseStyle = "px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 flex items-center space-x-2";
    const activeStyle = "bg-indigo-700 text-white";
    const inactiveStyle = "text-gray-300 hover:bg-indigo-500 hover:text-white";
    return `${baseStyle} ${isActive ? activeStyle : inactiveStyle}`;
  };

   // Common styles for mobile NavLink
   const getMobileNavLinkClass = ({ isActive }: { isActive: boolean }): string => {
     const baseStyle = "block px-3 py-2 rounded-md text-base font-medium transition-colors duration-150 flex items-center space-x-2";
     const activeStyle = "bg-indigo-700 text-white";
     const inactiveStyle = "text-gray-300 hover:bg-indigo-500 hover:text-white";
     return `${baseStyle} ${isActive ? activeStyle : inactiveStyle}`;
   };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
      setIsMobileMenuOpen(false);
  }

  return (
    <nav className="bg-indigo-600 shadow-md sticky top-0 z-50"> {/* Added sticky and z-index */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex-shrink-0">
            <Link to="/" className="text-white text-xl font-bold flex items-center space-x-2" onClick={closeMobileMenu}>
              <Music className="h-6 w-6" />
              <span>KaraokeHub</span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1"> {/* Reduced space slightly */}
            <NavLink to="/search" className={getNavLinkClass}>
               <Search className="h-4 w-4" /> <span>Search</span>
            </NavLink>
            <NavLink to="/request" className={getNavLinkClass}>
               <Send className="h-4 w-4" /> <span>Request</span>
            </NavLink>
            {isAuthenticated && (
              <NavLink to="/favorites" className={getNavLinkClass}>
                 <Heart className="h-4 w-4" /> <span>Favorites</span>
              </NavLink>
            )}
             <NavLink to="/health" className={getNavLinkClass}>
                <Activity className="h-4 w-4" /> <span>API Status</span>
             </NavLink>
          </div>

          {/* Desktop Auth Links/User Info */}
          <div className="hidden md:flex items-center space-x-2">
            {isAuthenticated ? (
              <>
                <span className="text-gray-300 text-sm px-2 hidden lg:block"> {/* Hide on medium screens */}
                  Hi, {user?.first_name || user?.email || 'Patron'}!
                </span>
                <button onClick={logout} className={getNavLinkClass({ isActive: false })}> {/* Use NavLink style */}
                  <LogOut className="h-4 w-4" /> <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={getNavLinkClass}>
                   <LogIn className="h-4 w-4" /> <span>Login</span>
                </NavLink>
                <NavLink to="/register" className={getNavLinkClass}>
                   <UserPlus className="h-4 w-4" /> <span>Register</span>
                </NavLink>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
                onClick={toggleMobileMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-300 hover:text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                aria-controls="mobile-menu"
                aria-expanded={isMobileMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-16 inset-x-0 bg-indigo-600 pb-3 z-40 shadow-lg" id="mobile-menu"> {/* Added absolute positioning */}
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <NavLink to="/search" className={getMobileNavLinkClass} onClick={closeMobileMenu}>
               <Search className="h-5 w-5" /> <span>Search Songs</span>
            </NavLink>
            <NavLink to="/request" className={getMobileNavLinkClass} onClick={closeMobileMenu}>
               <Send className="h-5 w-5" /> <span>Submit Request</span>
            </NavLink>
            {isAuthenticated && (
              <NavLink to="/favorites" className={getMobileNavLinkClass} onClick={closeMobileMenu}>
                 <Heart className="h-5 w-5" /> <span>My Favorites</span>
              </NavLink>
            )}
             <NavLink to="/health" className={getMobileNavLinkClass} onClick={closeMobileMenu}>
                <Activity className="h-5 w-5" /> <span>API Status</span>
             </NavLink>
          </div>
          {/* Mobile Auth Links */}
          <div className="pt-4 pb-3 border-t border-indigo-700">
             {isAuthenticated ? (
                 <div className="px-2 space-y-1">
                     <div className="flex items-center px-3 mb-2">
                         <div className="ml-3">
                             <div className="text-base font-medium text-white">{user?.first_name || user?.email}</div>
                             {user?.email && user?.first_name && <div className="text-sm font-medium text-gray-300">{user.email}</div>}
                         </div>
                     </div>
                     <button
                         onClick={() => { logout(); closeMobileMenu(); }}
                         className={`${getMobileNavLinkClass({ isActive: false })} w-full text-left`}
                     >
                         <LogOut className="h-5 w-5" /> <span>Logout</span>
                     </button>
                 </div>
             ) : (
                 <div className="px-2 space-y-1">
                     <NavLink to="/login" className={getMobileNavLinkClass} onClick={closeMobileMenu}>
                         <LogIn className="h-5 w-5" /> <span>Login</span>
                     </NavLink>
                     <NavLink to="/register" className={getMobileNavLinkClass} onClick={closeMobileMenu}>
                         <UserPlus className="h-5 w-5" /> <span>Register</span>
                     </NavLink>
                 </div>
             )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
