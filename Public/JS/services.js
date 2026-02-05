// Services Page Script
document.addEventListener('DOMContentLoaded', function() {
    
    // Show verification modal
    window.showVerificationModal = function(type) {
        const modal = document.getElementById('verificationModal');
        const modalText = document.getElementById('modalText');
        const modalButton = document.getElementById('modalButton');
        
        let typeName = '';
        let buttonText = '';
        let buttonHref = 'inscription.html';
        
        if (type === 'agence') {
            typeName = 'Agence d\'expédition';
            buttonText = 'Devenir agence';
            buttonHref = 'inscription.html?type=agence';
        } else if (type === 'transporteur') {
            typeName = 'Transporteur';
            buttonText = 'Devenir transporteur';
            buttonHref = 'inscription.html?type=transporteur';
        }
        
        modalText.textContent = `Pour les ${typeName}, notre processus d'inscription comprend les étapes suivantes :`;
        modalButton.textContent = buttonText;
        modalButton.href = buttonHref;
        
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    };
    
    // Close verification modal
    function closeVerificationModal() {
        const modal = document.getElementById('verificationModal');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    
    // Modal event listeners
    const closeModalBtn = document.querySelector('.close-modal');
    const closeModalBtns = document.querySelectorAll('.close-modal-btn');
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeVerificationModal);
    }
    
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', closeVerificationModal);
    });
    
    // Close modal when clicking outside
    const modal = document.getElementById('verificationModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeVerificationModal();
            }
        });
    }
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal && modal.style.display === 'flex') {
            closeVerificationModal();
        }
    });
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            if (this.getAttribute('href') === '#') return;
            
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 100,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Update current year in footer
    const currentYear = new Date().getFullYear();
    const yearElements = document.querySelectorAll('.current-year');
    yearElements.forEach(el => {
        el.textContent = currentYear;
    });
    
    // Simple hover effect for service cards
    const serviceCards = document.querySelectorAll('.service-card');
    serviceCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.boxShadow = '0 15px 35px rgba(0, 0, 0, 0.1)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.08)';
        });
    });
    
    // Simple animation for feature icons
    const featureIcons = document.querySelectorAll('.feature-item i, .transport-type i, .entreprise-feature i');
    featureIcons.forEach(icon => {
        icon.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.1)';
        });
        
        icon.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    });
});