import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { FaUserShield, FaTrash, FaGraduationCap, FaBook, FaQuestionCircle, FaPlus, FaSearch, FaUser } from 'react-icons/fa';

const AdminPanel = ({ isOpen, onClose, onNavigate }) => {
  const [subAdmins, setSubAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isMainAdmin, setIsMainAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('subadmins');
  const [searchQuery, setSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [showUserList, setShowUserList] = useState(false);

  useEffect(() => {
    if (isOpen) {
      checkMainAdmin();
      fetchSubAdmins();
      fetchAllUsers();
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = allUsers.filter(user => 
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(allUsers);
    }
  }, [searchQuery, allUsers]);

  const checkMainAdmin = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      
      if (!user) {
        setIsMainAdmin(false);
        return;
      }
      
      setIsMainAdmin(user.email === 'mantujak82@gmail.com');
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsMainAdmin(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/admin/users', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const users = await response.json();

      // Filter out current admin and existing sub-admins
      const filteredUsers = users.filter(user => 
        user.email !== 'mantujak82@gmail.com' && 
        !subAdmins.some(admin => admin.user?.id === user.id)
      );

      setAllUsers(filteredUsers);
      setFilteredUsers(filteredUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error(`Error fetching users: ${error.message}`);
    }
  };

  const fetchSubAdmins = async () => {
    try {
      const { data: adminRoles, error: rolesError } = await supabase
        .from('admin_roles')
        .select('*')
        .eq('role', 'sub_admin');

      if (rolesError) throw rolesError;

      if (!adminRoles || adminRoles.length === 0) {
        setSubAdmins([]);
        return;
      }

      const subAdminDetails = [];
      for (const role of adminRoles) {
        const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(role.user_id);
        
        if (userError) {
          console.error('Error fetching user details:', userError);
          continue;
        }
        
        if (user) {
          subAdminDetails.push({ 
            ...role, 
            user: { 
              id: role.user_id,
              email: user.email || 'Unknown email'
            } 
          });
        }
      }

      setSubAdmins(subAdminDetails.filter(admin => admin !== null));
    } catch (error) {
      console.error('Error fetching sub-admins:', error);
      toast.error('Error fetching sub-admins');
      setSubAdmins([]);
    }
  };

  const addSubAdmin = async (selectedUser) => {
    if (!isMainAdmin) {
      toast.error('Only the main admin can add sub-admins');
      return;
    }
    
    try {
      setLoading(true);
      
      const { data: existingRole, error: roleCheckError } = await supabase
        .from('admin_roles')
        .select('*')
        .eq('user_id', selectedUser.id)
        .eq('role', 'sub_admin')
        .maybeSingle();
        
      if (roleCheckError) {
        console.error('Error checking existing role:', roleCheckError);
        toast.error('Error checking if user is already a sub-admin');
        return;
      }
      
      if (existingRole) {
        toast.error('This user is already a sub-admin');
        return;
      }
      
      const { error } = await supabase
        .from('admin_roles')
        .insert([{ 
          user_id: selectedUser.id, 
          role: 'sub_admin', 
          created_by: currentUser.id 
        }]);
        
      if (error) throw error;
      
      toast.success('Sub-admin added successfully');
      fetchSubAdmins();
      fetchAllUsers();
      setShowUserList(false);
    } catch (error) {
      console.error('Error adding sub-admin:', error);
      toast.error('Error adding sub-admin: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const removeSubAdmin = async (userId) => {
    if (!isMainAdmin) {
      toast.error('Only the main admin can remove sub-admins');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('admin_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'sub_admin');
        
      if (error) throw error;
      
      toast.success('Sub-admin removed successfully');
      fetchSubAdmins();
      fetchAllUsers();
    } catch (error) {
      console.error('Error removing sub-admin:', error);
      toast.error('Error removing sub-admin: ' + error.message);
    }
  };

  const handleNavigateToNotes = () => {
    onNavigate && onNavigate('notes');
    onClose();
  };

  const handleNavigateToQuiz = () => {
    onNavigate && onNavigate('quiz');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto h-full">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full mx-auto p-6 sm:p-8 relative">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <FaGraduationCap className="text-4xl text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-800">Admin Panel</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500 text-xl">×</button>
        </div>

        <div className="flex border-b mb-6">
          <button
            className={`px-4 py-2 font-medium text-sm ${activeTab === 'subadmins' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('subadmins')}
          >
            Sub-Admins
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm ${activeTab === 'content' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('content')}
          >
            Manage Content
          </button>
        </div>

        {activeTab === 'subadmins' && (
          <>
            {isMainAdmin ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-800">Current Sub-Admins</h3>
                  <button
                    onClick={() => setShowUserList(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <FaPlus size={14} />
                    <span>Add Sub-Admin</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {subAdmins.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No sub-admins yet</p>
                  ) : (
                    subAdmins.map((admin) => (
                      <div key={admin.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="bg-blue-100 p-2 rounded-full">
                            <FaUser className="text-blue-600" />
                          </div>
                          <span className="text-gray-700">{admin.user?.email || 'Unknown user'}</span>
                        </div>
                        <button 
                          onClick={() => removeSubAdmin(admin.user_id)}
                          className="text-red-600 hover:text-red-800 p-2"
                        >
                          <FaTrash size={16} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {showUserList && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full m-4 p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-gray-800">Add Sub-Admin</h3>
                        <button 
                          onClick={() => setShowUserList(false)}
                          className="text-gray-400 hover:text-gray-500"
                        >
                          ×
                        </button>
                      </div>

                      <div className="relative mb-4">
                        <FaSearch className="absolute left-3 top-3 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search users by email..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="max-h-96 overflow-y-auto">
                        {filteredUsers.length === 0 ? (
                          <p className="text-center text-gray-500 py-4">No users found</p>
                        ) : (
                          <div className="space-y-2">
                            {filteredUsers.map((user) => (
                              <div key={user.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                                <div className="flex items-center space-x-3">
                                  <div className="bg-gray-100 p-2 rounded-full">
                                    <FaUser className="text-gray-600" />
                                  </div>
                                  <span className="text-gray-700">{user.email}</span>
                                </div>
                                <button
                                  onClick={() => addSubAdmin(user)}
                                  className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors text-sm"
                                >
                                  Add as Sub-Admin
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-center text-gray-600 py-4">Only the main admin can manage sub-admins.</p>
            )}
          </>
        )}

        {activeTab === 'content' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Manage Content</h3>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center space-x-3 mb-2">
                <FaBook className="text-blue-600" />
                <h4 className="font-medium">Study Notes</h4>
              </div>
              <p className="text-sm text-gray-600 mb-3">Add or edit study materials for students.</p>
              <button
                onClick={handleNavigateToNotes}
                className="w-full bg-blue-600 text-white p-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-blue-700 transition-colors"
              >
                <FaPlus size={14} />
                <span>Manage Notes</span>
              </button>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center space-x-3 mb-2">
                <FaQuestionCircle className="text-purple-600" />
                <h4 className="font-medium">Quiz Questions</h4>
              </div>
              <p className="text-sm text-gray-600 mb-3">Create or modify quiz questions for assessments.</p>
              <button
                onClick={handleNavigateToQuiz}
                className="w-full bg-purple-600 text-white p-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-purple-700 transition-colors"
              >
                <FaPlus size={14} />
                <span>Manage Questions</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;