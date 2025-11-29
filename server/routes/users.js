const router = require("express").Router();
const { User, validate } = require('../model/user');
const bcrypt = require('bcrypt');
//const nodemailer = require('nodemailer');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const axios = require('axios');

// Store OTP and verification status temporarily (can be replaced with Redis or DB)
let otpStorage = {};
let verifiedEmails = new Set();  // Track verified users

// Middleware to authenticate user based on token
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).send({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWTPRIVATEKEY);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(400).send({ message: 'Invalid or expired token.' });
  }
};

// Helper function to send OTP via email
const sendOTPEmail = async (email, otp) => {
 const BREVO_API_KEY = process.env.API_KEY; 
 const senderEmail = `ganeshmaini078@gmail.com`;
 const senderName = 'Ganesh';
 const brevoUrl = 'https://api.brevo.com/v3/smtp/email';

 const mailData = {
  sender: {
   name: senderName,
   email: senderEmail,
  },
  to: [{ email: email }],
  subject: 'Your OTP for Signup',
  htmlContent: `<html><body>
          <h2>One-Time Password (OTP)</h2>
          <p>Your OTP for registration is: <strong>${otp}</strong></p>
          <p>This OTP will expire in 5 minutes.</p>
         </body></html>`,
 };

 try {
  await axios.post(brevoUrl, mailData, {
   headers: {
    'accept': 'application/json',
    'api-key': BREVO_API_KEY,
    'content-type': 'application/json',
   },
  });
  console.log(`OTP sent to ${email} via Brevo API`);
 } catch (error) {
  // Log a more detailed error message
  console.error(`Error sending OTP via Brevo API: ${error.message}`);
  if (error.response) {
   console.error('Brevo API Response Error:', error.response.data);
  } else {
   console.error('Network Error:', error.code);
  }
  // Important: Re-throw the error so the caller knows the operation failed
  throw new Error('Failed to send OTP email.'); 
 }
};

// Generate OTP and send email
router.post('/send-otp', async (req, res) => {
 const { email } = req.body;
 const otp = crypto.randomInt(100000, 999999).toString(); // 6-digit OTP
 const expirationTime = Date.now() + 5 * 60 * 1000;

 otpStorage[email] = { otp, expirationTime };

 // Optional: Auto-delete expired OTP after 5 minutes
 setTimeout(() => {
  delete otpStorage[email];
 }, 5 * 60 * 1000);

 try {
  await sendOTPEmail(email, otp); // Call the updated function
  res.status(200).send({ message: 'OTP sent to your email!' });
 } catch (error) {
  // If sendOTPEmail fails, catch the re-thrown error and send a 500 response
  res.status(500).send({ message: 'Failed to send OTP. Please try again.' });
 }
});

// Verify OTP before proceeding to registration
router.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  const storedOtp = otpStorage[email];

  if (!storedOtp) {
    return res.status(400).send({ message: 'OTP not found or expired' });
  }

  if (storedOtp.otp === otp && Date.now() < storedOtp.expirationTime) {
    verifiedEmails.add(email);         // Mark email as verified
    delete otpStorage[email];          // Clean up OTP
    return res.status(200).send({ message: 'OTP verified. Proceed to create account' });
  }

  res.status(400).send({ message: 'Invalid or expired OTP' });
});

// User Registration (only if OTP was verified)
router.post("/", async (req, res) => {
  try {
    const { error } = validate(req.body);
    if (error) return res.status(400).send({ message: error.details[0].message });

    // Check if email was verified
    if (!verifiedEmails.has(req.body.email)) {
      return res.status(400).send({ message: "OTP verification required before registration." });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(409).send({ message: "User with given Email already exists" });
    }

    const salt = await bcrypt.genSalt(Number(process.env.SALT));
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    await new User({ ...req.body, password: hashedPassword }).save();

    verifiedEmails.delete(req.body.email); // Clean up after successful registration

    res.status(201).send({ message: "User Created Successfully" });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// Get profile (protected route)
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }

    res.status(200).send({ username: user.firstName });
  } catch (error) {
    res.status(500).send({ message: 'Server error' });
  }
});

module.exports = router;
