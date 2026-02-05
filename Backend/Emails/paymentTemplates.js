function paiementAccepteTemplate(nomClient, codeColis) {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2 style="color: green;"> Paiement Confirmé</h2>
      <p>Bonjour <strong>${nomClient}</strong>,</p>
      <p>Votre paiement pour la demande <strong>${codeColis}</strong> a été confirmé.</p>
      <p>Votre colis est maintenant en cours de traitement.</p>
      <p>Merci pour votre confiance !</p>
      <p>L'équipe AFRIXA</p>
    </div>
  `;
}

function paiementRefuseTemplate(nomClient, codeColis) {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2 style="color: red;"> Paiement Non Validé</h2>
      <p>Bonjour <strong>${nomClient}</strong>,</p>
      <p>Votre paiement pour la demande <strong>${codeColis}</strong> n'a pas été validé.</p>
      <p>Raisons possibles :</p>
      <ul>
        <li>Preuve de paiement manquante</li>
        <li>Capture d'écran/photo non lisible</li>
        <li>PDF corrompu</li>
        <li>Informations manquantes</li>
      </ul>
      <p>Veuillez soumettre à nouveau votre preuve de paiement.</p>
      <p>L'équipe AFRIXA</p>
    </div>
  `;
}

module.exports = {
  paiementAccepteTemplate,
  paiementRefuseTemplate
};