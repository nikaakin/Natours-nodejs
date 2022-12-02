const nodemailer = require('nodemailer');

const sendEmailes = async options => {
  // create email transporter

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      pass: process.env.EMAIL_PASSWORD,
      user: process.env.EMAIL_USERNAME
    }
  });

  // define the email options
  const mailOptions = {
    from: 'Nika Cuckiridze  <nika@mail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message
  };
  // send an email
  await transporter.sendMail(mailOptions);
};
module.exports = sendEmailes;
