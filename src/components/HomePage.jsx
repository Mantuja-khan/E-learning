import React from 'react';
import { FaBook, FaQuestionCircle, FaRobot, FaGraduationCap, FaArrowRight } from 'react-icons/fa';

const FeatureCard = ({ icon, title, description, onClick }) => (
  <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-t-4 border-blue-500">
    <div className="flex justify-center mb-5">
      <div className="text-5xl text-blue-600 p-4 rounded-full bg-blue-50 shadow-md">
        {icon}
      </div>
    </div>
    <h3 className="text-lg md:text-xl lg:text-2xl font-bold mb-4 text-gray-800">{title}</h3>
    <p className="text-sm md:text-base text-gray-600 mb-5 min-h-[60px] md:min-h-[80px] leading-relaxed">{description}</p>
    <button
      onClick={onClick}
      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 text-sm md:text-base flex items-center justify-center gap-2"
    >
      Get Started <FaArrowRight className="text-sm" />
    </button>
  </div>
);

const HomePage = ({ onNavigate }) => {
  return (
    <div className="text-center py-10 md:py-16 bg-gradient-to-b from-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="mb-16">
          <div className="flex justify-center items-center mb-6 md:mb-8">
            <FaGraduationCap className="text-4xl md:text-5xl lg:text-6xl text-blue-600 mr-3 animate-bounce" />
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-transparent bg-clip-text">
              LearnSmart Platform
            </h1>
          </div>
          
          <p className="text-base md:text-xl text-gray-700 mb-10 max-w-3xl mx-auto leading-relaxed px-4">
            Embark on a journey of knowledge with our comprehensive e-learning platform. 
            Experience interactive learning, real-time assessments, and AI-powered assistance 
            to enhance your educational journey.
          </p>
          
          <div className="flex justify-center">
            <button 
              className="px-8 py-4 bg-blue-600 text-white font-bold rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 text-sm md:text-base"
              onClick={() => onNavigate('explore')}
            >
              Explore All Features
            </button>
          </div>
        </div>
        
        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
          <FeatureCard
            icon={<FaBook />}
            title="Smart Notes"
            description="Transform your note-taking experience with our intelligent system. Organize, search, and access your study materials with ease."
            onClick={() => onNavigate('notes')}
          />
          
          <FeatureCard
            icon={<FaQuestionCircle />}
            title="Interactive Quiz"
            description="Challenge yourself with our adaptive quizzes. Get instant feedback and track your progress across different subjects."
            onClick={() => onNavigate('quiz')}
          />
          
          <FeatureCard
            icon={<FaRobot />}
            title="AI Study Assistant"
            description="Get 24/7 support from our intelligent chatbot. Ask questions, clarify doubts, and receive personalized learning guidance."
            onClick={() => onNavigate('chatbot')}
          />
        </div>
        
        {/* CTA Section */}
        <div className="mt-16 md:mt-24 bg-blue-100 py-10 rounded-2xl mx-4 shadow-inner">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 mb-4">
              Start Your Learning Journey Today
            </h2>
            <p className="text-sm md:text-base text-gray-700 mb-8 leading-relaxed">
              Join thousands of students who have already enhanced their learning experience 
              with our comprehensive e-learning tools.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
              <button 
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-all text-sm md:text-base"
                onClick={() => onNavigate('signup')}
              >
                Sign Up Free
              </button>
              <button 
                className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg shadow-md hover:bg-gray-50 border border-blue-200 transition-all text-sm md:text-base"
                onClick={() => onNavigate('demo')}
              >
                Watch Demo
              </button>
            </div>
          </div>
        </div>
        
        {/* Testimonial Teaser */}
        <div className="mt-16 text-center">
          <h3 className="text-lg md:text-xl font-medium text-gray-700 mb-2">Trusted by students worldwide</h3>
          <p className="text-sm md:text-base text-gray-500">4.9/5 average rating from over 10,000 users</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;