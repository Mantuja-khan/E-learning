import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { FaQuestionCircle, FaPlus, FaEdit, FaTrash, FaArrowLeft, FaSpinner, FaCheck, FaTimes } from 'react-icons/fa';

const Quiz = ({ onBack }) => {
  const [questions, setQuestions] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSubAdmin, setIsSubAdmin] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [questionsReady, setQuestionsReady] = useState(false);

  // Form state for adding/editing questions
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctOption, setCorrectOption] = useState(0);

  const courses = ['B.Tech', 'BCA', 'MCA', 'M.Tech'];
  const branches = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical'];
  const semesters = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (selectedCourse && selectedBranch && selectedSemester) {
      fetchQuestions();
    }
  }, [selectedCourse, selectedBranch, selectedSemester]);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: roleData, error: roleError } = await supabase
          .from('admin_roles')
          .select('*')
          .eq('user_id', user.id);

        if (roleError) throw roleError;

        if (roleData && roleData.length > 0) {
          setIsAdmin(roleData[0].role === 'admin');
          setIsSubAdmin(roleData[0].role === 'sub_admin');
        }
      }
    } catch (error) {
      console.error('Error checking user:', error);
    }
  };

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('course', selectedCourse)
        .eq('branch', selectedBranch)
        .eq('semester', selectedSemester);

      if (error) throw error;
      setQuestions(data || []);
      setQuestionsReady(data && data.length > 0);
    } catch (error) {
      toast.error('Error fetching questions: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin && !isSubAdmin) {
      toast.error('Only admin can manage questions');
      return;
    }

    if (!selectedCourse || !selectedBranch || !selectedSemester) {
      toast.error('Please select course, branch, and semester');
      return;
    }

    try {
      setLoading(true);
      const questionData = {
        question: questionText,
        options,
        correct_option: correctOption,
        user_id: user.id,
        course: selectedCourse,
        branch: selectedBranch,
        semester: selectedSemester
      };

      if (editingId) {
        const { error } = await supabase
          .from('quiz_questions')
          .update(questionData)
          .eq('id', editingId);

        if (error) throw error;
        toast.success('Question updated successfully');
        setEditingId(null);
      } else {
        const { error } = await supabase
          .from('quiz_questions')
          .insert([questionData]);

        if (error) throw error;
        toast.success('Question added successfully');

        // Get all users except current user
        const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
        
        if (usersError) {
          console.error('Error fetching users:', usersError);
        } else if (users) {
          // Send notifications to other users
          for (const otherUser of users) {
            if (otherUser.id !== user.id) {
              try {
                // Send email notification
                await fetch('http://localhost:3001/api/send-notification-email', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    email: otherUser.email,
                    type: 'quiz',
                    title: 'New Quiz Question Available',
                    details: `A new quiz question has been added for ${selectedCourse} - ${selectedBranch} (${selectedSemester} Semester)`
                  })
                });

                // Create in-app notification
                await supabase.from('notifications').insert([{
                  user_id: otherUser.id,
                  title: 'New Quiz Question Available',
                  content: `A new quiz question has been added for ${selectedCourse} - ${selectedBranch} (${selectedSemester} Semester)`,
                  type: 'quiz'
                }]);
              } catch (notificationError) {
                console.error('Error sending notification:', notificationError);
              }
            }
          }
        }
      }

      setQuestionText('');
      setOptions(['', '', '', '']);
      setCorrectOption(0);
      fetchQuestions();
    } catch (error) {
      toast.error('Error saving question: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (questionId) => {
    if (!isAdmin && !isSubAdmin) {
      toast.error('Only admin can delete questions');
      return;
    }

    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        const { error } = await supabase
          .from('quiz_questions')
          .delete()
          .eq('id', questionId);

        if (error) throw error;
        toast.success('Question deleted successfully');
        fetchQuestions();
      } catch (error) {
        toast.error('Error deleting question: ' + error.message);
      }
    }
  };

  const handleEdit = (question) => {
    setEditingId(question.id);
    setQuestionText(question.question);
    setOptions(question.options);
    setCorrectOption(question.correct_option);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startQuiz = () => {
    if (questions.length === 0) {
      toast.error('No questions available for this selection');
      return;
    }
    setShowQuiz(true);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setQuizCompleted(false);
    setShowResults(false);
    setScore(0);
  };

  const handleAnswerSelect = (questionId, answerIndex) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  const submitQuiz = async () => {
    const totalQuestions = questions.length;
    let correctAnswers = 0;

    questions.forEach(question => {
      if (selectedAnswers[question.id] === question.correct_option) {
        correctAnswers++;
      }
    });

    const finalScore = correctAnswers;
    setScore(finalScore);
    setQuizCompleted(true);
    setShowResults(true);

    try {
      const { error } = await supabase
        .from('quiz_results')
        .insert([{
          user_id: user.id,
          course: selectedCourse,
          branch: selectedBranch,
          semester: selectedSemester,
          score: finalScore,
          total_questions: totalQuestions
        }]);

      if (error) throw error;
      toast.success('Quiz completed! Check your results.');
    } catch (error) {
      toast.error('Error saving quiz results: ' + error.message);
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  if (showResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4 md:p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-blue-100 rounded-full mb-4">
              <FaCheck className="text-4xl text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Quiz Completed!</h2>
            <p className="text-xl text-gray-600">
              Your score: {score} out of {questions.length}
            </p>
            <div className="mt-4 text-2xl font-bold">
              {Math.round((score / questions.length) * 100)}%
            </div>
          </div>

          <div className="space-y-6">
            {questions.map((question, index) => (
              <div key={question.id} className="bg-gray-50 p-6 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-800 mb-4">
                      Question {index + 1}: {question.question}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {question.options.map((option, optionIndex) => (
                        <div
                          key={optionIndex}
                          className={`p-4 rounded-lg ${
                            optionIndex === question.correct_option
                              ? 'bg-green-100 border-2 border-green-500'
                              : selectedAnswers[question.id] === optionIndex
                              ? 'bg-red-100 border-2 border-red-500'
                              : 'bg-white border-2 border-gray-200'
                          }`}
                        >
                          <div className="flex items-center">
                            {optionIndex === question.correct_option ? (
                              <FaCheck className="text-green-500 mr-2" />
                            ) : selectedAnswers[question.id] === optionIndex ? (
                              <FaTimes className="text-red-500 mr-2" />
                            ) : null}
                            <span>{option}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <button
              onClick={() => {
                setShowResults(false);
                setShowQuiz(false);
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              View All Questions
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showQuiz) {
    const currentQuestion = questions[currentQuestionIndex];
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4 md:p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-4 md:p-8">
          <div className="flex justify-between items-center mb-6 md:mb-8">
            <h2 className="text-lg md:text-2xl font-bold text-gray-800">
              Question {currentQuestionIndex + 1} of {questions.length}
            </h2>
            <div className="text-xs md:text-sm text-gray-600">
              {Object.keys(selectedAnswers).length} of {questions.length} answered
            </div>
          </div>

          <div className="mb-6 md:mb-8">
            <h3 className="text-base md:text-xl font-medium text-gray-800 mb-4 md:mb-6">{currentQuestion.question}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(currentQuestion.id, index)}
                  className={`p-3 md:p-4 text-left text-sm md:text-base rounded-lg transition-all ${
                    selectedAnswers[currentQuestion.id] === index
                      ? 'bg-blue-100 border-2 border-blue-500'
                      : 'bg-gray-50 border-2 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={previousQuestion}
              disabled={currentQuestionIndex === 0}
              className="px-3 md:px-6 py-2 md:py-3 text-xs md:text-base bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              Previous
            </button>
            {currentQuestionIndex === questions.length - 1 ? (
              <button
                onClick={submitQuiz}
                disabled={Object.keys(selectedAnswers).length !== questions.length}
                className="px-3 md:px-6 py-2 md:py-3 text-xs md:text-base bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                Submit Quiz
              </button>
            ) : (
              <button
                onClick={nextQuestion}
                className="px-3 md:px-6 py-2 md:py-3 text-xs md:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6 md:mb-8 bg-white p-4 md:p-6 rounded-2xl shadow-lg">
          <div className="flex items-center space-x-2 md:space-x-4">
            {onBack && (
              <button 
                onClick={onBack}
                className="p-2 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors"
              >
                <FaArrowLeft className="text-blue-600 text-sm md:text-base" />
              </button>
            )}
            <div className="bg-blue-100 p-2 md:p-3 rounded-full">
              <FaQuestionCircle className="text-xl md:text-3xl text-blue-600" />
            </div>
            <h2 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Quiz Section
            </h2>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-1 md:space-x-2 px-3 md:px-4 py-1 md:py-2 text-xs md:text-base bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
          >
            <FaPlus className="text-gray-600" />
            <span>Select Quiz</span>
          </button>
        </div>

        <div className={`transition-all duration-300 overflow-hidden ${showFilters ? 'max-h-96' : 'max-h-0'}`}>
          <div className="bg-white p-4 md:p-6 rounded-2xl shadow-lg mb-6 md:mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <div className="space-y-1 md:space-y-2">
                <label className="block text-xs md:text-sm font-medium text-gray-700">Course</label>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full p-2 md:p-3 text-sm md:text-base border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">Select Course</option>
                  {courses.map(course => (
                    <option key={course} value={course}>{course}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1 md:space-y-2">
                <label className="block text-xs md:text-sm font-medium text-gray-700">Branch</label>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full p-2 md:p-3 text-sm md:text-base border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">Select Branch</option>
                  {branches.map(branch => (
                    <option key={branch} value={branch}>{branch}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1 md:space-y-2">
                <label className="block text-xs md:text-sm font-medium text-gray-700">Semester</label>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="w-full p-2 md:p-3 text-sm md:text-base border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">Select Semester</option>
                  {semesters.map(semester => (
                    <option key={semester} value={semester}>{semester}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {(isAdmin || isSubAdmin) && (
          <div className="bg-white p-4 md:p-6 rounded-2xl shadow-lg mb-6 md:mb-8">
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">Question</label>
                <input
                  type="text"
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  className="w-full p-2 md:p-3 text-sm md:text-base border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div className="space-y-3 md:space-y-4">
                <label className="block text-xs md:text-sm font-medium text-gray-700">Options</label>
                {options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2 md:space-x-4">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      className="flex-1 p-2 md:p-3 text-sm md:text-base border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder={`Option ${index + 1}`}
                      required
                    />
                    <input
                      type="radio"
                      name="correctOption"
                      checked={correctOption === index}
                      onChange={() => setCorrectOption(index)}
                      className="w-4 h-4 md:w-5 md:h-5 text-blue-600"
                    />
                    <label className="text-xs md:text-sm text-gray-600">Correct</label>
                  </div>
                ))}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 md:p-4 text-sm md:text-base rounded-lg hover:opacity-90 transition-all flex items-center justify-center space-x-1 md:space-x-2"
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <FaPlus />
                    <span>{editingId ? 'Update Question' : 'Add Question'}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {selectedCourse && selectedBranch && selectedSemester && !loading && (
          <div className="bg-white p-4 md:p-6 rounded-2xl shadow-lg mb-6 md:mb-8">
            <div className="flex justify-between items-center mb-4 md:mb-6">
              <h3 className="text-lg md:text-xl font-semibold text-gray-800">Quiz Information</h3>
              {!isAdmin && !isSubAdmin && questionsReady && (
                <button
                  onClick={startQuiz}
                  className="px-4 md:px-6 py-2 md:py-3 text-xs md:text-base bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Start Quiz
                </button>
              )}
            </div>

            {questions.length === 0 ? (
              <div className="text-center py-6 md:py-8">
                <FaQuestionCircle className="text-2xl md:text-4xl text-gray-400 mx-auto mb-3 md:mb-4" />
                <p className="text-sm md:text-base text-gray-500">No questions available for this selection.</p>
                {(isAdmin || isSubAdmin) && (
                  <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="mt-3 md:mt-4 px-4 md:px-6 py-2 md:py-2 text-xs md:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add First Question
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4 md:p-6">
                <div className="text-center">
                  <h4 className="text-base md:text-lg font-medium text-gray-800 mb-2 md:mb-3">
                    {selectedCourse} - {selectedBranch} ({selectedSemester} Semester)
                  </h4>
                  <p className="text-sm md:text-base text-gray-600 mb-3 md:mb-4">
                    Total questions: {questions.length}
                  </p>
                  {!isAdmin && !isSubAdmin && (
                    <div className="flex justify-center">
                      <button
                        onClick={startQuiz}
                        className="px-6 py-3 bg-green-600 text-white text-sm md:text-base rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Start Quiz
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Only show question list to admins */}
            {(isAdmin || isSubAdmin) && questions.length > 0 && (
              <div className="mt-6 space-y-3 md:space-y-4">
                <h4 className="text-base md:text-lg font-medium text-gray-800">
                  Question List (Admin View)
                </h4>
                {questions.map((question, index) => (
                  <div key={question.id} className="bg-gray-50 p-3 md:p-6 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm md:text-lg font-medium text-gray-800 mb-2 md:mb-4">
                          Question {index + 1}: {question.question}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
                          {question.options.map((option, optionIndex) => (
                            <div
                              key={optionIndex}
                              className={`p-2 md:p-4 text-xs md:text-base rounded-lg ${
                                optionIndex === question.correct_option
                                  ? 'bg-green-100'
                                  : 'bg-white'
                              }`}
                            >
                              {option}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-2 md:ml-4">
                        <button
                          onClick={() => handleEdit(question)}
                          className="p-1 md:p-2 text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <FaEdit className="text-xs md:text-base" />
                        </button>
                        <button
                          onClick={() => handleDelete(question.id)}
                          className="p-1 md:p-2 text-red-600 hover:text-red-800 transition-colors"
                        >
                          <FaTrash className="text-xs md:text-base" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Quiz;