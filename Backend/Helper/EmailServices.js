const { TransactionalEmailsApi, SendSmtpEmail, TransactionalEmailsApiApiKeys } = require('@getbrevo/brevo');

const apiInstance = new TransactionalEmailsApi();
apiInstance.setApiKey(
    TransactionalEmailsApiApiKeys.apiKey,
    process.env.BREVO_API_KEY
);

const sendEmail = async ({ to, subject, text, html }) => {
    try {
        const sendSmtpEmail = new SendSmtpEmail();
        sendSmtpEmail.sender = { 
            email: process.env.BREVO_EMAIL_USER, 
            name: "Afrixa" 
        };
        sendSmtpEmail.to = [{ email: to }];
        sendSmtpEmail.subject = subject;
        sendSmtpEmail.htmlContent = html || `<p>${text}</p>`;
        sendSmtpEmail.textContent = text;

        const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log("Email envoyé:", result.body);
        return { success: true, info: result.body };
    } catch (error) {
        console.error("Erreur lors de l'envoi de l'email:", error);
        return { success: false, error };
    }
};

module.exports = { sendEmail };