
document.addEventListener('DOMContentLoaded', function() {
    
    const serviceCards = document.querySelectorAll('.service-card');
    
    serviceCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
    
    
    const serviceButtons = document.querySelectorAll('.btn-service');
    
    serviceButtons.forEach(button => {
        button.addEventListener('click', function() {
            const buttonText = this.textContent.trim();
           
            switch(buttonText) {
                case 'Créer une demande':
                    window.location.href = 'inscription.html';
                    break;
                case 'S\'inscrire comme agence':
                    showVerificationModal('agence');
                    break;
                case 'S\'inscrire comme transporteur':
                    showVerificationModal('transporteur');
                    break;
                case 'Devenir partenaire transport':
                    showVerificationModal('transport-local');
                    break;
                case 'Contactez-nous':
                    window.location.href = 'contact.html';
                    break;
                default:
                    console.log('Action non définie pour:', buttonText);
            }
        });
    });
    
   
    function showVerificationModal(type) {
        const modal = document.createElement('div');
        modal.className = 'verification-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <div class="modal-icon">
                    <i class="fas fa-clipboard-check"></i>
                </div>
                <h3>Processus de Vérification</h3>
                <p>Pour les ${type}s, notre processus d'inscription comprend :</p>
                <ol>
                    <li>Remplissage du formulaire d'inscription</li>
                    <li>Vérification manuelle par notre équipe (48h)</li>
                    <li>Entretien de validation</li>
                    <li>Paiement de l'abonnement de 30$/mois</li>
                    <li>Activation de votre compte</li>
                </ol>
                <div class="modal-buttons">
                    <button class="btn-gold confirm-inscription" data-type="${type}">
                        <i class="fas fa-check"></i> Confirmer l'inscription
                    </button>
                    <button class="btn-dark close-modal-btn">
                        <i class="fas fa-times"></i> Annuler
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        setTimeout(() => {
            modal.classList.add('active');
        }, 100);
        
       
        const closeBtn = modal.querySelector('.close-modal');
        const closeModalBtn = modal.querySelector('.close-modal-btn');
        
        closeBtn.addEventListener('click', closeModal);
        closeModalBtn.addEventListener('click', closeModal);
        
    
        const confirmBtn = modal.querySelector('.confirm-inscription');
        confirmBtn.addEventListener('click', function() {
            window.location.href = `inscription.html`;
        });
        
      e
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        function closeModal() {
            modal.classList.remove('active');
            setTimeout(() => {
                document.body.removeChild(modal);
            }, 300);
        }
    }
    

    const modalStyles = document.createElement('style');
    modalStyles.textContent = `
        .verification-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
        }
        
        .verification-modal.active {
            opacity: 1;
            visibility: visible;
        }
        
        .modal-content {
            background: var(--blanc);
            padding: 2.5rem;
            border-radius: 20px;
            max-width: 500px;
            width: 90%;
            position: relative;
            transform: translateY(-50px);
            transition: transform 0.3s ease;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        
        .verification-modal.active .modal-content {
            transform: translateY(0);
        }
        
        .close-modal {
            position: absolute;
            top: 15px;
            right: 20px;
            font-size: 1.5rem;
            cursor: pointer;
            color: var(--vert-fonce);
        }
        
        .modal-icon {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, var(--dore), #D4A942);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1.5rem;
            color: var(--blanc);
            font-size: 2rem;
        }
        
        .modal-content h3 {
            text-align: center;
            color: var(--vert-fonce);
            margin-bottom: 1rem;
            font-size: 1.5rem;
        }
        
        .modal-content p {
            text-align: center;
            margin-bottom: 1.5rem;
            color: var(--vert-fonce);
        }
        
        .modal-content ol {
            text-align: left;
            margin-bottom: 2rem;
            padding-left: 1.5rem;
        }
        
        .modal-content li {
            margin-bottom: 0.5rem;
            color: var(--vert-fonce);
        }
        
        .modal-buttons {
            display: flex;
            gap: 1rem;
            justify-content: center;
        }
        
        @media (max-width: 480px) {
            .modal-content {
                padding: 2rem 1.5rem;
            }
            
            .modal-buttons {
                flex-direction: column;
            }
        }
    `;
    document.head.appendChild(modalStyles);
    
    const ctaButtons = document.querySelectorAll('.cta-buttons .btn-gold, .cta-buttons .btn-dark');
    
    ctaButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (this.classList.contains('btn-gold')) {
              
                window.location.href = 'inscription.html';
            } else {
                
                window.location.href = 'about.html';
            }
        });
    });
    

    const observerOptions = {
        threshold: 0.3,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
  
    const processSteps = document.querySelectorAll('.process-step');
    processSteps.forEach(step => {
        step.style.opacity = '0';
        step.style.transform = 'translateY(20px)';
        step.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(step);
    });
    

    processSteps.forEach((step, index) => {
        step.style.transitionDelay = `${index * 0.1}s`;
    });
   
    const benefitCards = document.querySelectorAll('.benefit-card');
    benefitCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(card);
    });
    
 
    benefitCards.forEach((card, index) => {
        card.style.transitionDelay = `${index * 0.1}s`;
    });
});