// ========================================
// SONAR - Landing Page Script
// ========================================

// Toggle entre modo claro y oscuro
const themeToggle = document.getElementById('themeToggle');
const body = document.body;

// Cargar preferencia guardada al iniciar
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('theme') === 'dark') {
        body.classList.add('dark-mode');
        const icon = document.getElementById('themeIcon');
        if (icon) icon.src = 'https://cdn-icons-png.flaticon.com/128/547/547433.png';
    }
    initParticles();
    initCarousel();
    initScrollAnimations();
});

// Event listener para cambiar tema
if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        const icon = document.getElementById('themeIcon');
        if (body.classList.contains('dark-mode')) {
            if (icon) icon.src = 'https://cdn-icons-png.flaticon.com/128/547/547433.png';
            localStorage.setItem('theme', 'dark');
        } else {
            if (icon) icon.src = 'https://cdn-icons-png.flaticon.com/128/869/869869.png';
            localStorage.setItem('theme', 'light');
        }
    });
}

// ========================================
// NAVBAR - Aparece al hacer scroll
// ========================================
const navbar = document.getElementById('navbar');
if (navbar) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 80) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

// ========================================
// HAMBURGER MENU (móvil)
// ========================================
const hamburger = document.getElementById('hamburger');
const navLinks = document.querySelector('.nav-links');

if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('open');
    });

    // Cerrar menú al hacer clic en un enlace
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('open');
        });
    });
}

// ========================================
// PARTÍCULAS en el hero
// ========================================
function initParticles() {
    const container = document.getElementById('particles');
    if (!container) return;

    const count = 40;
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 6 + 's';
        particle.style.animationDuration = (4 + Math.random() * 4) + 's';
        particle.style.width = (2 + Math.random() * 4) + 'px';
        particle.style.height = particle.style.width;
        container.appendChild(particle);
    }
}

// ========================================
// CARRUSEL
// ========================================
function initCarousel() {
    const track = document.getElementById('carouselTrack');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const dotsContainer = document.getElementById('carouselDots');

    if (!track || !prevBtn || !nextBtn || !dotsContainer) return;

    const slides = track.querySelectorAll('.carousel-slide');
    const totalSlides = slides.length;
    let currentIndex = 0;
    let autoPlayInterval;

    // Crear dots
    slides.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.classList.add('carousel-dot');
        if (i === 0) dot.classList.add('active');
        dot.setAttribute('aria-label', `Ir a slide ${i + 1}`);
        dot.addEventListener('click', () => goToSlide(i));
        dotsContainer.appendChild(dot);
    });

    function goToSlide(index) {
        if (index < 0) index = totalSlides - 1;
        if (index >= totalSlides) index = 0;
        currentIndex = index;
        track.style.transform = `translateX(-${currentIndex * 100}%)`;
        updateDots();
    }

    function updateDots() {
        dotsContainer.querySelectorAll('.carousel-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === currentIndex);
        });
    }

    prevBtn.addEventListener('click', () => {
        goToSlide(currentIndex - 1);
        resetAutoPlay();
    });

    nextBtn.addEventListener('click', () => {
        goToSlide(currentIndex + 1);
        resetAutoPlay();
    });

    // Auto-play
    function startAutoPlay() {
        autoPlayInterval = setInterval(() => {
            goToSlide(currentIndex + 1);
        }, 5000);
    }

    function resetAutoPlay() {
        clearInterval(autoPlayInterval);
        startAutoPlay();
    }

    startAutoPlay();

    // Swipe en móvil
    let startX = 0;
    let endX = 0;

    track.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
    }, { passive: true });

    track.addEventListener('touchend', (e) => {
        endX = e.changedTouches[0].clientX;
        const diff = startX - endX;
        if (Math.abs(diff) > 50) {
            if (diff > 0) goToSlide(currentIndex + 1);
            else goToSlide(currentIndex - 1);
            resetAutoPlay();
        }
    }, { passive: true });
}

// ========================================
// SCROLL ANIMATIONS (Intersection Observer)
// ========================================
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('[data-aos], .timeline-item');

    if (!animatedElements.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Añadir delay escalonado para cards
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, index * 100);
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -60px 0px'
    });

    animatedElements.forEach(el => observer.observe(el));
}

// ========================================
// SMOOTH SCROLL para enlaces internos
// ========================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// Scroll indicator click
const scrollIndicator = document.getElementById('scrollIndicator');
if (scrollIndicator) {
    scrollIndicator.addEventListener('click', () => {
        const nextSection = document.querySelector('.carousel-section') || document.querySelector('.features-section');
        if (nextSection) {
            nextSection.scrollIntoView({ behavior: 'smooth' });
        }
    });
}

// ========================================
// AÑO ACTUAL en el footer
// ========================================
const yearSpan = document.getElementById('currentYear');
if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
}

// ========================================
// CONNEXIÓN BACKEND (existente)
// ========================================
async function comprobar() {
    try {
        console.log("Intentando conectar con el backend en 172.20.10.3...");
        const respuesta = await fetch('http://172.20.10.3:3000/test-conexion');
        if (respuesta.ok) {
            const datos = await respuesta.json();
            console.log("✅ RESPUESTA DEL BACKEND:", datos);
        } else {
            console.error("❌ El servidor respondió pero con error");
        }
    } catch (error) {
        console.error("❌ NO SE PUDO CONECTAR. Posibles causas:", error.message);
    }
}

comprobar();

async function verUsuariosEnConsola() {
    try {
        console.log("Solicitando usuarios a la base de datos de la VM...");
        const respuesta = await fetch('http://172.20.10.3:3000/usuarios');
        if (respuesta.ok) {
            const usuarios = await respuesta.json();
            console.log("✅ TABLA DE USUARIOS RECIBIDA:");
            console.table(usuarios);
        } else {
            console.error("❌ El servidor respondió, pero hubo un problema.");
        }
    } catch (error) {
        console.error("❌ Error de conexión al intentar obtener usuarios:", error);
    }
}

verUsuariosEnConsola();

// ========================================
// LOGIN (existente)
// ========================================
const loginUser = async (email, password) => {
    try {
        const response = await fetch('http://172.20.10.3:3000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ correu: email, contrasenya: password })
        });
        
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            throw new TypeError("El servidor no devolvió JSON");
        }

        const data = await response.json();

        if (response.ok) {
            console.log("Login correcto", data);
            localStorage.setItem('userName', data.user.nom);
            window.location.href = 'home.html';
        } else {
            console.error("Error en el login:", data.message);
            alert(`Error en el login: ${data.message || 'Credenciales incorrectas'}`);
        }
    } catch (error) {
        console.error("Error de conexión:", error);
        alert('No se pudo conectar con el servidor de Sonar. Revisa la IP o el Firewall.');
    }
};

const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        if (email && password) {
            await loginUser(email, password);
        } else {
            alert('Por favor, completa todos los campos');
        }
    });
}