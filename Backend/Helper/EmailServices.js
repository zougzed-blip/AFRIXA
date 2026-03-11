const { BrevoClient } = require('@getbrevo/brevo');

const client = new BrevoClient({
    apiKey: process.env.BREVO_API_KEY
});

const sendEmail = async ({ to, subject, text, html }) => {
    try {
        const result = await client.transactionalEmails.sendTransacEmail({
            sender: { email: process.env.BREVO_EMAIL_USER, name: "Afrixa" },
            to: [{ email: to }],
            subject: subject,
            htmlContent: html || `<p>${text}</p>`,
            textContent: text
        });
        console.log("Email envoyé:", result);
        return { success: true, info: result };
    } catch (error) {
        console.error("Erreur lors de l'envoi de l'email:", error);
        return { success: false, error };
    }
};

const sendEmailToClient = async (clientEmail, clientName, subject, htmlContent) => {
    try {
        if (!clientEmail) return false;
        const result = await sendEmail({ to: clientEmail, subject, html: htmlContent });
        return result.success;
    } catch (error) {
        console.error(error);
        return false;
    }
};

module.exports = { sendEmail, sendEmailToClient };