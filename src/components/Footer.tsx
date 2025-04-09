import React from 'react';
import { Github } from 'lucide-react'; // Example icon

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-gray-300 py-6 mt-12 shadow-inner"> {/* Added mt-12 */}
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm">
          &copy; {currentYear} KaraokeHub. All rights reserved.
        </p>
        <div className="flex justify-center space-x-4 mt-2">
           {/* Add relevant links or icons here */}
           {/* Example: Link to source code */}
           {/* <a href="https://github.com/your-repo" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
             <Github className="h-5 w-5" />
           </a> */}
           {/* Example: Link to terms */}
           {/* <a href="/terms" className="text-xs hover:text-white transition-colors">Terms of Service</a> */}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
