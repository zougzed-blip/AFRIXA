// À Propos Page Script
document.addEventListener('DOMContentLoaded', function() {
    
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
    
    // Animate number counters
    function animateCounters() {
        const counters = document.querySelectorAll('.chiffre h3');
        
        counters.forEach(counter => {
            const target = parseInt(counter.textContent.replace('+', '').replace('K', '000'));
            const startValue = 0;
            const duration = 1500;
            const increment = target / (duration / 16);
            
            let currentValue = startValue;
            
            const updateCounter = () => {
                currentValue += increment;
                if (currentValue >= target) {
                    counter.textContent = target.toLocaleString() + (counter.textContent.includes('+') ? '+' : '');
                } else {
                    counter.textContent = Math.floor(currentValue).toLocaleString();
                    requestAnimationFrame(updateCounter);
                }
            };
            
            updateCounter();
        });
    }
    
    // Animate counters when section is in view
    const chiffresObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounters();
                chiffresObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    const chiffresSection = document.querySelector('.chiffres');
    if (chiffresSection) {
        chiffresObserver.observe(chiffresSection);
    }
    
    // Simple hover effects
    const missionCards = document.querySelectorAll('.mission-card');
    missionCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
            this.style.boxShadow = '0 15px 35px rgba(0, 0, 0, 0.1)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.08)';
        });
    });
    
    const membres = document.querySelectorAll('.membre');
    membres.forEach(membre => {
        membre.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
        });
        
        membre.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
    
    // Icon hover effects
    const icons = document.querySelectorAll('.mission-icon, .valeur-icon, .stat i');
    icons.forEach(icon => {
        icon.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.1)';
        });
        
        icon.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    });
    
    // Image lazy loading
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.add('loaded');
                imageObserver.unobserve(img);
            }
        });
    }, { threshold: 0.1 });
    
    images.forEach(img => imageObserver.observe(img));
    
    // Add active class to current section in view
    function highlightCurrentSection() {
        const sections = document.querySelectorAll('section');
        const navLinks = document.querySelectorAll('.nav-link');
        
        let currentSection = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 200;
            const sectionHeight = section.clientHeight;
            const scrollPosition = window.pageYOffset;
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                currentSection = section.id;
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSection}`) {
                link.classList.add('active');
            }
        });
    }
    
    window.addEventListener('scroll', highlightCurrentSection);
    
   
    highlightCurrentSection();
});