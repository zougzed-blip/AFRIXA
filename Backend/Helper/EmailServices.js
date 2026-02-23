const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com", 
    port: 587,
    secure: false, 
    auth: {
        user: "a3180f001@smtp-brevo.com", 
        pass: process.env.BREVO_API_KEY
    }
});

const sendEmail = async ({ to, subject, text, html }) => {
    try {
        const info = await transporter.sendMail({
            from: process.env.BREVO_EMAIL_USER,
            to,
            subject,
            text: text || undefined,
            html: html || undefined
        });

        console.log("Email envoyé: ", info.response);
        return { success: true, info };

    } catch (error) {
        console.error("Erreur lors de l'envoi de l'email: ", error);
        return { success: false, error };
    }
};

module.exports = { sendEmail };
