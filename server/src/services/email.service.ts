import nodemailer from 'nodemailer';

// Configuration - MUST be set in .env for production
const EMAIL_HOST = process.env.EMAIL_HOST;
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || '587', 10); // Common ports: 587 (TLS), 465 (SSL)
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || '\"Gambit Chess\" <no-reply@gambitchess.example.com>'; // Default From address
const EMAIL_SECURE = process.env.EMAIL_SECURE === 'true'; // Use true for port 465, false for 587

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!EMAIL_HOST || !EMAIL_USER || !EMAIL_PASS) {
    console.error('FATAL ERROR: Email service environment variables (EMAIL_HOST, EMAIL_USER, EMAIL_PASS) are not configured.');
    // In a real app, you might have a fallback or disable email features,
    // but for essential verification, it might be better to prevent startup.
    throw new Error('Email service not configured.'); 
    // process.exit(1); // Alternatively, exit if email is critical
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: EMAIL_PORT,
      secure: EMAIL_SECURE, // true for 465, false for other ports (like 587 with STARTTLS)
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
      // Optional: Add TLS options if needed (e.g., requireTLS: true for STARTTLS)
      // tls: { rejectUnauthorized: false } // Use cautiously for self-signed certs in dev
    });

    // Verify connection configuration on startup (optional but recommended)
    transporter.verify((error, success) => {
      if (error) {
        console.error('Email transporter verification failed:', error);
        // Handle error appropriately - maybe retry or disable email
        transporter = null; // Reset transporter if verification fails
      } else {
        console.log('Email transporter is ready to send messages.');
      }
    });
  }
  return transporter;
}

export const EmailService = {
  async sendOtpEmail(to: string, otp: string): Promise<void> {
    const mailer = getTransporter();
    if (!mailer) {
        console.error('Cannot send OTP email: Transporter not available.');
        throw new Error('Email service is currently unavailable.');
    }

    const mailOptions = {
      from: EMAIL_FROM,
      to: to, // Recipient email address
      subject: 'Gambit Chess - Email Verification Code',
      text: `Your verification code is: ${otp}\n\nThis code will expire in 5 minutes.`, // Plain text body
      html: `<p>Your verification code is: <strong>${otp}</strong></p><p>This code will expire in 5 minutes.</p>`, // HTML body
    };

    try {
      console.log(`Attempting to send OTP email to ${to}`);
      let info = await mailer.sendMail(mailOptions);
      console.log('OTP Email sent: %s', info.messageId);
      // console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info)); // Only works with ethereal.email
    } catch (error) {
      console.error(`Error sending OTP email to ${to}:`, error);
      throw new Error('Failed to send verification email.');
    }
  },
}; 