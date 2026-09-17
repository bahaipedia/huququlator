const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail', // Change this if using a different provider
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

exports.sendVerificationEmail = async (toEmail, token) => {
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    
    const mailOptions = {
        from: `"Huququlator" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: 'Verify your Huququlator Account',
        html: `
            <h2>Welcome to Huququlator!</h2>
            <p>Please click the link below to verify your email address. Unverified accounts are deleted after 30 days.</p>
            <a href="${verifyUrl}" style="padding: 10px 15px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p>${verifyUrl}</p>
        `
    };

    await transporter.sendMail(mailOptions);
};
