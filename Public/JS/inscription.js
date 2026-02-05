document.addEventListener('DOMContentLoaded', function() {
    // Éléments DOM
    const typeCards = document.querySelectorAll('.type-card-wrapper');
    const forms = document.querySelectorAll('.inscription-form');
    const typeSelectionSection = document.getElementById('typeSelection');
    const formsContainer = document.getElementById('formsContainer');
    const successModal = document.getElementById('success-modal');
    const modalClose = document.getElementById('modal-close');
    const steps = document.querySelectorAll('.step');

    // Variables d'état
    let currentForm = null;
    let currentFormType = null;

    // Configuration des étapes par formulaire
    const FORM_STEPS = {
        'client': 3,
        'agence': 5,
        'transporteur-grand': 5,
        'transporteur-petit': 5
    };

    init();

    function init() {
        setupTypeSelection();
        setupFormNavigation();
        setupPhotoUploads();
        setupDynamicFields();
        setupPasswordToggle();
        setupCheckboxes();
        setupFormSubmission();
        setupModal();
    }

    // 2. Sélection du type de compte
    function setupTypeSelection() {
        typeCards.forEach(card => {
            card.addEventListener('click', function() {
                const type = this.getAttribute('data-type');
                selectAccountType(type);
            });
        });
    }

    function selectAccountType(type) {
        currentFormType = type;
        
        // Mettre à jour les étapes
        updateSteps(2);
        
        // Cacher la sélection, montrer le formulaire
        typeSelectionSection.classList.remove('active');
        formsContainer.style.display = 'block';
        
        // Cacher tous les formulaires, montrer le bon
        forms.forEach(form => form.classList.add('hidden'));
        currentForm = document.getElementById(`${type}-form`);
        
        if (currentForm) {
            currentForm.classList.remove('hidden');
            resetFormSections(currentForm);
            updateTotalSteps(FORM_STEPS[type] || 3);
        }
        
        // Scroll vers le formulaire
        formsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function resetFormSections(form) {
        const sections = form.querySelectorAll('.form-section');
        sections.forEach((section, index) => {
            section.classList.remove('active');
            if (index === 0) {
                section.classList.add('active');
            }
        });
        
        // Reset navigation
        updateFormNavigation(form, 1);
    }

    function updateSteps(activeStep) {
        steps.forEach(step => {
            const stepNum = parseInt(step.getAttribute('data-step'));
            if (stepNum === activeStep) {
                step.classList.add('active');
            } else if (stepNum < activeStep) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
    }

    function updateTotalSteps(totalSteps) {
        // Mettre à jour l'indicateur de progression dans le formulaire
        if (currentForm) {
            const progressFill = currentForm.querySelector('.progress-fill');
            const stepText = currentForm.querySelector('.form-progress span');
            
            if (progressFill) {
                const progressPercent = (1 / totalSteps) * 100;
                progressFill.style.width = `${progressPercent}%`;
            }
            
            if (stepText) {
                stepText.textContent = `Étape 1 sur ${totalSteps}`;
            }
        }
    }

    // 3. Navigation dans le formulaire
    function setupFormNavigation() {
        // Retour à la sélection
        document.querySelectorAll('.back-to-selection').forEach(btn => {
            btn.addEventListener('click', () => {
                formsContainer.style.display = 'none';
                typeSelectionSection.classList.add('active');
                updateSteps(1);
                document.querySelector('.main-content').scrollIntoView({ behavior: 'smooth' });
            });
        });

        // Navigation Next/Previous
        document.addEventListener('click', function(e) {
            if (!currentForm) return;
            
            if (e.target.closest('.next-section')) {
                navigateToNextSection();
            } else if (e.target.closest('.prev-section')) {
                navigateToPrevSection();
            }
        });
    }

    function navigateToNextSection() {
        const activeSection = currentForm.querySelector('.form-section.active');
        const nextSection = activeSection.nextElementSibling;
        
        if (nextSection && nextSection.classList.contains('form-section')) {
            // Validation
            if (!validateSection(activeSection)) return;
            
            // Transition
            activeSection.classList.remove('active');
            nextSection.classList.add('active');
            
            // Update progress
            const sections = currentForm.querySelectorAll('.form-section');
            const sectionIndex = Array.from(sections).indexOf(nextSection) + 1;
            const totalSteps = sections.length;
            updateFormNavigation(currentForm, sectionIndex, totalSteps);
            
            // Scroll
            nextSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function navigateToPrevSection() {
        const activeSection = currentForm.querySelector('.form-section.active');
        const prevSection = activeSection.previousElementSibling;
        
        if (prevSection && prevSection.classList.contains('form-section')) {
            activeSection.classList.remove('active');
            prevSection.classList.add('active');
            
            const sections = currentForm.querySelectorAll('.form-section');
            const sectionIndex = Array.from(sections).indexOf(prevSection) + 1;
            const totalSteps = sections.length;
            updateFormNavigation(currentForm, sectionIndex, totalSteps);
            
            prevSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function validateSection(section) {
        const requiredInputs = section.querySelectorAll('input[required], select[required]');
        let isValid = true;

        requiredInputs.forEach(input => {
            if (!input.value.trim()) {
                showInputError(input, 'Ce champ est requis');
                isValid = false;
            } else {
                removeInputError(input);
                
                // Validation spécifique
                if (input.type === 'email' && !isValidEmail(input.value)) {
                    showInputError(input, 'Email invalide');
                    isValid = false;
                }
                
                if (input.type === 'password' && input.value.length < 8) {
                    showInputError(input, 'Minimum 8 caractères');
                    isValid = false;
                }
                
                if (input.type === 'tel' && !isValidPhone(input.value)) {
                    showInputError(input, 'Numéro de téléphone invalide');
                    isValid = false;
                }
                
                if (input.type === 'number' && parseFloat(input.value) < 0) {
                    showInputError(input, 'Le nombre doit être positif');
                    isValid = false;
                }
            }
        });

        return isValid;
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function isValidPhone(phone) {
        // Validation simple pour numéros internationaux
        return /^[+\d\s\-()]{10,}$/.test(phone);
    }

    function showInputError(input, message) {
        const wrapper = input.closest('.input-wrapper');
        if (!wrapper) return;
        
        wrapper.classList.add('error');
        
        let errorMsg = wrapper.querySelector('.error-message');
        if (!errorMsg) {
            errorMsg = document.createElement('div');
            errorMsg.className = 'error-message';
            errorMsg.style.color = 'var(--rouge-terre)';
            errorMsg.style.fontSize = '12px';
            errorMsg.style.marginTop = '5px';
            wrapper.appendChild(errorMsg);
        }
        errorMsg.textContent = message;
        
        // Ajouter bordure rouge
        input.style.borderColor = 'var(--rouge-terre)';
    }

    function removeInputError(input) {
        const wrapper = input.closest('.input-wrapper');
        if (!wrapper) return;
        
        wrapper.classList.remove('error');
        
        const errorMsg = wrapper.querySelector('.error-message');
        if (errorMsg) errorMsg.remove();
        
        // Réinitialiser la bordure
        input.style.borderColor = '';
    }

    function updateFormNavigation(form, currentSection, totalSections) {
        const prevBtn = form.querySelector('.prev-section');
        const nextBtn = form.querySelector('.next-section');
        const submitBtn = form.querySelector('.submit-form');
        const progressFill = form.querySelector('.progress-fill');
        
        // Update progress bar
        if (progressFill) {
            const progressPercent = (currentSection / totalSections) * 100;
            progressFill.style.width = `${progressPercent}%`;
        }
        
        // Update step text
        const stepText = form.querySelector('.form-progress span');
        if (stepText) {
            stepText.textContent = `Étape ${currentSection} sur ${totalSections}`;
        }
        
        // Update buttons visibility
        if (currentSection === 1) {
            prevBtn.classList.add('hidden');
        } else {
            prevBtn.classList.remove('hidden');
        }
        
        if (currentSection === totalSections) {
            nextBtn.classList.add('hidden');
            submitBtn.classList.remove('hidden');
        } else {
            nextBtn.classList.remove('hidden');
            submitBtn.classList.add('hidden');
        }
    }

    // 4. Upload de photos
    function setupPhotoUploads() {
        const uploads = [
            { id: 'client-upload-area', input: 'client-photo', preview: 'client-preview' },
            { id: 'agence-upload-area', input: 'agence-logo', preview: 'agence-preview' },
            { id: 'grand-upload-area', input: 'grand-logo', preview: 'grand-preview' },
            { id: 'petit-upload-area', input: 'petit-logo', preview: 'petit-preview' }
        ];

        uploads.forEach(upload => {
            const uploadArea = document.getElementById(upload.id);
            const fileInput = document.getElementById(upload.input);
            const preview = document.getElementById(upload.preview);

            if (!uploadArea || !fileInput) return;

            uploadArea.addEventListener('click', () => fileInput.click());
            
            fileInput.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (file) {
                    handleFileUpload(file, preview, uploadArea);
                }
            });

            if (preview) {
                preview.querySelector('.remove-photo')?.addEventListener('click', () => {
                    resetUpload(preview, uploadArea, fileInput);
                });
            }
            
            // Drag and drop
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.style.backgroundColor = 'rgba(0, 71, 50, 0.1)';
                uploadArea.style.borderColor = 'var(--vert-fonce)';
            });

            uploadArea.addEventListener('dragleave', () => {
                uploadArea.style.backgroundColor = '';
                uploadArea.style.borderColor = '';
            });

            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.style.backgroundColor = '';
                uploadArea.style.borderColor = '';
                
                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith('image/')) {
                    handleFileUpload(file, preview, uploadArea);
                    fileInput.files = e.dataTransfer.files;
                }
            });
        });
    }

    function handleFileUpload(file, preview, uploadArea) {
        // Validation
        if (file.size > 2 * 1024 * 1024) {
            showError('Le fichier est trop volumineux (max 2MB)');
            return;
        }

        if (!file.type.match(/image\/(jpeg|jpg|png)/)) {
            showError('Format de fichier non supporté (JPG, PNG uniquement)');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            if (preview) {
                preview.querySelector('img').src = e.target.result;
                preview.classList.remove('hidden');
                uploadArea.style.display = 'none';
            }
        };
        reader.readAsDataURL(file);
    }

    function resetUpload(preview, uploadArea, fileInput) {
        fileInput.value = '';
        if (preview) {
            preview.classList.add('hidden');
            preview.querySelector('img').src = '';
        }
        if (uploadArea) {
            uploadArea.style.display = 'block';
        }
    }

    // 5. Champs dynamiques
    function setupDynamicFields() {
        document.addEventListener('click', function(e) {
            // Ajouter un champ
            if (e.target.closest('.btn-add-field')) {
                const addBtn = e.target.closest('.btn-add-field');
                const container = addBtn.previousElementSibling;
                const baseGroup = container.querySelector('.field-group');
                
                if (baseGroup) {
                    const clone = baseGroup.cloneNode(true);
                    resetFieldGroup(clone);
                    container.appendChild(clone);
                    setupFieldGroupEvents(clone);
                    
                    // Animation d'ajout
                    clone.style.opacity = '0';
                    clone.style.transform = 'translateY(10px)';
                    setTimeout(() => {
                        clone.style.transition = 'all 0.3s ease';
                        clone.style.opacity = '1';
                        clone.style.transform = 'translateY(0)';
                    }, 10);
                }
            }

            // Supprimer un champ
            if (e.target.closest('.btn-remove-field')) {
                const removeBtn = e.target.closest('.btn-remove-field');
                const fieldGroup = removeBtn.closest('.field-group');
                const container = fieldGroup.closest('.dynamic-fields');
                
                if (container.children.length > 1) {
                    // Animation de suppression
                    fieldGroup.style.opacity = '0';
                    fieldGroup.style.transform = 'translateX(-20px)';
                    setTimeout(() => {
                        fieldGroup.remove();
                    }, 300);
                } else {
                    showError('Vous devez avoir au moins un champ');
                }
            }
        });
    }

    function resetFieldGroup(group) {
        group.querySelectorAll('input, select').forEach(input => {
            input.value = '';
            if (input.type === 'checkbox') {
                input.checked = false;
            }
        });
    }

    function setupFieldGroupEvents(group) {
        const removeBtn = group.querySelector('.btn-remove-field');
        if (removeBtn) {
            removeBtn.addEventListener('click', function() {
                const container = this.closest('.dynamic-fields');
                if (container.children.length > 1) {
                    // Animation de suppression
                    group.style.opacity = '0';
                    group.style.transform = 'translateX(-20px)';
                    setTimeout(() => {
                        group.remove();
                    }, 300);
                }
            });
        }
    }

    // 6. Setup checkboxes
    function setupCheckboxes() {
        document.addEventListener('change', function(e) {
            if (e.target.type === 'checkbox') {
                const checkbox = e.target;
                const checkmark = checkbox.nextElementSibling;
                
                if (checkmark && checkmark.classList.contains('checkmark')) {
                    if (checkbox.checked) {
                        checkmark.style.backgroundColor = 'var(--vert-fonce)';
                        checkmark.style.borderColor = 'var(--vert-fonce)';
                    } else {
                        checkmark.style.backgroundColor = '';
                        checkmark.style.borderColor = 'var(--vert-fonce)';
                    }
                }
            }
        });
    }

    // 7. Toggle password visibility
    function setupPasswordToggle() {
        document.addEventListener('click', function(e) {
            if (e.target.closest('.toggle-password')) {
                const toggleBtn = e.target.closest('.toggle-password');
                const input = toggleBtn.closest('.input-wrapper').querySelector('input');
                const icon = toggleBtn.querySelector('i');
                
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                } else {
                    input.type = 'password';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            }
        });
    }

    // 8. Soumission du formulaire
    function setupFormSubmission() {
        forms.forEach(form => {
            form.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                // Validation de toutes les sections
                const sections = this.querySelectorAll('.form-section');
                let allValid = true;
                
                sections.forEach(section => {
                    if (!validateSection(section)) {
                        allValid = false;
                    }
                });
                
                if (!allValid) {
                    showError('Veuillez corriger les erreurs dans le formulaire');
                    return;
                }

                const submitBtn = this.querySelector('.submit-form');
                const originalText = submitBtn.innerHTML;
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Création...';

                // Préparer FormData
                const formData = new FormData(this);
                
                // Ajouter le rôle
                const formId = this.id;
                const roleMap = {
                    'client-form': 'client',
                    'agence-form': 'agence',
                    'transporteur-grand-form': 'grand_transporteur',
                    'transporteur-petit-form': 'petit_transporteur'
                };
                formData.append('role', roleMap[formId] || 'client');

                // Traitement spécifique pour chaque formulaire
                processFormData(formId, formData, this);

                try {
                    const response = await fetch('http://localhost:3000/api/auth/register', {
                        method: 'POST',
                        body: formData
                    });

                    const data = await response.json();

                    if (response.ok) {
                        // Succès
                        updateSteps(3);
                        showSuccessModal();
                        this.reset();
                        
                        // Reset previews
                        this.querySelectorAll('.photo-preview').forEach(p => {
                            p.classList.add('hidden');
                            p.querySelector('img').src = '';
                        });
                        this.querySelectorAll('.upload-area').forEach(u => {
                            u.style.display = 'block';
                        });
                        
                        // Reset checkboxes
                        this.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                            cb.checked = false;
                            const checkmark = cb.nextElementSibling;
                            if (checkmark && checkmark.classList.contains('checkmark')) {
                                checkmark.style.backgroundColor = '';
                                checkmark.style.borderColor = 'var(--vert-fonce)';
                            }
                        });
                        
                    } else {
                        showError(data.message || "Erreur lors de l'inscription");
                    }
                } catch (error) {
                    console.error('Erreur:', error);
                    showError("Erreur de connexion au serveur");
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }
            });
        });
    }

    function processFormData(formId, formData, formElement) {
        switch(formId) {
            case 'agence-form':
               
                const destCheckboxes = formElement.querySelectorAll('input[name="destinations"]:checked');
                const destinations = Array.from(destCheckboxes).map(cb => cb.value);
                destinations.forEach((d, i) => formData.append(`destinations[${i}]`, d));

                const tarifGroups = formElement.querySelectorAll('.field-group');
                tarifGroups.forEach((group, i) => {
                    const depart = group.querySelector('select[name="ville-depart[]"]');
                    const arrivee = group.querySelector('select[name="ville-arrivee[]"]');
                    const prix = group.querySelector('input[name="prix-trajet[]"]');
                    const delai = group.querySelector('input[name="delai-trajet[]"]');

                    if (depart?.value && arrivee?.value && prix?.value) {
                        formData.append(`tarifs[${i}][villeDepart]`, depart.value);
                        formData.append(`tarifs[${i}][villeArrivee]`, arrivee.value);
                        formData.append(`tarifs[${i}][prix]`, prix.value);
                        if (delai?.value) formData.append(`tarifs[${i}][delai]`, delai.value);
                    }
                });
                break;

            case 'transporteur-grand-form':
                const typeTransportCheckboxes = formElement.querySelectorAll('input[name="type-transport"]:checked');
                const typeTransport = Array.from(typeTransportCheckboxes).map(cb => cb.value);
                typeTransport.forEach((v, i) => formData.append(`vehicules[${i}]`, v));
                break;

           case 'transporteur-petit-form':
    const modeTransportCheckboxes = formElement.querySelectorAll('input[name="mode-transport[]"]:checked');
    const modeTransport = Array.from(modeTransportCheckboxes).map(cb => cb.value);
    modeTransport.forEach((v, i) => formData.append(`modeTransport[${i}]`, v));

    const fieldGroups = formElement.querySelectorAll('.field-group');
    fieldGroups.forEach((group, i) => {
        const depart = group.querySelector('input[name="ville-depart[]"]');
        const arrivee = group.querySelector('input[name="ville-arrivee[]"]');
        const prix = group.querySelector('input[name="prix-trajet[]"]');
        const delai = group.querySelector('input[name="delai-trajet[]"]');

        if (depart?.value && arrivee?.value && prix?.value) {
            formData.append(`destinations[${i}][villeDepart]`, depart.value);
            formData.append(`destinations[${i}][villeArrivee]`, arrivee.value);
            formData.append(`destinations[${i}][prix]`, prix.value);
            if (delai?.value) formData.append(`destinations[${i}][delai]`, delai.value);
        }
    });
    break;

        }
    }

    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f8d7da;
            color: #721c24;
            padding: 15px 20px;
            border-radius: 8px;
            border: 1px solid #f5c6cb;
            display: flex;
            align-items: center;
            gap: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            z-index: 3000;
            animation: slideIn 0.3s ease;
            max-width: 400px;
        `;
        
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
            <button style="background: none; border: none; color: #721c24; cursor: pointer; margin-left: 10px; padding: 5px;">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        document.body.appendChild(errorDiv);
        
        // Fermer après 5 secondes
        const timeout = setTimeout(() => {
            errorDiv.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => errorDiv.remove(), 300);
        }, 5000);
        
        // Fermeture manuelle
        const closeBtn = errorDiv.querySelector('button');
        closeBtn.addEventListener('click', () => {
            clearTimeout(timeout);
            errorDiv.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => errorDiv.remove(), 300);
        });
        
        // Ajouter les animations CSS
        if (!document.querySelector('#error-animations')) {
            const style = document.createElement('style');
            style.id = 'error-animations';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // 9. Modal de succès
    function setupModal() {
        modalClose.addEventListener('click', () => {
            successModal.classList.add('hidden');
            window.location.href = 'connexion.html';
        });

        // Fermer en cliquant à l'extérieur
        successModal.addEventListener('click', (e) => {
            if (e.target === successModal || e.target.classList.contains('modal-overlay')) {
                successModal.classList.add('hidden');
                window.location.href = 'connexion.html';
            }
        });

        // Fermer avec ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !successModal.classList.contains('hidden')) {
                successModal.classList.add('hidden');
                window.location.href = 'connexion.html';
            }
        });
    }

    function showSuccessModal() {
        successModal.classList.remove('hidden');
        successModal.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // 10. Gestion des erreurs CSS
    const errorStyles = document.createElement('style');
    errorStyles.textContent = `
        .input-wrapper.error input,
        .input-wrapper.error select {
            border-color: var(--rouge-terre) !important;
        }
        
        .error-message {
            color: var(--rouge-terre) !important;
            font-size: 12px !important;
            margin-top: 5px !important;
            display: block !important;
        }
    `;
    document.head.appendChild(errorStyles);
});