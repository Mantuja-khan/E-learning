import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Notes from './components/Notes';
import Quiz from './components/Quiz';
import Results from './components/Results';
import Chatbot from './components/Chatbot';
import HomePage from './components/HomePage';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import { supabase } from './lib/supabase';

function App() {
  const [currentView, setCurrentView] = useState('home');
  const [session, setSession] = useState(null);
  const [showLogin, setShowLogin] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!session) {
    return (
      <>
        <Toaster position="top-right" />
        {showLogin ? (
          <Login onToggle={() => setShowLogin(false)} />
        ) : (
          <Signup onToggle={() => setShowLogin(true)} />
        )}
      </>
    );
  }

  const renderContent = () => {
    switch (currentView) {
      case 'notes':
        return (
          <div className="h-[calc(100vh-8rem)]">
            <Notes onBack={() => setCurrentView('home')} />
          </div>
        );
      case 'quiz':
        return (
          <div className="h-[calc(100vh-8rem)]">
            <Quiz onBack={() => setCurrentView('home')} />
          </div>
        );
      case 'results':
        return (
          <div className="h-[calc(100vh-8rem)]">
            <Results />
          </div>
        );
      case 'chatbot':
        return (
          <div className="h-[calc(100vh-8rem)]">
            <Chatbot onBack={() => setCurrentView('home')} />
          </div>
        );
      default:
        return <HomePage onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster position="top-right" />
      <Navbar 
        onHomeClick={() => setCurrentView('home')} 
        onResultsClick={() => setCurrentView('results')}
        onLogout={async () => await supabase.auth.signOut()}
        user={session.user}
        onNavigate={setCurrentView}
      />
      <div className="container mx-auto p-4 mt-16">
        {renderContent()}
      </div>
    </div>
  );
}

export default App;