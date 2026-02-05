
const confirmationClientTemplate = (nom, codeColis) => `
  <div style="font-family: Arial, sans-serif; padding:20px;">
    <img src="Public/images/afrixa_logo.png" alt="AFRIXA" style="width:140px"/>
    <h2>Bonjour ${nom},</h2>
    <p>Votre demande a bien été reçue. Merci d'avoir utilisé AFRIXA Transport.</p>
    <p><strong>Code de la demande :</strong> ${codeColis}</p>
    <p>Nous contacterons l'agence concernée et vous tiendrons informé par email du suivi.</p>
    <hr>
    <p style="color:#666;">Cordialement,<br/>L'équipe AFRIXA Transport</p>
  </div>
`
const notificationAgenceTemplate = (agenceName, clientName, clientPhone, codeColis, linkToDashboard) => `
  <div style="font-family: Arial, sans-serif; padding:20px;">
    <h3>Nouvelle demande reçue</h3>
    <p>Agence : <strong>${agenceName}</strong></p>
    <p>Client : <strong>${clientName}</strong> — ${clientPhone}</p>
    <p>Code demande : <strong>${codeColis}</strong></p>
    <p>Consultez la demande dans votre dashboard : <a href="${linkToDashboard}">Voir la demande</a></p>
    <hr>
    <p style="color:#666;">AFRIXA Transport</p>
  </div>
`;

module.exports = { confirmationClientTemplate, notificationAgenceTemplate };
