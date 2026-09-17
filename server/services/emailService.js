const nodemailer = require('nodemailer');
require('dotenv').config();

// Configure Nodemailer for Amazon SES
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: true, // true for port 465 (TLS)
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

exports.sendVerificationEmail = async (toEmail, token) => {
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    
    const mailOptions = {
        from: `"Huququlator" <${process.env.EMAIL_FROM}>`, // MUST be an SES-verified email/domain
        to: toEmail,
        subject: 'Verify your Huququlator Account',
        html: `
            <h2>Welcome to Huququlator!</h2>
            <p>Please click the link below to verify your email address. Unverified accounts are deleted after 30 days.</p>
            <a href="${verifyUrl}" style="padding: 10px 15px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">Verify Email</a>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p><a href="${verifyUrl}">${verifyUrl}</a></p>
        `
    };

    await transporter.sendMail(mailOptions);
};
