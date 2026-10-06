const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const sendEmail = async ({ to, subject, html }) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"JobNexus" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error('Email send error:', error.message);
    // Don't throw — email failure shouldn't break the main flow
  }
};

// Email templates
const emailTemplates = {
  applicationReceived: (applicantName, jobTitle, companyName) => ({
    subject: `Application Received — ${jobTitle} at ${companyName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #4F46E5; padding: 24px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Application Submitted!</h1>
        </div>
        <div style="padding: 24px; background: #f9fafb; border-radius: 0 0 8px 8px;">
          <p>Hi <strong>${applicantName}</strong>,</p>
          <p>Your application for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been received.</p>
          <p>The recruiter will review your profile and get back to you soon.</p>
          <p style="color: #6b7280; font-size: 14px;">Good luck! 🎉</p>
        </div>
      </div>
    `,
  }),

  statusUpdate: (applicantName, jobTitle, status) => ({
    subject: `Application Update — ${jobTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: ${status === 'hired' ? '#059669' : status === 'rejected' ? '#DC2626' : '#4F46E5'}; padding: 24px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Application Update</h1>
        </div>
        <div style="padding: 24px; background: #f9fafb; border-radius: 0 0 8px 8px;">
          <p>Hi <strong>${applicantName}</strong>,</p>
          <p>Your application for <strong>${jobTitle}</strong> has been updated to: <strong style="text-transform: capitalize;">${status}</strong>.</p>
          ${status === 'hired' ? '<p>Congratulations! 🎊 The recruiter will contact you with next steps.</p>' : ''}
          ${status === 'shortlisted' ? '<p>Great news! You\'ve been shortlisted. Expect a call soon.</p>' : ''}
          ${status === 'rejected' ? '<p>Thank you for your interest. Keep applying — the right opportunity is out there!</p>' : ''}
        </div>
      </div>
    `,
  }),

  welcomeEmail: (name) => ({
    subject: 'Welcome to JobNexus!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #4F46E5; padding: 24px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">Welcome, ${name}! 👋</h1>
        </div>
        <div style="padding: 24px; background: #f9fafb; border-radius: 0 0 8px 8px;">
          <p>Your account has been created successfully.</p>
          <p>Start exploring opportunities and take your career to the next level.</p>
        </div>
      </div>
    `,
  }),
};

module.exports = { sendEmail, emailTemplates };