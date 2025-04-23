const express = require('express');
const { Configuration, OpenAIApi } = require('openai');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Supabase client with service role key
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase URL and service key are required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Configure CORS with specific origin
app.use(cors({
  origin: 'http://localhost:5173', // Vite's default development server
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Store OTPs temporarily (in production, use a proper database)
const otpStore = new Map();
const resetPasswordStore = new Map();

// Email configuration with updated settings
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'mantujak82@gmail.com',
    pass: 'lbep cwtb lghg gnrs'
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP via email
app.post('/api/send-otp', async (req, res) => {
  try {
    const { email, type = 'signup' } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }
    
    const otp = generateOTP();
    
    const store = type === 'reset' ? resetPasswordStore : otpStore;
    store.set(email, {
      otp,
      expiry: Date.now() + 5 * 60 * 1000
    });

    const subject = type === 'reset' 
      ? 'LearnSmart - Password Reset OTP'
      : 'LearnSmart - Email Verification OTP';

    const mailOptions = {
      from: {
        name: 'LearnSmart',
        address: 'mantujak82@gmail.com'
      },
      to: email,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">LearnSmart ${type === 'reset' ? 'Password Reset' : 'Email Verification'}</h2>
          <p>Your verification code is:</p>
          <h1 style="color: #1d4ed8; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
          <p>This code will expire in 5 minutes.</p>
          <p style="color: #64748b; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send OTP',
      details: error.message
    });
  }
});

// Verify OTP
app.post('/api/verify-otp', (req, res) => {
  const { email, otp, type = 'signup' } = req.body;
  
  if (!email || !otp) {
    return res.status(400).json({ success: false, error: 'Email and OTP are required' });
  }
  
  const store = type === 'reset' ? resetPasswordStore : otpStore;
  const storedData = store.get(email);
  
  if (!storedData) {
    return res.status(400).json({ success: false, error: 'No OTP found for this email' });
  }
  
  if (Date.now() > storedData.expiry) {
    store.delete(email);
    return res.status(400).json({ success: false, error: 'OTP has expired' });
  }
  
  if (storedData.otp !== otp) {
    return res.status(400).json({ success: false, error: 'Invalid OTP' });
  }
  
  store.delete(email);
  res.json({ success: true, message: 'Email verified successfully' });
});

// New endpoint to fetch all users
app.get('/api/admin/users', async (req, res) => {
  try {
    // First, get all users from auth.users
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      throw authError;
    }

    if (!authData || !authData.users) {
      return res.status(404).json({ error: 'No users found' });
    }

    const formattedUsers = authData.users.map(user => ({
      id: user.id,
      email: user.email,
      created_at: user.created_at
    }));

    res.json(formattedUsers);
  } catch (error) {
    console.error('Error in /api/admin/users:', error);
    res.status(500).json({ 
      error: 'Failed to fetch users',
      details: error.message 
    });
  }
});

// Delete user endpoint
app.delete('/api/admin/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { error } = await supabase.auth.admin.deleteUser(userId);
    
    if (error) {
      throw error;
    }

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ 
      error: 'Failed to delete user',
      details: error.message 
    });
  }
});

// Send notification email
app.post('/api/send-notification-email', async (req, res) => {
  try {
    const { email, type, title, details } = req.body;

    let emailTemplate;
    if (type === 'note') {
      emailTemplate = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">📚 New Study Material Available</h1>
          </div>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #1e40af; margin-top: 0;">${title}</h2>
            <p style="color: #475569; line-height: 1.6;">${details}</p>
            
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
              <p style="color: #64748b; margin: 0;">Access your learning materials anytime on LearnSmart platform.</p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px;">
            <p style="color: #94a3b8; font-size: 12px;">
              This is an automated message from LearnSmart Learning Platform.<br>
              Please do not reply to this email.
            </p>
          </div>
        </div>
      `;
    } else if (type === 'quiz') {
      emailTemplate = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">🎯 New Quiz Available</h1>
          </div>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #1e40af; margin-top: 0;">${title}</h2>
            <p style="color: #475569; line-height: 1.6;">${details}</p>
            
            <div style="margin-top: 20px; padding: 15px; background-color: #f0f9ff; border-radius: 6px;">
              <p style="color: #0369a1; margin: 0;">
                Test your knowledge and track your progress with our latest quiz!
              </p>
            </div>
            
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
              <p style="color: #64748b; margin: 0;">Login to LearnSmart platform to take the quiz.</p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px;">
            <p style="color: #94a3b8; font-size: 12px;">
              This is an automated message from LearnSmart Learning Platform.<br>
              Please do not reply to this email.
            </p>
          </div>
        </div>
      `;
    }

    const mailOptions = {
      from: {
        name: 'LearnSmart',
        address: 'mantujak82@gmail.com'
      },
      to: email,
      subject: type === 'note' ? 'New Study Material Available - LearnSmart' : 'New Quiz Available - LearnSmart',
      html: emailTemplate
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: 'Notification email sent successfully' });
  } catch (error) {
    console.error('Error sending notification email:', error);
    res.status(500).json({ success: false, error: 'Failed to send notification email' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
});