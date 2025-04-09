// /utils/emailservice.js

const nodemailer = require("nodemailer");
require("dotenv").config();

const sendEmail = async (to, subject, text, attachment = null) => {
  try {
    let transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"TechTrove" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      attachments: attachment
        ? [
            {
              filename: attachment.filename || "invoice.pdf",
              content: attachment.content,
            },
          ]
        : [],
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to: ${to}`);
  } catch (error) {
    console.error("❌ Error sending email:", error);
  }
};

module.exports = sendEmail;
