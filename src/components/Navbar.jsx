import React, { useState, useEffect } from 'react';
import { FaUser, FaBell, FaGraduationCap, FaCrown, FaBars, FaTimes, FaHome, FaBook, FaQuestionCircle, FaRobot, FaSignOutAlt, FaTrophy, FaUserShield, FaCheck } from 'react-icons/fa';
import { supabase } from '../lib/supabase';
import AdminPanel from './AdminPanel';
import { toast } from 'react-hot-toast';

const Navbar = ({ onHomeClick, onResultsClick, onLogout, user, onNavigate }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  useEffect(() => {
    if (user) {
      checkUserRole();
      fetchNotifications();
      subscribeToNotifications();
    }
  }, [user]);

  const checkUserRole = async () => {
    if (!user) return;
    
    try {
      // Only set isAdmin to true if the user's email is mantujak82@gmail.com
      setIsAdmin(user.email === 'mantujak82@gmail.com');
    } catch (error) {
      console.error('Error checking user role:', error);
      setIsAdmin(false);
    }
  };

  const fetchNotifications = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('read', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const subscribeToNotifications = () => {
    if (!user) return;
    
    const subscription = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, payload => {
        setNotifications(current => [payload.new, ...current]);
        toast.success('New notification received!');
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const markAsRead = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
      
      setNotifications(current => 
        current.filter(n => n.id !== notificationId)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;
      
      setNotifications([]);
      setShowNotifications(false);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Sidebar content component to avoid duplication
  const SidebarContent = ({ isMobile = false }) => (
    <div className="p-3">
      {isMobile && (
        <button 
          onClick={toggleSidebar}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          <FaTimes size={16} />
        </button>
      )}

      {/* User Profile Section */}
      <div className="flex flex-col items-center pt-8 pb-4 border-b">
        <div className="bg-blue-100 p-2 rounded-full mb-2">
          <FaUser size={16} className="text-blue-600" />
        </div>
        <h3 className="text-xs font-semibold text-gray-800 text-center break-all px-2">
          {user?.email}
        </h3>
        {isAdmin && (
          <div className="flex items-center space-x-1 mt-2 bg-yellow-100 px-2 py-0.5 rounded-full">
            <FaCrown className="text-yellow-600 text-xs" />
            <span className="text-xs font-medium text-yellow-800">Admin</span>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <div className="py-2 space-y-1">
        <button
          onClick={() => {
            onHomeClick();
            toggleSidebar();
          }}
          className="w-full flex items-center space-x-2 px-3 py-2 text-xs text-gray-700 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <FaHome size={12} className="text-blue-600" />
          <span>Home</span>
        </button>
        <button
          onClick={() => {
            toggleSidebar();
            onNavigate && onNavigate('notes');
          }}
          className="w-full flex items-center space-x-2 px-3 py-2 text-xs text-gray-700 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <FaBook size={12} className="text-blue-600" />
          <span>Notes</span>
        </button>
        <button
          onClick={() => {
            toggleSidebar();
            onNavigate && onNavigate('quiz');
          }}
          className="w-full flex items-center space-x-2 px-3 py-2 text-xs text-gray-700 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <FaQuestionCircle size={12} className="text-blue-600" />
          <span>Quiz</span>
        </button>
        <button
          onClick={() => {
            toggleSidebar();
            onNavigate && onNavigate('chatbot');
          }}
          className="w-full flex items-center space-x-2 px-3 py-2 text-xs text-gray-700 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <FaRobot size={12} className="text-blue-600" />
          <span>AI Assistant</span>
        </button>
        <button
          onClick={() => {
            onResultsClick();
            toggleSidebar();
          }}
          className="w-full flex items-center space-x-2 px-3 py-2 text-xs text-gray-700 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <FaTrophy size={12} className="text-blue-600" />
          <span>Results</span>
        </button>
        {isAdmin && (
          <button
            onClick={() => {
              setShowAdminPanel(true);
              toggleSidebar();
            }}
            className="w-full flex items-center space-x-2 px-3 py-2 text-xs text-gray-700 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <FaUserShield size={12} className="text-blue-600" />
            <span>Admin Panel</span>
          </button>
        )}
      </div>

      {/* Logout Button */}
      <div className={`${isMobile ? 'absolute bottom-3 left-3 right-3' : 'mt-4'}`}>
        <button
          onClick={() => {
            onLogout();
            toggleSidebar();
          }}
          className="w-full bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2 text-xs"
        >
          <FaSignOutAlt size={12} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <nav className="bg-gradient-to-r from-blue-600 to-blue-800 p-2 sm:p-3 text-white shadow-lg fixed w-full top-0 z-40">
        <div className="container mx-auto flex justify-between items-center">
          {/* Left side - Logo */}
          <button 
            onClick={onHomeClick}
            className="flex items-center space-x-2"
          >
            <div className="bg-white p-1.5 rounded-full">
              <FaGraduationCap size={16} className="text-blue-600" />
            </div>
            <span className="text-sm sm:text-base font-bold hidden sm:inline">LearnSmart</span>
            <span className="text-sm sm:text-base font-bold sm:hidden">LS</span>
          </button>

          {/* Mobile Icons */}
          <div className="flex items-center space-x-2 md:hidden">
            <button 
              onClick={onResultsClick}
              className="p-1.5 hover:bg-blue-700 rounded-full transition-colors"
            >
              <FaTrophy size={14} />
            </button>
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-1.5 hover:bg-blue-700 rounded-full transition-colors relative"
              >
                <FaBell size={14} />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-xs w-4 h-4 rounded-full flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>
            </div>
            <button 
              onClick={toggleSidebar}
              className="p-1.5 hover:bg-blue-700 rounded-lg transition-colors ml-2"
            >
              <FaBars size={16} />
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {isAdmin && (
              <div className="flex items-center space-x-1 bg-yellow-500 px-2 py-0.5 rounded-full">
                <FaCrown className="text-white text-xs" />
                <span className="text-xs font-medium">Admin</span>
              </div>
            )}
            <button 
              onClick={onResultsClick}
              className="p-1.5 hover:bg-blue-700 rounded-full transition-colors"
            >
              <FaTrophy size={16} />
            </button>
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-1.5 hover:bg-blue-700 rounded-full transition-colors relative"
              >
                <FaBell size={16} />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-xs w-4 h-4 rounded-full flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>
            </div>
            <button
              onClick={toggleSidebar}
              className="p-1.5 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <FaBars size={16} />
            </button>
          </div>
        </div>
      </nav>

      {/* Notification Sidebar */}
      <div 
        className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
          showNotifications ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-4">
          {/* Close Button */}
          <button 
            onClick={() => setShowNotifications(false)}
            className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
          >
            <FaTimes size={16} />
          </button>

          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
            {notifications.length > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-[calc(100vh-8rem)] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                No new notifications
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className="p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {notification.content}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                    >
                      <FaCheck size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Sidebar Overlay (for both mobile and desktop) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`md:hidden fixed top-0 right-0 h-full w-48 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
        isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <SidebarContent isMobile={true} />
      </div>

      {/* Desktop Sidebar */}
      <div className={`hidden md:block fixed top-0 right-0 h-full w-64 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
        isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <SidebarContent isMobile={false} />
      </div>

      {/* Click Outside Handler for Notifications */}
      {showNotifications && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setShowNotifications(false)}
        />
      )}

      {/* Admin Panel */}
      {isAdmin && (
        <AdminPanel 
          isOpen={showAdminPanel} 
          onClose={() => setShowAdminPanel(false)} 
          onNavigate={onNavigate}
        />
      )}
    </>
  );
};

export default Navbar;