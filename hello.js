const nodemailer = require('nodemailer');

let transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'ganeshmaini078@gmail.com',
    pass: 'gnzv dojm bvvb dzwa',
  },
});

let mailOptions = {
  from: 'ganeshmaini078@gmail.com',
  to: 'ggane005@gmail.com',  // Use a different email to test
  subject: 'Test Email',
  text: 'This is a test email.',
};

transporter.sendMail(mailOptions, function (error, info) {
  if (error) {
    console.log('Error:', error);
  } else {
    console.log('Email sent: ' + info.response);
  }
});
