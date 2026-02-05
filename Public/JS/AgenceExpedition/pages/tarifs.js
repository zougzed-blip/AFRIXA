async function loadProfileData() {
    try {   
        const response = await apiFetch('/api/agence/profile');
        if (!response || !response.ok) {
            throw new Error('Erreur chargement profil');
        }
        
        const result = await response.json();
        
        if (result.success) {
            currentUser = result.data;
            updateUserInfo();
            updateLogoEverywhere();
            populateProfileForm();
        } else {
            throw new Error(result.message || 'Erreur chargement profil');
        }
        
    } catch (error) {
        showMessage('Erreur lors du chargement du profil', 'error');
    }
}

function populateProfileForm() {
    if (!currentUser || !currentUser.agence) {
        return;
    }
    
    const agence = currentUser.agence;

    document.getElementById('agenceName').value = escapeHtml(agence.agenceName || '');
    document.getElementById('email').value = escapeHtml(currentUser.email || '');
    document.getElementById('telephone').value = escapeHtml(agence.telephone || '');
   
    currentTarifs = Array.isArray(agence.tarifs) ? [...agence.tarifs] : [];
    displayTarifs();

    updateLogoEverywhere();
}

async function saveTarif() {
    const index = parseInt(document.getElementById('destination-index').value);
    const pays = escapeHtml(document.getElementById('destination-pays').value);
    const villeDepart = escapeHtml(document.getElementById('destination-ville').value);
    const villeArrivee = escapeHtml(document.getElementById('destination-nom').value);
    const prix = parseFloat(document.getElementById('destination-tarif').value);
    const delai = parseInt(document.getElementById('destination-delai').value);
    
    if (!pays || !villeDepart || !villeArrivee || !prix || !delai) {
        showMessage('Veuillez remplir tous les champs obligatoires', 'error');
        return;
    }

    const tarif = {
        destination: `${villeDepart} - ${villeArrivee}`,
        prix: prix,
        delai: delai,
        unite: 'colis'
    };

    if (index === -1) {
        currentTarifs.push(tarif);
    } else {
        currentTarifs[index] = tarif;
    }

    try {
        const response = await apiFetch('/api/agence/update-profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                agenceName: escapeHtml(currentUser.agence.agenceName),
                responsable: escapeHtml(currentUser.agence.responsable || ''),
                telephone: escapeHtml(currentUser.agence.telephone),
                adresse: escapeHtml(currentUser.agence.adresse || ''),
                pays: escapeHtml(currentUser.agence.pays),
                numeroAgrement: escapeHtml(currentUser.agence.numeroAgrement || ''),
                destinations: currentUser.agence.destinations || [],
                tarifs: currentTarifs,
                locations: currentUser.agence.locations || [],
                services: currentUser.agence.services || [],
                typesColis: currentUser.agence.typesColis || [],
            })
        });

        if (!response || !response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Erreur lors de la mise à jour');
        }

        const result = await response.json();
        
        if (result.success && result.data) {
            currentUser = result.data;
            currentTarifs = result.data.agence.tarifs || [];
        }

        displayTarifs();
        resetTarifForm();
        showMessage(index === -1 ? 'Tarif ajouté avec succès' : 'Tarif modifié avec succès', 'success');

    } catch (error) {
        showMessage(error.message || 'Erreur lors de la sauvegarde', 'error');
    }
}

function editTarif(index) {
    if (index < 0 || index >= currentTarifs.length) {
        return;
    }  
    const tarif = currentTarifs[index];
    
    const [villeDepart, villeArrivee] = (tarif.destination || ' - ').split(' - ').map(v => v.trim());

    document.getElementById('destination-pays').value = '';
    document.getElementById('destination-ville').value = escapeHtml(villeDepart);
    document.getElementById('destination-nom').value = escapeHtml(villeArrivee);
    document.getElementById('destination-tarif').value = escapeHtml(tarif.prix || 0);
    document.getElementById('destination-delai').value = escapeHtml(tarif.delai || '');

    document.getElementById('destination-form-title').textContent = 'Modifier le trajet';
    document.getElementById('save-destination-btn').innerHTML = '<i class="fas fa-save"></i> Enregistrer les modifications';

    document.getElementById('destination-index').value = index;
    document.getElementById('cancel-destination-btn').style.display = 'inline-block';

    document.querySelector('.add-destination-form').scrollIntoView({ behavior: 'smooth' });
}

function cancelTarifEdit() {
    resetTarifForm();
}

function resetTarifForm() {
    document.getElementById('destination-pays').value = '';
    document.getElementById('destination-ville').value = '';
    document.getElementById('destination-nom').value = '';
    document.getElementById('destination-tarif').value = '';
    document.getElementById('destination-delai').value = '';
    
    document.getElementById('destination-form-title').textContent = 'Ajouter un nouveau trajet';
    document.getElementById('save-destination-btn').innerHTML = '<i class="fas fa-plus"></i> Ajouter le trajet';
    
    const saveBtn = document.getElementById('save-destination-btn');
    saveBtn.classList.remove('btn-success');
    saveBtn.classList.add('btn-primary');

    document.getElementById('destination-index').value = '-1';
    document.getElementById('cancel-destination-btn').style.display = 'none';
}

function confirmDeleteTarif(index) {
    if (index < 0 || index >= currentTarifs.length) {
        return;
    }
    
    tarifToDeleteIndex = index;
    const tarif = currentTarifs[index];
    const tarifName = escapeHtml(tarif.destination || 'ce trajet');

    document.getElementById('confirm-delete-message').textContent = 
        `Êtes-vous sûr de vouloir supprimer "${tarifName}" ?`;

    document.getElementById('confirm-delete-modal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

async function deleteTarifConfirmed() {
    if (tarifToDeleteIndex === null) return;
    
    try {        
        const response = await apiFetch('/api/agence/delete-tarif', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ index: tarifToDeleteIndex })
        });
        
        if (!response || !response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Erreur lors de la suppression');
        }
        
        const result = await response.json();
        
        if (result.success) {
            await loadProfileData();
            showMessage('Tarif supprimé avec succès', 'success');
        }
        
        closeModal();
        
    } catch (error) {
        showMessage(error.message || 'Erreur lors de la suppression', 'error');
    } finally {
        tarifToDeleteIndex = null;
    }
}

window.loadProfileData = loadProfileData;
window.populateProfileForm = populateProfileForm;
window.saveTarif = saveTarif;
window.editTarif = editTarif;
window.cancelTarifEdit = cancelTarifEdit;
window.resetTarifForm = resetTarifForm;
window.confirmDeleteTarif = confirmDeleteTarif;
window.deleteTarifConfirmed = deleteTarifConfirmed;