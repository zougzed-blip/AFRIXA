document.addEventListener('DOMContentLoaded', function() {
    
    // Animations au survol des membres d'équipe
    const teamMembers = document.querySelectorAll('.team-member');
    
    teamMembers.forEach(member => {
        member.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px)';
        });
        
        member.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
    
    // Animations des cartes mission
    const missionCards = document.querySelectorAll('.mission-card');
    
    missionCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
  
    // Animations des features
    const featureCards = document.querySelectorAll('.feature-about');
    
    featureCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
   
    // Animations des témoignages
    const testimonialCards = document.querySelectorAll('.testimonial-card');
    
    testimonialCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
 
    // Animation des statistiques
    const stats = document.querySelectorAll('.stat h3');
    let animated = false;
    
    function animateStats() {
        if (animated) return;
        
        stats.forEach(stat => {
            const target = parseInt(stat.textContent);
            let current = 0;
            const increment = target / 50;
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    current = target;
                    clearInterval(timer);
                }
                stat.textContent = Math.floor(current) + (stat.textContent.includes('+') ? '+' : '%');
            }, 30);
        });
        
        animated = true;
    }

    // Navigation des boutons CTA
    const ctaButtons = document.querySelectorAll('.cta-buttons-about .btn-gold, .cta-buttons-about .btn-dark, .cta-buttons-about .btn-outline');
    
    ctaButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (this.classList.contains('btn-gold')) {
                window.location.href = 'inscription.html';
            } else if (this.classList.contains('btn-dark')) {
                window.location.href = 'services.html';
            } else {
                window.location.href = 'contact.html';
            }
        });
    });
    
    // Animation au scroll
    const observerOptions = {
        threshold: 0.3,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                
                // Déclencher l'animation des stats quand la section hero est visible
                if (entry.target.classList.contains('about-hero-text')) {
                    animateStats();
                }
            }
        });
    }, observerOptions);
    
    // Observer les éléments à animer
    const animatedElements = document.querySelectorAll(
        '.story-text, .milestone, .mission-card, .team-member, .feature-about, .testimonial-card'
    );
    
    animatedElements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(element);
    });
    
    // Délais d'animation progressifs
    animatedElements.forEach((element, index) => {
        element.style.transitionDelay = `${index * 0.1}s`;
    });
    
    // Observer le texte hero pour les stats
    const heroText = document.querySelector('.about-hero-text');
    observer.observe(heroText);
    
    // Gestion des liens sociaux
    const socialLinks = document.querySelectorAll('.member-social a');
    
    socialLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Social media link clicked:', this.href);
        });
    });
    
    // Smooth scroll pour les ancres
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});