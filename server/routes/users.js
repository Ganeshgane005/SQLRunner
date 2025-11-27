const router = require("express").Router();
const { User, validate } = require('../model/user');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

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
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'ganeshmaini078@gmail.com',
      pass: 'gnzv dojm bvvb dzwa',
    },
  });

  let mailOptions = {
    from: 'ganeshmaini078@gmail.com',
    to: email,
    subject: 'Your OTP for Signup',
    text: `Your OTP is: ${otp}. It will expire in 5 minutes.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP sent to ${email}`);
  } catch (error) {
    console.log(`Error sending OTP: ${error}`);
  }
};

// Generate OTP and send email
router.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  const otp = crypto.randomInt(100000, 999999).toString();  // 6-digit OTP
  const expirationTime = Date.now() + 5 * 60 * 1000;

  otpStorage[email] = { otp, expirationTime };

  // Optional: Auto-delete expired OTP after 5 minutes
  setTimeout(() => {
    delete otpStorage[email];
  }, 5 * 60 * 1000);

  await sendOTPEmail(email, otp);

  res.status(200).send({ message: 'OTP sent to your email!' });
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