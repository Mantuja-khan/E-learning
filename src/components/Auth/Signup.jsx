import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { FaGraduationCap, FaEnvelope, FaLock, FaSpinner } from 'react-icons/fa';

const Signup = ({ onToggle }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOTPInput, setShowOTPInput] = useState(false);
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:3001/api/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('OTP sent to your email!');
        setShowOTPInput(true);
      } else {
        throw new Error(data.error || 'Failed to send OTP');
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setIsVerifying(true);
    
    try {
      const response = await fetch('http://localhost:3001/api/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Proceed with signup after OTP verification
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        
        if (error) throw error;
        
        toast.success('Signed up successfully! You can now log in.');
        onToggle();
      } else {
        throw new Error(data.error || 'Invalid OTP');
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-3 sm:py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 sm:space-y-8 backdrop-blur-sm bg-white/80 p-6 sm:p-8 rounded-xl sm:rounded-2xl shadow-xl border border-blue-100">
        <div>
          <div className="flex justify-center">
            <div className="bg-blue-600 p-3 sm:p-4 rounded-full shadow-lg transform hover:scale-105 transition-transform duration-300">
              <FaGraduationCap className="text-3xl sm:text-4xl md:text-5xl text-white" />
            </div>
          </div>
          <h2 className="mt-4 sm:mt-6 text-center text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Join the Learning Journey
          </h2>
          <p className="mt-1 sm:mt-2 text-center text-xs sm:text-sm text-gray-600">
            Create your account and start learning today
          </p>
        </div>
        
        <form onSubmit={showOTPInput ? handleVerifyOTP : handleSendOTP} className="mt-6 sm:mt-8 space-y-4 sm:space-y-6">
          <div className="space-y-3 sm:space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaEnvelope className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9 sm:pl-10 block w-full px-3 sm:px-4 py-2 sm:py-3 border-0 text-sm text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 shadow-sm"
                placeholder="Email address"
                disabled={showOTPInput}
              />
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9 sm:pl-10 block w-full px-3 sm:px-4 py-2 sm:py-3 border-0 text-sm text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 shadow-sm"
                placeholder="Password"
                disabled={showOTPInput}
              />
            </div>
            {showOTPInput && (
              <div className="relative">
                <input
                  type="text"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="block w-full px-3 sm:px-4 py-2 sm:py-3 border-0 text-sm text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 shadow-sm"
                  placeholder="Enter OTP from email"
                  maxLength={6}
                />
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || isVerifying}
              className="group relative w-full flex justify-center py-2 sm:py-3 px-4 text-xs sm:text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform transition-all duration-150 hover:shadow-lg hover:-translate-y-1"
            >
              {loading || isVerifying ? (
                <span className="flex items-center">
                  <FaSpinner className="animate-spin -ml-1 mr-2 h-3 w-3 sm:h-4 sm:w-4 text-white" />
                  {loading ? 'Sending OTP...' : 'Verifying...'}
                </span>
              ) : showOTPInput ? 'Verify OTP' : 'Send OTP'}
            </button>
          </div>
        </form>

        <div className="text-center pt-1 sm:pt-2">
          <div className="flex items-center justify-center space-x-1">
            <span className="h-px bg-gray-300 w-12 sm:w-16"></span>
            <span className="text-xs sm:text-sm text-gray-500">Already registered?</span>
            <span className="h-px bg-gray-300 w-12 sm:w-16"></span>
          </div>
          <button
            onClick={onToggle}
            className="mt-2 sm:mt-3 text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-medium inline-flex items-center group transition-colors duration-150"
          >
            Sign in to your account
            <svg className="ml-1 w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform duration-150" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Signup;