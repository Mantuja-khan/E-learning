import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { FaBook, FaUpload, FaTrash, FaEdit, FaDownload, FaFilter, FaArrowLeft, FaSpinner, FaFilePdf } from 'react-icons/fa';

const Notes = ({ onBack }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [notes, setNotes] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSubAdmin, setIsSubAdmin] = useState(false);
  const [user, setUser] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(null);

  const courses = ['B.Tech', 'BCA', 'MCA', 'M.Tech'];
  const branches = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical'];
  const semesters = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (selectedCourse && selectedBranch && selectedSemester) {
      fetchNotes();
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

        if (roleError) {
          console.error('Error checking user role:', roleError);
          setIsAdmin(false);
          setIsSubAdmin(false);
          return;
        }

        if (roleData && roleData.length > 0) {
          setIsAdmin(roleData[0].role === 'admin');
          setIsSubAdmin(roleData[0].role === 'sub_admin');
        } else {
          setIsAdmin(false);
          setIsSubAdmin(false);
        }
      }
    } catch (error) {
      console.error('Error checking user:', error);
      setIsAdmin(false);
      setIsSubAdmin(false);
    }
  };

  const fetchNotes = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('course', selectedCourse)
        .eq('branch', selectedBranch)
        .eq('semester', selectedSemester)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      toast.error('Error fetching notes: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const uploadPDF = async (file) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('notes-pdfs')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      return filePath;
    } catch (error) {
      toast.error('Error uploading PDF: ' + error.message);
      return null;
    }
  };

  const sendNotificationsToAllUsers = async (noteTitle, course, branch, semester) => {
    try {
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id');

      if (usersError) {
        console.error('Error fetching users for notifications:', usersError);
        return;
      }

      if (!users || users.length === 0) {
        const { data: authUsers, error: authError } = await supabase
          .from('auth.users')
          .select('id, email');
          
        if (authError || !authUsers || authUsers.length === 0) {
          console.error('No users found for notifications');
          return;
        }
        
        for (const otherUser of authUsers) {
          if (otherUser.id !== user.id) {
            // Create in-app notification
            await supabase.from('notifications').insert([{
              user_id: otherUser.id,
              title: 'New Study Material Available',
              content: `A new note "${noteTitle}" has been added for ${course} - ${branch} (${semester} Semester)`,
              type: 'note'
            }]);

            // Send email notification
            await fetch('http://localhost:3001/api/send-notification-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: otherUser.email,
                type: 'note',
                title: 'New Study Material Available',
                details: `A new note titled "${noteTitle}" has been added to your course materials for ${course} - ${branch} (${semester} Semester). Log in to LearnSmart to access the new content.`
              })
            });
          }
        }
      } else {
        for (const otherUser of users) {
          if (otherUser.id !== user.id) {
            await supabase.from('notifications').insert([{
              user_id: otherUser.id,
              title: 'New Study Material Available',
              content: `A new note "${noteTitle}" has been added for ${course} - ${branch} (${semester} Semester)`,
              type: 'note'
            }]);
          }
        }
      }
    } catch (error) {
      console.error('Error sending notifications:', error);
    }
  };

  const handleSubmit = async (e) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    
    if (!isAdmin && !isSubAdmin) {
      toast.error('Only admin can add notes');
      return;
    }

    if (!selectedCourse || !selectedBranch || !selectedSemester) {
      toast.error('Please select course, branch, and semester');
      return;
    }

    try {
      setIsUploading(true);
      let pdfPath = null;
      if (pdfFile) {
        const uploadedFileName = await uploadPDF(pdfFile);
        if (!uploadedFileName) return;
        pdfPath = uploadedFileName;
      }

      const noteData = {
        title,
        content,
        user_id: user.id,
        pdf_path: pdfPath,
        course: selectedCourse,
        branch: selectedBranch,
        semester: selectedSemester
      };

      if (editingId) {
        const { error } = await supabase
          .from('notes')
          .update(noteData)
          .eq('id', editingId);

        if (error) throw error;
        toast.success('Note updated successfully');
        setEditingId(null);
      } else {
        const { error } = await supabase
          .from('notes')
          .insert([noteData]);

        if (error) throw error;
        toast.success('Note created successfully');

        await sendNotificationsToAllUsers(title, selectedCourse, selectedBranch, selectedSemester);
      }

      setTitle('');
      setContent('');
      setPdfFile(null);
      fetchNotes();
    } catch (error) {
      toast.error('Error saving note: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const downloadPDF = async (pdfPath, noteTitle) => {
    try {
      setDownloadingPdf(pdfPath);
      const { data, error } = await supabase.storage
        .from('notes-pdfs')
        .download(pdfPath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${noteTitle}.pdf`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      toast.error('Error downloading PDF: ' + error.message);
    } finally {
      setDownloadingPdf(null);
    }
  };

  const handleDelete = async (note) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        const { error } = await supabase
          .from('notes')
          .delete()
          .eq('id', note.id);

        if (error) throw error;
        
        if (note.pdf_path) {
          const { error: storageError } = await supabase.storage
            .from('notes-pdfs')
            .remove([note.pdf_path]);
            
          if (storageError) throw storageError;
        }
        
        toast.success('Note deleted successfully');
        fetchNotes();
      } catch (error) {
        toast.error('Error deleting note: ' + error.message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100 p-3 md:p-8 relative">
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-white backdrop-blur-lg bg-opacity-50"></div>
          <div className="relative z-10 flex flex-col items-center justify-center p-6 md:p-8 rounded-xl bg-white bg-opacity-90 shadow-2xl border border-blue-100 animate-pulse">
            <FaSpinner className="text-4xl md:text-5xl text-blue-600 animate-spin mb-4" />
            <p className="text-lg md:text-xl font-medium text-gray-800">Loading notes...</p>
            <p className="text-sm md:text-base text-gray-600 mt-2 text-center">
              Getting notes for {selectedCourse} - {selectedBranch} ({selectedSemester} Semester)
            </p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header - Redesigned to have all elements in one row */}
        <div className="flex items-center justify-between mb-6 md:mb-8 bg-white p-4 md:p-6 rounded-2xl shadow-lg border border-blue-50">
          <div className="flex items-center space-x-3">
            {onBack && (
              <button 
                onClick={onBack}
                className="p-2 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors transform hover:scale-105 duration-200"
                aria-label="Go back"
              >
                <FaArrowLeft className="text-blue-600 text-sm md:text-base" />
              </button>
            )}
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-2 md:p-3 rounded-full shadow-md">
              <FaBook className="text-lg md:text-2xl text-white" />
            </div>
            <h2 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Study Notes
            </h2>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-center p-2 md:px-4 md:py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all transform hover:scale-105 duration-200"
            aria-label="Toggle filters"
          >
            <FaFilter className="text-gray-600 text-sm md:text-base" />
            <span className="hidden md:inline ml-2 text-sm md:text-base">Filters</span>
          </button>
        </div>

        {/* Filters */}
        <div className={`transition-all duration-300 overflow-hidden ${showFilters ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="bg-white p-4 md:p-6 rounded-2xl shadow-lg mb-6 md:mb-8 border border-blue-50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <div className="space-y-2">
                <label className="block text-xs md:text-sm font-medium text-gray-700">Course</label>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full p-2 md:p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm md:text-base"
                >
                  <option value="">Select Course</option>
                  {courses.map(course => (
                    <option key={course} value={course}>{course}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-xs md:text-sm font-medium text-gray-700">Branch</label>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full p-2 md:p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm md:text-base"
                >
                  <option value="">Select Branch</option>
                  {branches.map(branch => (
                    <option key={branch} value={branch}>{branch}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-xs md:text-sm font-medium text-gray-700">Semester</label>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="w-full p-2 md:p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm md:text-base"
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

        {/* Add Note Form (Admin/SubAdmin only) */}
        {(isAdmin || isSubAdmin) && (
          <div className="bg-white p-4 md:p-6 rounded-2xl shadow-lg mb-6 md:mb-8 transform transition-all hover:shadow-xl border border-blue-50">
            <h3 className="text-lg md:text-xl font-semibold mb-4 text-gray-800">
              {editingId ? 'Edit Note' : 'Add New Note'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2 md:p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm md:text-base"
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">Content</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full p-2 md:p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all h-24 md:h-32 text-sm md:text-base"
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">PDF Attachment (Optional)</label>
                <div className="flex items-center justify-center w-full">
                  <label className="w-full flex flex-col items-center px-4 py-4 md:py-6 bg-gray-50 rounded-lg border-2 border-gray-200 border-dashed cursor-pointer hover:bg-gray-100 transition-all">
                    <FaUpload className="text-gray-400 text-xl md:text-2xl mb-2" />
                    <span className="text-xs md:text-sm text-gray-500">
                      {pdfFile ? pdfFile.name : "Click to upload PDF"}
                    </span>
                    <input
                      type="file"
                      onChange={(e) => setPdfFile(e.target.files[0])}
                      accept=".pdf"
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={isUploading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 md:p-4 rounded-lg hover:opacity-90 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 transform hover:scale-[1.02] duration-200 shadow-md"
              >
                {isUploading ? (
                  <>
                    <FaSpinner className="animate-spin text-sm md:text-base" />
                    <span className="text-sm md:text-base">Uploading...</span>
                  </>
                ) : (
                  <>
                    <FaUpload className="text-sm md:text-base" />
                    <span className="text-sm md:text-base">{editingId ? 'Update Note' : 'Add Note'}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Notes Grid */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {notes.map((note) => (
              <div
                key={note.id}
                className="bg-white p-4 md:p-6 rounded-2xl shadow-lg transform transition-all hover:shadow-xl hover:-translate-y-1 duration-300 border border-blue-50"
              >
                <h3 className="text-base md:text-xl font-semibold mb-2 md:mb-4 text-gray-800">{note.title}</h3>
                <p className="text-xs md:text-sm text-gray-600 mb-4 md:mb-6 line-clamp-3">{note.content}</p>
                
                <div className="flex flex-col space-y-3">
                  {note.pdf_path && (
                    <button
                      onClick={() => downloadPDF(note.pdf_path, note.title)}
                      disabled={downloadingPdf === note.pdf_path}
                      className="flex items-center justify-center space-x-0 md:space-x-2 w-full py-2 px-3 md:px-4 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50 transform hover:scale-[1.02] duration-200"
                    >
                      {downloadingPdf === note.pdf_path ? (
                        <>
                          <FaSpinner className="animate-spin text-sm md:text-base" />
                          <span className="hidden md:inline text-xs md:text-sm">Downloading...</span>
                        </>
                      ) : (
                        <>
                          <FaFilePdf className="text-red-500 text-sm md:text-base" />
                          <span className="hidden md:inline text-xs md:text-sm">Download PDF</span>
                        </>
                      )}
                    </button>
                  )}
                  
                  {(isAdmin || isSubAdmin) && (
                    <div className="flex justify-end space-x-3 pt-3 border-t">
                      <button
                        onClick={() => {
                          setEditingId(note.id);
                          setTitle(note.title);
                          setContent(note.content);
                          window.scrollTo({
                            top: 0,
                            behavior: 'smooth'
                          });
                        }}
                        className="p-2 text-blue-600 hover:text-blue-800 transition-colors transform hover:scale-110 duration-200"
                        title="Edit note"
                      >
                        <FaEdit className="w-4 h-4 md:w-5 md:h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(note)}
                        className="p-2 text-red-600 hover:text-red-800 transition-colors transform hover:scale-110 duration-200"
                        title="Delete note"
                      >
                        <FaTrash className="w-4 h-4 md:w-5 md:h-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Empty State */}
            {notes.length === 0 && selectedCourse && selectedBranch && selectedSemester && !isLoading && (
              <div className="col-span-full flex flex-col items-center justify-center p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-blue-50">
                <div className="bg-blue-50 p-4 rounded-full mb-4">
                  <FaBook className="text-3xl md:text-4xl text-blue-400" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-700 mb-2">No Notes Found</h3>
                <p className="text-xs md:text-sm text-gray-500 text-center">
                  No notes available for {selectedCourse} - {selectedBranch} ({selectedSemester} Semester)
                </p>
                {(isAdmin || isSubAdmin) && (
                  <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="mt-4 px-4 md:px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition-colors transform hover:scale-105 duration-200 text-xs md:text-sm shadow-md"
                  >
                    Add First Note
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notes;