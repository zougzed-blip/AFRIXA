async function viewDemandeDetails(demandeId) {
    try {
        const response = await apiFetch(`/api/agence/demandes/${demandeId}`);
        if (!response || !response.ok) {
            showMessage('Erreur lors du chargement des détails', 'error');
            return;
        }
        
        const result = await response.json();
        const demande = result.success ? result.data : result;
        
        if (!demande) {
            showMessage('Demande non trouvée', 'error');
            return;
        }
        
        document.getElementById('modal-demande-details-code').textContent = `Code: ${escapeHtml(demande.codeColis)}`;
        
        const modalContent = document.getElementById('modal-details-content');
        if (modalContent) {
            const date = new Date(demande.date || demande.createdAt);
            const formattedDate = date.toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            const prixDisplay = demande.prixFinal ? 
                `${escapeHtml(demande.prixFinal.toLocaleString())} $ (ajusté)` : 
                `${escapeHtml(demande.prix.toLocaleString())} $`;
            
            const poidsPourCalcul = demande.poidsReel || demande.poidsVolumeAjuste || demande.poidOuTaille || 0;
            const prixPourCalcul = demande.prixFinal || demande.prix || 0;
            const tarifParKg = poidsPourCalcul > 0 ? (prixPourCalcul * poidsPourCalcul) : 0;
            
            const poidsSection = demande.poidsVolumeAjuste || demande.poidsReel ? `
                <div class="detail-item">
                    <label>Poids déclaré:</label>
                    <span>${escapeHtml(demande.poidOuTaille || 'N/A')}</span>
                </div>
                <div class="detail-item">
                    <label>Poids réel:</label>
                    <span>${escapeHtml(demande.poidsVolumeAjuste || demande.poidsReel)} kg</span>
                </div>
            ` : `
                <div class="detail-item">
                    <label>Poids/Volume:</label>
                    <span>${escapeHtml(demande.poidOuTaille || 'N/A')}</span>
                </div>
            `;
            
            modalContent.innerHTML = sanitizeHtml(`
                <div class="demande-details">
                    <div class="detail-section">
                        <h3> Informations client</h3>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <label>Nom complet:</label>
                                <span>${escapeHtml(demande.fullName || 'N/A')}</span>
                            </div>
                            <div class="detail-item">
                                <label>Email:</label>
                                <span>${escapeHtml(demande.email || 'N/A')}</span>
                            </div>
                            <div class="detail-item">
                                <label>Téléphone:</label>
                                <span>${escapeHtml(demande.telephone || 'N/A')}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h3> Détails du colis</h3>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <label>Type de colis:</label>
                                <span>${escapeHtml(demande.typeColis || 'N/A')}</span>
                            </div>
                            ${poidsSection}
                            <div class="detail-item">
                                <label>Destination:</label>
                                <span>${escapeHtml(demande.destination || 'N/A')}</span>
                            </div>
                            <div class="detail-item">
                                <label>Prix/kg</label>
                                <span>${prixDisplay}</span>
                            </div>
                            <div class="detail-item">
                                <label>Prix Total:</label>
                                <span>${escapeHtml(tarifParKg)} $/</span>
                            </div>
                            <div class="detail-item">
                                <label>Délai:</label>
                                <span>${escapeHtml(demande.delai || 'N/A')}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h3> Statut</h3>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <label>Statut actuel:</label>
                                <span class="status-badge status-${escapeHtml(demande.status)}">${escapeHtml(getStatusText(demande.status))}</span>
                            </div>
                            <div class="detail-item">
                                <label>Date création:</label>
                                <span>${escapeHtml(formattedDate)}</span>
                            </div>
                        </div>
                    </div>
                    
                    ${demande.description ? `
                    <div class="detail-section">
                        <h3> Description</h3>
                        <div class="description-box">
                            <p>${escapeHtml(demande.description)}</p>
                        </div>
                    </div>
                    ` : ''}
                </div>
            `);
        }
        
        document.getElementById('details-modal').style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
    } catch (error) {
        showMessage('Erreur lors du chargement des détails', 'error');
    }
}

window.viewDemandeDetails = viewDemandeDetails;