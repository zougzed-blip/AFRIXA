const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
    service : 'gmail',
    auth:{
        user : process.env.EMAIL_USER,
        pass : process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
})


const sendEmail =  async({to, subject, text, html})=>{
    try{
        const info = await transporter.sendMail({
            from : process.env.EMAIL_USER,
            to,
            subject,
            text: text || undefined,
            html: html || undefined
        })

        console.log("Email envoyé: ",  info.response)
        return {success: true, info}

    }catch(error){
        console.error("Erreur lors de l'envoi de l'email: ", error)
        return {success: false, error}
    }
}

module.exports = {
    sendEmail
}
