import { supabase } from './supabase';

export const createNotification = async (userId, title, content, type) => {
  try {
    if (!userId || !title || !content || !type) {
      console.error('Missing required parameters for notification creation');
      return;
    }
    
    const { error } = await supabase
      .from('notifications')
      .insert([{
        user_id: userId,
        title,
        content,
        type,
        read: false
      }]);

    if (error) {
      console.error('Error creating notification:', error);
      throw error;
    }

    // Send email notification
    try {
      await fetch('http://localhost:3001/api/send-notification-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userId, // The backend will fetch the email from the user ID
          type,
          title,
          details: content
        })
      });
    } catch (emailError) {
      console.error('Error sending email notification:', emailError);
      // Don't throw here - we still want to create the in-app notification
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false, error };
  }
};

export const sendNotificationsToAllUsers = async (currentUserId, title, content, type) => {
  try {
    // Get all users except the current user
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id');

    if (usersError) {
      console.error('Error fetching users for notifications:', usersError);
      return;
    }

    if (!users || users.length === 0) {
      // Try fetching from auth.users if profiles table is empty
      const { data: authUsers, error: authError } = await supabase
        .from('auth.users')
        .select('id, email');
        
      if (authError || !authUsers || authUsers.length === 0) {
        console.error('No users found for notifications');
        return;
      }
      
      // Send notifications to all users
      for (const otherUser of authUsers) {
        if (otherUser.id !== currentUserId) {
          await createNotification(otherUser.id, title, content, type);
          
          // Send email notification
          await fetch('http://localhost:3001/api/send-notification-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: otherUser.email,
              type,
              title,
              details: content
            })
          });
        }
      }
    } else {
      // Send notifications to all users from profiles table
      for (const otherUser of users) {
        if (otherUser.id !== currentUserId) {
          await createNotification(otherUser.id, title, content, type);
        }
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending notifications:', error);
    return { success: false, error };
  }
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { success: false, error };
  }
};

export const markAllNotificationsAsRead = async (userId) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return { success: false, error };
  }
};

export const getUnreadNotificationsCount = async (userId) => {
  try {
    const { data, error, count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
    return { success: true, count };
  } catch (error) {
    console.error('Error getting unread notifications count:', error);
    return { success: false, error, count: 0 };
  }
};