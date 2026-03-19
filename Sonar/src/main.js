// ========================================
// SONAR - Script Unificado Profesional
// ========================================

const API_URL = 'http://172.20.10.3:3000';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicialización de UI y Animaciones
    initTheme();
    initParticles();
    initScrollAnimations();
    initNavbarScroll();
    
    // 2. Verificación de Seguridad (Protección de rutas)
    checkSession();

    // 3. Listeners de Formularios
    const registroForm = document.getElementById('registroForm');
    if (registroForm) {
        registroForm.addEventListener('submit', handleRegistro);
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // 4. Listener para Cerrar Sesión (Si existe el botón en la Home)
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // 5. Interacciones exclusivas de la Home
    initHomeInteractions();
});

// ========================================
// GESTIÓN DE SESIÓN (JWT)
// ========================================

// Función para comprobar si el usuario puede estar en la página actual
function checkSession() {
    const token = localStorage.getItem('sonar_token');
    const path = window.location.pathname;

    // Si intenta entrar a home sin token, fuera
    if (path.includes('home.html') && !token) {
        alert("Sessió no vàlida. Si us plau, identifica't.");
        window.location.href = 'index.html';
    }

    // Si ya tiene token e intenta ir al login/registro, lo mandamos a la home
    if ((path.includes('index.html') || path.includes('registro.html')) && token) {
        window.location.href = 'home.html';
    }

    // Si estamos en la home y hay usuario, pintamos el nombre
    if (path.includes('home.html') && token) {
        const nombre = localStorage.getItem('userName') || 'usuario';
        const saludo = document.getElementById('saludoUsuario');
        if (saludo) saludo.textContent = `Hola, ${nombre}!`;
    }
}

function logout() {
    localStorage.removeItem('sonar_token');
    localStorage.removeItem('userName');
    localStorage.removeItem('userAlias');
    window.location.href = 'index.html';
}

// ========================================
// LÓGICA DE REGISTRO
// ========================================
async function handleRegistro(e) {
    e.preventDefault();

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
            alert("✅ ¡Cuenta creada con éxito! Ya puedes iniciar sesión.");
            window.location.href = 'index.html'; 
        } else {
            alert("❌ Error: " + data.message);
        }
    } catch (error) {
        console.error("Error en el registro:", error);
        alert("No se pudo conectar con el servidor de Sonar.");
    }
}

// ========================================
// LÓGICA DE LOGIN (Con JWT)
// ========================================
async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginErrorMessage');

    if (errorDiv) {
        errorDiv.style.display = 'none';
        errorDiv.textContent = '';
    }

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correu: email, contrasenya: password })
        });

        const data = await response.json();

        if (response.ok) {
            console.log("✅ Login exitoso con JWT");
            
            // GUARDAMOS EL TOKEN Y DATOS
            localStorage.setItem('sonar_token', data.token); 
            localStorage.setItem('userName', data.user.nom);
            localStorage.setItem('userAlias', data.user.alias);
            
            window.location.href = 'home.html';
        } else {
            if (errorDiv) {
                errorDiv.textContent = data.message || "Correu o contrasenya incorrectes";
                errorDiv.style.display = 'block';
            }
        }
    } catch (error) {
        console.error("Error en el login:", error);
        if (errorDiv) {
            errorDiv.textContent = "Error de conexión con el servidor.";
            errorDiv.style.display = 'block';
        }
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

function initHomeInteractions() {
    const sidebar = document.getElementById('homeSidebar');
    const menuToggle = document.getElementById('homeMenuToggle');
    const starButton = document.getElementById('homeStarButton');
    const starPopup = document.getElementById('homeStarPopup');
    const starClose = document.getElementById('homeStarClose');

    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }

    if (starButton && starPopup) {
        starButton.addEventListener('click', () => {
            starPopup.classList.toggle('open');
        });
    }

    if (starClose && starPopup) {
        starClose.addEventListener('click', () => {
            starPopup.classList.remove('open');
        });
    }

    if (starPopup) {
        document.addEventListener('click', (event) => {
            const clickedInsidePopup = starPopup.contains(event.target);
            const clickedStarButton = starButton && starButton.contains(event.target);
            if (!clickedInsidePopup && !clickedStarButton) {
                starPopup.classList.remove('open');
            }
        });
    }
}