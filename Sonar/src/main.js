// ========================================
// SONAR - Script de Registro y Animaciones
// ========================================

const API_URL = 'http://172.20.10.3:3000';

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initParticles();
    initScrollAnimations();
    initNavbarScroll();
    
    // Escuchar el envío del formulario de registro
    const registroForm = document.getElementById('registroForm');
    if (registroForm) {
        registroForm.addEventListener('submit', handleRegistro);
    }
});

// ========================================
// LÓGICA DE REGISTRO (CONEXIÓN BACKEND)
// ========================================

async function handleRegistro(e) {
    e.preventDefault();

    // Capturamos los datos usando los IDs del HTML
    const dadesUsuari = {
        alias: document.getElementById('alias').value,
        nom: document.getElementById('nombre').value,
        primer_cognom: document.getElementById('apellido1').value,
        segon_cognom: document.getElementById('apellido2').value,
        correu: document.getElementById('email').value,
        contrasenya: document.getElementById('password').value
    };

    try {
        const response = await fetch(`${API_URL}/registre`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadesUsuari)
        });

        const data = await response.json();

        if (response.ok) {
            alert("✅ ¡Cuenta creada con éxito! Redirigiendo al inicio...");
            window.location.href = 'index.html'; 
        } else {
            // Mostramos el mensaje de error que viene del backend (ej: correo duplicado)
            alert("❌ Error: " + data.message);
        }
    } catch (error) {
        console.error("Error en la conexión:", error);
        alert("No se pudo conectar con el servidor de Sonar. Verifica que el backend esté corriendo.");
    }
}

// ========================================
// ANIMACIONES Y UI
// ========================================

function initTheme() {
    const body = document.body;
    if (localStorage.getItem('theme') === 'dark') {
        body.classList.add('dark-mode');
    }
}

function initParticles() {
    const container = document.getElementById('particles');
    if (!container) return;

    for (let i = 0; i < 40; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 6 + 's';
        particle.style.width = (2 + Math.random() * 4) + 'px';
        particle.style.height = particle.style.width;
        container.appendChild(particle);
    }
}

function initNavbarScroll() {
    const navbar = document.getElementById('navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            window.scrollY > 80 ? navbar.classList.add('scrolled') : navbar.classList.remove('scrolled');
        });
    }
}

function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('[data-aos], .timeline-item, .login-container');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });
    animatedElements.forEach(el => observer.observe(el));
}
