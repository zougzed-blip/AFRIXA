document.addEventListener('DOMContentLoaded', function() {

    // 1. Gestion de la sélection du type
    const typeCards = document.querySelectorAll('.type-card');
    const forms = document.querySelectorAll('.inscription-form');
    const backButtons = document.querySelectorAll('.back-to-selection');
    const successModal = document.getElementById('success-modal');
    const modalClose = document.getElementById('modal-close');

    // Afficher le formulaire selon le type sélectionné
    typeCards.forEach(card => {
        card.addEventListener('click', function() {
            const userType = this.getAttribute('data-type');
            forms.forEach(f => f.classList.add('hidden'));
            document.getElementById(`${userType}-form`).classList.remove('hidden');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });

    // Bouton retour
    backButtons.forEach(button => {
        button.addEventListener('click', function() {
            forms.forEach(f => f.classList.add('hidden'));
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });

    // 2. Upload photo
    setupPhoto('client', 'photo');
    setupPhoto('agence', 'logo');
    setupPhoto('grand', 'logo');
    setupPhoto('petit', 'logo');

    function setupPhoto(type, fileName) {
        const upload = document.getElementById(`${type}-upload-area`);
        const fileInput = document.getElementById(`${type}-${fileName}`);
        const preview = document.getElementById(`${type}-preview`);

        if (!upload) return;

        upload.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', e => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = ev => {
                preview.querySelector('img').src = ev.target.result;
                preview.classList.remove('hidden');
                upload.style.display = 'none';
            };
            reader.readAsDataURL(file);
        });

        preview.querySelector('.remove-photo').addEventListener('click', () => {
            preview.classList.add('hidden');
            upload.style.display = 'block';
            fileInput.value = '';
        });
    }

    // 3. Champs dynamiques
    setupDynamicFields();

    function setupDynamicFields() {
        document.querySelectorAll('.btn-add-field').forEach(addBtn => {
            addBtn.addEventListener('click', () => {
                const container = addBtn.previousElementSibling;
                const baseGroup = container.querySelector('.field-group');
                const clone = baseGroup.cloneNode(true);

                clone.querySelectorAll('input,select').forEach(i => i.value = '');

                clone.querySelector('.btn-remove-field').addEventListener('click', () => {
                    if (container.children.length > 1) clone.remove();
                });

                container.appendChild(clone);
            });
        });

        document.querySelectorAll('.btn-remove-field').forEach(btn => {
            btn.addEventListener('click', function() {
                const container = this.closest('.dynamic-fields');
                if (container.children.length > 1) this.closest('.field-group').remove();
            });
        });
    }

    // 4. Soumission des formulaires
    forms.forEach(form => {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();

            const submitBtn = this.querySelector('.btn-primary');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Création en cours...';

            const formData = new FormData(this);

            // Détection du rôle
            const id = this.id;
            if (id === 'client-form') formData.append('role', 'client');
            if (id === 'transporteur-petit-form') formData.append('role', 'petit_transporteur');
            if (id === 'transporteur-grand-form') formData.append('role', 'grand_transporteur');
            if (id === 'agence-form') formData.append('role', 'agence');

            // Destinations (pour agence)
            const destCheckboxes = this.querySelectorAll('input[name="destinations"]:checked');
            const destinations = Array.from(destCheckboxes).map(cb => cb.value);
            destinations.forEach((d, i) => formData.append(`destinations[${i}]`, d));

            // Tarifs (pour agence)
            const tarifGroups = this.querySelectorAll('.field-group');
            tarifGroups.forEach((group, i) => {
                const depart = group.querySelector('select[name="ville-depart[]"]');
                const arrivee = group.querySelector('select[name="ville-arrivee[]"]');
                const prix = group.querySelector('input[name="prix-trajet[]"]');
                const delai = group.querySelector('input[name="delai-trajet[]"]');

                if (depart && depart.value && arrivee && arrivee.value && prix && prix.value) {
                    formData.append(`tarifs[${i}][villeDepart]`, depart.value);
                    formData.append(`tarifs[${i}][villeArrivee]`, arrivee.value);
                    formData.append(`tarifs[${i}][prix]`, prix.value);
                    if (delai && delai.value) formData.append(`tarifs[${i}][delai]`, delai.value);
                }
            });

            // Types de véhicules
            const vehiculesCheckboxes = this.querySelectorAll('input[name="type-transport"]:checked, input[name="mode-transport[]"]:checked');
            const vehicules = Array.from(vehiculesCheckboxes).map(cb => cb.value);
            vehicules.forEach((v, i) => formData.append(`vehicules[${i}]`, v));

            // Log pour debug
            console.log('📤 Données envoyées :');
            for (let pair of formData.entries()) {
                console.log(pair[0] + ': ' + pair[1]);
            }

            try {
                const res = await fetch('http://localhost:3000/api/auth/register', {
                    method: 'POST',
                    body: formData
                });

                const data = await res.json();

                if (res.ok) {
                    successModal.classList.remove('hidden');
                    this.reset();
                    
                    // Réinitialiser les photos
                    const previews = this.querySelectorAll('.photo-preview');
                    previews.forEach(p => p.classList.add('hidden'));
                    const uploads = this.querySelectorAll('.upload-area');
                    uploads.forEach(u => u.style.display = 'block');
                    
                } else {
                    alert(data.message || "Une erreur est survenue lors de l'inscription");
                }
            } catch (error) {
                console.error('Erreur:', error);
                alert("Erreur de connexion au serveur. Veuillez réessayer.");
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    });

    // 5. Modal de succès
    modalClose.addEventListener('click', () => {
        successModal.classList.add('hidden');
        window.location.href = 'connexion.html';
    });

    // Fermer modal en cliquant en dehors
    successModal.addEventListener('click', (e) => {
        if (e.target === successModal) {
            successModal.classList.add('hidden');
            window.location.href = 'connexion.html';
        }
    });

    // Fermer modal avec Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !successModal.classList.contains('hidden')) {
            successModal.classList.add('hidden');
            window.location.href = 'connexion.html';
        }
    });

});