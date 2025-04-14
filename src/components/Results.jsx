import React, { useState, useEffect } from 'react';
import { FaTrophy } from 'react-icons/fa';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

const Results = () => {
  const [results, setResults] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [user, setUser] = useState(null);
  const [firstAttempt, setFirstAttempt] = useState(null);

  const courses = ['B.Tech', 'BCA', 'MCA', 'M.Tech'];
  const branches = ['Computer Science', 'IT', 'Electronics', 'Mechanical'];
  const semesters = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user && selectedCourse && selectedBranch && selectedSemester) {
      fetchResults();
    }
  }, [user, selectedCourse, selectedBranch, selectedSemester]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchResults = async () => {
    try {
      const { data, error } = await supabase
        .from('quiz_results')
        .select('*')
        .eq('user_id', user.id)
        .eq('course', selectedCourse)
        .eq('branch', selectedBranch)
        .eq('semester', selectedSemester)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setResults(data || []);
      
      // Set the first attempt
      if (data && data.length > 0) {
        setFirstAttempt(data[0].id);
      } else {
        setFirstAttempt(null);
      }
    } catch (error) {
      toast.error('Error fetching results: ' + error.message);
    }
  };

  const calculateAverageScore = () => {
    if (results.length === 0) return 0;
    const totalScore = results.reduce((acc, result) => acc + (result.score / result.total_questions * 100), 0);
    return Math.round(totalScore / results.length);
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-white p-6 sm:p-10 rounded-xl shadow-lg">
      <div className="flex items-center space-x-3 mb-6">
        <FaTrophy className="text-3xl text-yellow-500" />
        <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-800">Quiz Results</h2>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Filter Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">Filter Results</h3>
          {[['Course', courses, selectedCourse, setSelectedCourse],
            ['Branch', branches, selectedBranch, setSelectedBranch],
            ['Semester', semesters, selectedSemester, setSelectedSemester]].map(([label, options, value, setter]) => (
              <div key={label} className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <select
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  className="w-full p-3 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50"
                >
                  <option value="">Select {label}</option>
                  {options.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
          ))}
        </div>

        {/* Results Overview */}
        {selectedCourse && selectedBranch && selectedSemester && (
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <h3 className="text-xl font-semibold mb-4">Performance Overview</h3>
            {results.length === 0 ? (
              <p className="text-gray-500">No quiz results found for the selected filters.</p>
            ) : (
              <>
                <div className="w-32 h-32 mx-auto bg-blue-100 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-3xl font-bold text-blue-600">{calculateAverageScore()}%</span>
                </div>
                <div className="mt-4 flex justify-around">
                  <div className="text-center">
                    <p className="text-gray-600 text-sm">Total Quizzes</p>
                    <p className="text-2xl font-bold text-blue-600">{results.length}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-600 text-sm">Best Score</p>
                    <p className="text-2xl font-bold text-green-600">
                      {Math.max(...results.map(r => Math.round((r.score / r.total_questions) * 100)))}%
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Quiz History */}
      {results.length > 0 && (
        <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">Quiz History</h3>
          <div className="divide-y">
            {results.map((result) => (
              <div 
                key={result.id} 
                className={`py-4 flex justify-between items-center transition-all ${
                  result.id === firstAttempt 
                    ? 'bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500 transform -translate-x-2' 
                    : ''
                }`}
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium">
                      Score: {result.score} / {result.total_questions}
                    </p>
                    {result.id === firstAttempt && (
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        First Attempt
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {new Date(result.created_at).toLocaleDateString()} at {new Date(result.created_at).toLocaleTimeString()}
                  </p>
                </div>
                <div className={`text-xl font-bold px-4 py-2 rounded-full ${
                    (result.score / result.total_questions) * 100 >= 75 
                      ? 'bg-green-200 text-green-700' 
                      : (result.score / result.total_questions) * 100 >= 50 
                      ? 'bg-blue-200 text-blue-700' 
                      : 'bg-red-200 text-red-700'
                  }`}
                >
                  {Math.round((result.score / result.total_questions) * 100)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Results;