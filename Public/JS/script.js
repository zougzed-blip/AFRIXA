        const mobileToggle = document.getElementById('mobileToggle');
        const navLinks = document.getElementById('navLinks');
        const navbar = document.getElementById('navbar');

        mobileToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            mobileToggle.innerHTML = navLinks.classList.contains('active') 
                ? '✕' 
                : '☰';
        });

        document.querySelectorAll('.faq-question').forEach(question => {
            question.addEventListener('click', () => {
                const answer = question.nextElementSibling;
                const isActive = answer.classList.contains('active');
                const icon = question.querySelector('span');
                
                document.querySelectorAll('.faq-answer').forEach(item => {
                    item.classList.remove('active');
                });
                
                document.querySelectorAll('.faq-question span').forEach(item => {
                    item.innerHTML = '▼';
                });
 
                if (!isActive) {
                    answer.classList.add('active');
                    icon.innerHTML = '▲';
                }
            });
        });


        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                
                const targetId = this.getAttribute('href');
                if (targetId === '#') return;
                
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    navLinks.classList.remove('active');
                    mobileToggle.innerHTML = '☰';
                    
                    window.scrollTo({
                        top: targetElement.offsetTop - 80,
                        behavior: 'smooth'
                    });
                }
            });
        });

        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });