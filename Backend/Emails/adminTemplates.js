const demandeAccepteeTemplate = (nom) => `
  <div style="font-family: Arial, sans-serif; padding:20px;">
    <h2>Bonjour ${nom},</h2>
    <p>Félicitations ! Votre demande a été acceptée </p>
    <p>Vous pouvez maintenant accéder à votre compte normalement.</p>
    <hr>
    <p style="color:#666;">AFRIXA Transport</p>
  </div>
`;


const demandeEnAttenteTemplate = (nom) => `
  <div style="font-family: Arial, sans-serif; padding:20px;">
    <h2>Bonjour ${nom},</h2>
    <p>Votre demande est toujours en attente </p>
    <p>Si cela dépasse 2 jours, veuillez nous contacter au 123-456-789 ou par email à support@afrixa.com</p>
    <hr>
    <p style="color:#666;">AFRIXA Transport</p>
  </div>
`;

module.exports = {
    demandeAccepteeTemplate,
    demandeEnAttenteTemplate
};
