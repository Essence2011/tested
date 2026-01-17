// Firebase Configuration
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getDatabase, ref, push, set, get, onValue } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyBIhbURC0eBrpdZgdtwJUOfxmjuYf42Fl4",
    authDomain: "games-69738.firebaseapp.com",
    databaseURL: "https://games-69738-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "games-69738",
    storageBucket: "games-69738.firebasestorage.app",
    messagingSenderId: "212538189689",
    appId: "1:212538189689:web:81c0efbfcb2aaff6bb31a8",
    measurementId: "G-7DSV2P4BH2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Get visitor IP and info
async function getVisitorInfo() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        const ip = data.ip;
        
        // Get additional geo info
        const geoResponse = await fetch(`https://ipapi.co/${ip}/json/`);
        const geoData = await geoResponse.json();
        
        return {
            ip: ip,
            city: geoData.city || 'Unknown',
            country: geoData.country_name || 'Unknown',
            region: geoData.region || 'Unknown',
            timezone: geoData.timezone || 'Unknown'
        };
    } catch (error) {
        console.error('Error getting visitor info:', error);
        return {
            ip: 'Unknown',
            city: 'Unknown',
            country: 'Unknown',
            region: 'Unknown',
            timezone: 'Unknown'
        };
    }
}

// Track page visit
async function trackVisit() {
    const visitorInfo = await getVisitorInfo();
    const visitData = {
        page: window.location.pathname,
        timestamp: Date.now(),
        date: new Date().toISOString(),
        userAgent: navigator.userAgent,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        language: navigator.language,
        referrer: document.referrer || 'Direct',
        ...visitorInfo
    };
    
    try {
        const visitsRef = ref(database, 'visits');
        const newVisitRef = push(visitsRef);
        await set(newVisitRef, visitData);
        console.log('Visit tracked successfully');
    } catch (error) {
        console.error('Error tracking visit:', error);
    }
}

// Track visit on page load
if (!window.location.pathname.includes('admin.html')) {
    trackVisit();
}

// Mobile menu toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

if (hamburger) {
    hamburger.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        
        // Animate hamburger
        const spans = hamburger.querySelectorAll('span');
        if (navMenu.classList.contains('active')) {
            spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
            spans[1].style.opacity = '0';
            spans[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
        } else {
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
        }
    });
}

// Stats counter animation
function animateCounter(element) {
    const target = parseInt(element.getAttribute('data-target'));
    const duration = 2000;
    const increment = target / (duration / 16);
    let current = 0;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target + (element.parentElement.querySelector('.stat-label').textContent.includes('%') ? '%' : '+');
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
}

// Intersection Observer for animations
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            if (entry.target.classList.contains('stat-number')) {
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            }
            
            if (entry.target.classList.contains('feature-card')) {
                entry.target.style.opacity = '0';
                entry.target.style.transform = 'translateY(50px)';
                setTimeout(() => {
                    entry.target.style.transition = 'all 0.6s ease';
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, 100);
                observer.unobserve(entry.target);
            }
        }
    });
}, { threshold: 0.1 });

// Observe elements
document.querySelectorAll('.stat-number').forEach(stat => observer.observe(stat));
document.querySelectorAll('.feature-card').forEach(card => observer.observe(card));

// Smooth scroll
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

// Contact form submission
const contactForm = document.querySelector('.contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            name: contactForm.querySelector('[name="name"]').value,
            email: contactForm.querySelector('[name="email"]').value,
            subject: contactForm.querySelector('[name="subject"]').value,
            message: contactForm.querySelector('[name="message"]').value,
            timestamp: Date.now(),
            date: new Date().toISOString()
        };
        
        try {
            const messagesRef = ref(database, 'messages');
            const newMessageRef = push(messagesRef);
            await set(newMessageRef, formData);
            
            alert('Сообщение отправлено успешно!');
            contactForm.reset();
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Ошибка при отправке сообщения. Попробуйте позже.');
        }
    });
}

// Add parallax effect to hero
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero-bg');
    if (hero) {
        hero.style.transform = `translateY(${scrolled * 0.5}px)`;
    }
});

// Export for admin panel
export { database, ref, get, onValue };