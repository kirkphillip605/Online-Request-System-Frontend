import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../utils/api';
import { ApiError } from '../types'; // Import ApiError
import { UserPlus, Loader2, AlertCircle, CheckCircle, Mail, Lock, User as UserIcon, Phone } from 'lucide-react';

const Register: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) { // Basic password length check
        setError("Password must be at least 6 characters long.");
        return;
    }

    setLoading(true);

    try {
      const userData = {
        first_name: firstName.trim() || null, // Send null if empty, backend allows null
        last_name: lastName.trim() || null,   // Send null if empty
        email: email.trim(),
        mobile_number: mobileNumber.trim() || null, // Send null if empty
        password: password,
      };

      const response = await registerUser(userData);

      // Backend response structure has { error: false, patron: {...} } on success
      if (!response.error) {
        setSuccess(`Registration successful for ${response.patron.email}! You can now log in.`);
        // Optionally clear form or redirect after a delay
        setTimeout(() => {
          navigate('/login');
        }, 3000); // Redirect after 3 seconds
      } else {
         // This case should ideally be caught by the catch block due to handleRequest logic
         setError(response.errorString || 'Registration failed. Please try again.');
      }

    } catch (err: any) {
      console.error('Registration Error:', err);
      const apiError = err as ApiError;
      // Handle specific validation errors if provided by backend
      if (apiError.details && Array.isArray(apiError.details)) {
          const validationMessages = apiError.details.map((d: any) => d.message || String(d)).join(' ');
          setError(`Registration failed: ${validationMessages}`);
      } else {
          setError(apiError.errorString || 'Registration failed. Please check your input and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="flex items-center p-3 bg-red-100 text-red-700 rounded-md border border-red-200">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-center p-3 bg-green-100 text-green-700 rounded-md border border-green-200">
              <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <span className="text-sm">{success}</span>
            </div>
          )}

          {/* Input Fields */}
          <div className="rounded-md shadow-sm space-y-4">
             {/* First Name */}
             <div className="relative">
               <label htmlFor="first-name" className="sr-only">First Name</label>
               <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
               <input
                 id="first-name" name="first-name" type="text" autoComplete="given-name"
                 className="appearance-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                 placeholder="First Name (Optional)"
                 value={firstName} onChange={(e) => setFirstName(e.target.value)}
               />
             </div>
             {/* Last Name */}
             <div className="relative">
               <label htmlFor="last-name" className="sr-only">Last Name</label>
               <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
               <input
                 id="last-name" name="last-name" type="text" autoComplete="family-name"
                 className="appearance-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                 placeholder="Last Name (Optional)"
                 value={lastName} onChange={(e) => setLastName(e.target.value)}
               />
             </div>
             {/* Email */}
            <div className="relative">
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              <input
                id="email-address" name="email" type="email" autoComplete="email" required
                className="appearance-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Email address"
                value={email} onChange={(e) => setEmail(e.target.value)}
              />
            </div>
             {/* Mobile Number */}
             <div className="relative">
               <label htmlFor="mobile-number" className="sr-only">Mobile Number</label>
               <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
               <input
                 id="mobile-number" name="mobile-number" type="tel" autoComplete="tel"
                 className="appearance-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                 placeholder="Mobile Number (Optional)"
                 value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)}
               />
             </div>
             {/* Password */}
            <div className="relative">
              <label htmlFor="password" className="sr-only">Password</label>
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              <input
                id="password" name="password" type="password" required minLength={6}
                className="appearance-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Password (min. 6 characters)"
                value={password} onChange={(e) => setPassword(e.target.value)}
              />
            </div>
             {/* Confirm Password */}
            <div className="relative">
              <label htmlFor="confirm-password" className="sr-only">Confirm Password</label>
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              <input
                id="confirm-password" name="confirm-password" type="password" required minLength={6}
                className="appearance-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Confirm Password"
                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || !!success} // Disable button while loading or on success
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-3" /> Registering...
                </>
              ) : (
                <>
                  <UserPlus className="h-5 w-5 mr-2" /> Register
                </>
              )}
            </button>
          </div>
        </form>
         <div className="text-sm text-center">
            <p className="text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                    Sign in here
                </Link>
            </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
