// ========================================
// SONAR - Script Unificado Profesional
// ========================================

const API_URL = 'http://172.20.10.3:3000';
let isPlaylistPopoverDismissBound = false;
let isArtistAlbumPopoverDismissBound = false;
let globalPlayer = null;
let songInfoModal = null;
const globalPlayerState = {
    queue: [],
    index: -1,
    isPlaying: false,
    liked: 0,
    volume: 70
};

const SONG_INFO_CATALOG = {
    'neon nights|nova skies': { album: 'City Lights', genre: 'Synthwave', year: '2025', duration: '3:45', cover: 'https://picsum.photos/seed/neon-nights/240/240', plays: 1834200 },
    'pulse in motion|orbit kids': { album: 'Orbit One', genre: 'Electropop', year: '2024', duration: '3:22', cover: 'https://picsum.photos/seed/pulse-motion/240/240', plays: 960400 },
    'echoes of you|lumen duo': { album: 'Echoes', genre: 'Indie Pop', year: '2023', duration: '4:01', cover: 'https://picsum.photos/seed/echoes-you/240/240', plays: 2451000 },
    'night runner|croma wave': { album: 'After Dark', genre: 'Retrowave', year: '2025', duration: '3:58', cover: 'https://picsum.photos/seed/night-runner/240/240', plays: 715000 },
    'electric bloom|iris lane': { album: 'Bloom', genre: 'Alternative Pop', year: '2022', duration: '3:34', cover: 'https://picsum.photos/seed/electric-bloom/240/240', plays: 1327400 },
    'glass heartbeat|nura vox': { album: 'Crystal Signals', genre: 'Electronic', year: '2024', duration: '3:17', cover: 'https://picsum.photos/seed/glass-heartbeat/240/240', plays: 534900 },
    'last signal|aurora set': { album: 'Final Frequency', genre: 'Synth Pop', year: '2021', duration: '4:09', cover: 'https://picsum.photos/seed/last-signal/240/240', plays: 3012000 },
    'horizon flame|mira flux': { album: 'Horizon', genre: 'Dream Pop', year: '2020', duration: '3:41', cover: 'https://picsum.photos/seed/horizon-flame/240/240', plays: 887600 }
};

const ARTIST_PROFILE_CATALOG = {
    'nova skies': {
        started: 2018,
        city: 'Barcelona, ES',
        image: 'https://picsum.photos/seed/artist-nova-skies/560/560',
        bio: 'Proyecto synth-pop con enfoque cinematico y atmosferas nocturnas.'
    },
    'orbit kids': {
        started: 2017,
        city: 'Madrid, ES',
        image: 'https://picsum.photos/seed/artist-orbit-kids/560/560',
        bio: 'Duo electropop que combina ritmos de club con hooks luminosos.'
    },
    'lumen duo': {
        started: 2016,
        city: 'Valencia, ES',
        image: 'https://picsum.photos/seed/artist-lumen-duo/560/560',
        bio: 'Formacion indie-pop de texturas suaves, coros amplios y melodias emotivas.'
    },
    'croma wave': {
        started: 2019,
        city: 'Sevilla, ES',
        image: 'https://picsum.photos/seed/artist-croma-wave/560/560',
        bio: 'Productor retrowave con tintes ochenteros y lineas de bajo marcadas.'
    },
    'iris lane': {
        started: 2015,
        city: 'Bilbao, ES',
        image: 'https://picsum.photos/seed/artist-iris-lane/560/560',
        bio: 'Voz alternativa que mezcla pop moderno con arreglos electronicos finos.'
    },
    'nura vox': {
        started: 2020,
        city: 'Zaragoza, ES',
        image: 'https://picsum.photos/seed/artist-nura-vox/560/560',
        bio: 'Acto electronic con beats minimalistas, capas brillantes y enfoque vocal.'
    },
    'aurora set': {
        started: 2014,
        city: 'Malaga, ES',
        image: 'https://picsum.photos/seed/artist-aurora-set/560/560',
        bio: 'Banda synth-pop orientada a estribillos grandes y produccion elegante.'
    },
    'mira flux': {
        started: 2013,
        city: 'Alicante, ES',
        image: 'https://picsum.photos/seed/artist-mira-flux/560/560',
        bio: 'Proyecto dream-pop de enfoque atmosferico, tempos medios y texturas etereas.'
    }
};

const ARTIST_GENRE_OPTIONS = [
    { id: 1, name: 'Pop' },
    { id: 2, name: 'Synth Pop' },
    { id: 3, name: 'Electropop' },
    { id: 4, name: 'Electronic' },
    { id: 5, name: 'Indie Pop' },
    { id: 6, name: 'Alternative Pop' },
    { id: 7, name: 'Synthwave' },
    { id: 8, name: 'Retrowave' },
    { id: 9, name: 'Dream Pop' }
];

const ADMIN_DEFAULT_STATS = {
    users: { total: 1284, trend: '+12 esta semana' },
    artists: { total: 212, trend: '+6 este mes' },
    songs: { total: 8932, trend: '+248 hoy' },
    playlists: { total: 3410, trend: '+19 hoy' },
    updatedLabel: 'Actualizado hace 2 min',
    periodLabel: 'Ultimos 7 dias',
    topGenres: [
        { label: 'Pop', value: '2,190 canciones' },
        { label: 'Synth Pop', value: '1,842 canciones' },
        { label: 'Electronic', value: '1,415 canciones' },
        { label: 'Indie Pop', value: '1,172 canciones' },
        { label: 'Retrowave', value: '986 canciones' }
    ],
    topArtists: [
        { label: 'Nova Skies', value: '5.2M plays' },
        { label: 'Lumen Duo', value: '4.9M plays' },
        { label: 'Aurora Set', value: '4.1M plays' },
        { label: 'Orbit Kids', value: '3.6M plays' },
        { label: 'Mira Flux', value: '3.2M plays' }
    ],
    moderation: [
        { label: 'Canciones publicadas', value: '8,320' },
        { label: 'Pendientes de revision', value: '84' },
        { label: 'Reportes abiertos', value: '37' },
        { label: 'Bloqueos recientes', value: '6' }
    ]
};

document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const isLoginPage = body.classList.contains('login-page');
    const isRegisterPage = body.classList.contains('register-page');
    const isArtistHomePage = body.classList.contains('home-artista-page');
    const isArtistSongPage = body.classList.contains('artist-song-page');
    const isArtistAlbumPage = body.classList.contains('artist-album-page');
    const isAdminPage = body.classList.contains('admin-page');
    const isHomePage = body.classList.contains('home-page') && !isArtistHomePage && !isArtistSongPage && !body.classList.contains('save-page') && !body.classList.contains('playlist-page') && !body.classList.contains('perfil-page') && !body.classList.contains('buscar-page') && !body.classList.contains('artist-page');
    const isSongLibraryPage = (body.classList.contains('home-page') && !isArtistHomePage && !isArtistSongPage) || body.classList.contains('save-page') || body.classList.contains('playlist-page') || body.classList.contains('buscar-page') || body.classList.contains('artist-page');

    // 1. Inicialización de UI y Animaciones
    initTheme();
    initParticles();
    initScrollAnimations();
    initNavbarScroll();
    
    // 2. Verificación de Seguridad (Protección de rutas)
    checkSession();

    // 2.5. Scroll Indicator
    const scrollIndicator = document.getElementById('scrollIndicator');
    if (scrollIndicator) {
        scrollIndicator.addEventListener('click', () => {
            const caracteristicas = document.getElementById('caracteristicas');
            if (caracteristicas) {
                caracteristicas.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    // 3. Listeners de Formularios
    const registroForm = document.getElementById('registroForm');
    if (registroForm) {
        registroForm.addEventListener('submit', handleRegistro);
    }

    const registroArtistaForm = document.getElementById('registroArtistaForm');
    if (registroArtistaForm) {
        registroArtistaForm.addEventListener('submit', handleRegistroArtista);
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

    if (isHomePage || isArtistHomePage || isArtistSongPage || isArtistAlbumPage || isAdminPage || body.classList.contains('save-page') || body.classList.contains('playlist-page') || body.classList.contains('perfil-page')) {
        initHomeInteractions();
    }

    if (body.classList.contains('buscar-page')) {
        initBuscarInteractions();
    }

    if (body.classList.contains('artist-page')) {
        initArtistPage();
    }

    if (isSongLibraryPage) {
        initPlaylistQuickSave();
        initSongCardVisuals();
        initSongCardPlayback();
    }

    if (body.classList.contains('playlist-page')) {
        initPlaylistPage();
    }

    if (body.classList.contains('save-page')) {
        initSavedSongsPage();
    }

    if (isArtistHomePage) {
        initArtistHomeSongs();
    }

    if (isArtistSongPage) {
        initArtistSongPage();
    }

    if (isArtistAlbumPage) {
        initArtistAlbumPage();
    }

    if (isAdminPage) {
        initAdminDashboard();
    }

    if (isSongLibraryPage && !isLoginPage && !isRegisterPage) {
        initGlobalPlayerBar();
    }
});

// ========================================
// GESTIÓN DE SESIÓN (JWT)
// ========================================

// Función para comprobar si el usuario puede estar en la página actual
function checkSession() {
    const token = localStorage.getItem('sonar_token');
    const path = window.location.pathname;

    // Si intenta entrar a una home sin token, fuera
    if ((path.includes('home.html') || path.includes('home_artista.html') || path.includes('admin_site.html')) && !token) {
        alert("Sessió no vàlida. Si us plau, identifica't.");
        window.location.href = 'index.html';
    }

    // Si ya tiene token e intenta ir al login/registro, lo mandamos a la home
    if (
        (
            path.includes('index.html') ||
            path.includes('login.html') ||
            path.includes('registro.html') ||
            path.includes('registro_usuario.html') ||
            path.includes('registro_artista.html')
        ) && token
    ) {
        window.location.href = resolveAuthRedirect({}, '/home.html');
    }

    // Si estamos en alguna home y hay usuario, pintamos el nombre
    if ((path.includes('home.html') || path.includes('home_artista.html')) && token) {
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

function storeAuthSession(data) {
    if (!data) return;

    if (data.token) {
        localStorage.setItem('sonar_token', data.token);
        localStorage.setItem('token', data.token);
    }

    if (data.user?.nom) {
        localStorage.setItem('userName', data.user.nom);
    }

    if (data.user?.alias) {
        localStorage.setItem('userAlias', data.user.alias);
    }

    if (data.user?.tipus) {
        localStorage.setItem('userType', data.user.tipus);
    }
}

function resolveAuthRedirect(data, fallbackPath = '/home.html') {
    if (typeof data?.redirect === 'string' && data.redirect.trim()) {
        return data.redirect;
    }

    const userType = data?.user?.tipus || localStorage.getItem('userType');
    if (userType === 'artista') {
        return '/artista/home_artista.html';
    }

    return fallbackPath;
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

        const data = await response.json().catch(() => ({}));

        if (response.ok) {
            if (data.token || data.user) {
                storeAuthSession(data);
                window.location.replace(resolveAuthRedirect(data, '/home.html'));
                return;
            }

            const loginResponse = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ correu: dadesUsuari.correu, contrasenya: dadesUsuari.contrasenya })
            });

            const loginData = await loginResponse.json().catch(() => ({}));

            if (loginResponse.ok) {
                storeAuthSession(loginData);
                window.location.replace(resolveAuthRedirect(loginData, '/home.html'));
                return;
            }

            alert("✅ ¡Cuenta creada con éxito! Ya puedes iniciar sesión.");
            window.location.replace('/login.html?registro=ok');
        } else {
            alert("❌ Error: " + data.message);
        }
    } catch (error) {
        console.error("Error en el registro:", error);
        alert("No se pudo conectar con el servidor de Sonar.");
    }
}

async function handleRegistroArtista(e) {
    e.preventDefault();

    const artistaData = {
        nom: document.getElementById('artistaNombre').value,
        correu: document.getElementById('artistaEmail').value,
        contrasenya: document.getElementById('artistaPassword').value,
        imatge_perfil: document.getElementById('artistaImagen').value
    };

    try {
        const response = await fetch(`${API_URL}/registre-artista`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(artistaData)
        });

        const data = await response.json().catch(() => ({}));

        if (response.ok) {
            if (data.token || data.user) {
                storeAuthSession(data);
                window.location.replace(resolveAuthRedirect(data, '/home_artista.html'));
                return;
            }

            const loginResponse = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ correu: artistaData.correu, contrasenya: artistaData.contrasenya })
            });

            const loginData = await loginResponse.json().catch(() => ({}));

            if (loginResponse.ok) {
                storeAuthSession(loginData);
                window.location.replace(resolveAuthRedirect(loginData, '/home_artista.html'));
                return;
            }

            alert('✅ Cuenta de artista creada. Ahora puedes iniciar sesión.');
            window.location.replace('/login.html?registro=ok');
        } else {
            alert('❌ Error: ' + (data.message || 'No se pudo crear la cuenta de artista.'));
        }
    } catch (error) {
        console.error('Error en el registro de artista:', error);
        alert('No se pudo conectar con el servidor de Sonar.');
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

        if (response.ok && data.success !== false) {
            console.log("✅ Login exitoso con JWT");

            storeAuthSession(data);

            window.location.replace(resolveAuthRedirect(data, '/home.html'));
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
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    const SUN_ICON = 'https://cdn-icons-png.flaticon.com/128/869/869869.png';
    const MOON_ICON = 'https://cdn-icons-png.flaticon.com/128/581/581601.png';

    const applyTheme = (theme) => {
        const isDark = theme === 'dark';
        body.classList.toggle('dark-mode', isDark);

        if (themeIcon) {
            // Sol en modo oscuro para volver a claro, luna en modo claro para pasar a oscuro.
            themeIcon.src = isDark ? SUN_ICON : MOON_ICON;
            themeIcon.alt = isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro';
            themeIcon.title = isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro';
        }
    };

    const storedTheme = localStorage.getItem('theme') === 'dark' ? 'dark' : 'light';
    applyTheme(storedTheme);

    if (!themeToggle) return;

    themeToggle.addEventListener('click', () => {
        const nextTheme = body.classList.contains('dark-mode') ? 'light' : 'dark';
        localStorage.setItem('theme', nextTheme);
        applyTheme(nextTheme);
    });
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

function getCurrentArtistId() {
    const fromStorage = Number.parseInt(localStorage.getItem('artistId') || localStorage.getItem('userId') || '0', 10);
    if (Number.isFinite(fromStorage) && fromStorage > 0) return fromStorage;

    const alias = localStorage.getItem('userAlias') || localStorage.getItem('userName') || 'artist';
    let hash = 0;
    for (let i = 0; i < alias.length; i++) {
        hash = ((hash << 5) - hash) + alias.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash) + 1;
}

function getArtistSongsStore() {
    try {
        const parsed = JSON.parse(localStorage.getItem('sonar_artist_songs') || '[]');
        if (Array.isArray(parsed)) return parsed;
    } catch (error) {
        console.warn('No se pudo leer el listado de canciones del artista.', error);
    }
    return [];
}

function saveArtistSongsStore(songs) {
    localStorage.setItem('sonar_artist_songs', JSON.stringify(Array.isArray(songs) ? songs : []));
}

function getArtistAlbumsStore() {
    try {
        const parsed = JSON.parse(localStorage.getItem('sonar_artist_albums') || '[]');
        if (Array.isArray(parsed)) return parsed;
    } catch (error) {
        console.warn('No se pudo leer el listado de albumes del artista.', error);
    }
    return [];
}

function saveArtistAlbumsStore(albums) {
    localStorage.setItem('sonar_artist_albums', JSON.stringify(Array.isArray(albums) ? albums : []));
}

function getArtistAlbums() {
    const artistId = getCurrentArtistId();
    return getArtistAlbumsStore()
        .filter((album) => Number(album.id_artista) === artistId)
        .map((album) => ({
            id_album: Number(album.id_album) || 0,
            id_artista: artistId,
            nom: album.nom || 'Album',
            imagen: album.imagen || ''
        }))
        .filter((album) => album.id_album > 0);
}

function createArtistAlbum(albumData) {
    const name = (albumData?.nom || '').trim();
    if (!name) {
        return { ok: false, reason: 'name-required' };
    }

    const artistId = getCurrentArtistId();
    const store = getArtistAlbumsStore();
    const exists = store.find((album) => Number(album.id_artista) === artistId && (album.nom || '').trim().toLowerCase() === name.toLowerCase());
    if (exists) {
        return { ok: false, reason: 'duplicate', album: exists };
    }

    const nextId = store.reduce((maxId, item) => Math.max(maxId, Number(item.id_album) || 0), 0) + 1;
    const newAlbum = {
        id_album: nextId,
        id_artista: artistId,
        nom: name,
        imagen: (albumData?.imagen || '').trim()
    };

    store.push(newAlbum);
    saveArtistAlbumsStore(store);
    return { ok: true, album: newAlbum };
}

function getArtistAlbumSongsStore() {
    try {
        const parsed = JSON.parse(localStorage.getItem('sonar_artist_album_songs') || '{}');
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
    } catch (error) {
        console.warn('No se pudo leer la relacion album-cancion.', error);
    }
    return {};
}

function saveArtistAlbumSongsStore(map) {
    const safeMap = map && typeof map === 'object' ? map : {};
    localStorage.setItem('sonar_artist_album_songs', JSON.stringify(safeMap));
}

function getArtistAlbumSongIds(albumId) {
    const store = getArtistAlbumSongsStore();
    const key = String(albumId);
    const ids = Array.isArray(store[key]) ? store[key] : [];
    return ids.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0);
}

function getArtistAlbumSongs(albumId) {
    const idSet = new Set(getArtistAlbumSongIds(albumId));
    return getArtistSongs().filter((song) => idSet.has(Number(song.id_canco)));
}

function addSongToArtistAlbum(albumId, songId) {
    const safeAlbumId = Number(albumId);
    const safeSongId = Number(songId);
    if (!Number.isFinite(safeAlbumId) || !Number.isFinite(safeSongId)) {
        return { ok: false, reason: 'invalid-data' };
    }

    const albumExists = getArtistAlbums().some((album) => Number(album.id_album) === safeAlbumId);
    if (!albumExists) {
        return { ok: false, reason: 'album-not-found' };
    }

    const songExists = getArtistSongs().some((song) => Number(song.id_canco) === safeSongId);
    if (!songExists) {
        return { ok: false, reason: 'song-not-found' };
    }

    const store = getArtistAlbumSongsStore();
    const key = String(safeAlbumId);
    const ids = Array.isArray(store[key]) ? store[key].map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0) : [];

    if (ids.includes(safeSongId)) {
        return { ok: false, reason: 'duplicate' };
    }

    ids.push(safeSongId);
    store[key] = ids;
    saveArtistAlbumSongsStore(store);
    return { ok: true };
}

function getArtistGenreName(genreId) {
    const safeId = Number(genreId);
    const genre = ARTIST_GENRE_OPTIONS.find((item) => item.id === safeId);
    return genre ? genre.name : 'N/D';
}

function fillArtistGenreSelect(selectElement) {
    if (!selectElement) return;

    const currentValue = selectElement.value;
    const options = ['<option value="">Selecciona un genero</option>'];
    ARTIST_GENRE_OPTIONS.forEach((genre) => {
        options.push(`<option value="${genre.id}">${genre.name}</option>`);
    });

    selectElement.innerHTML = options.join('');
    if (currentValue) {
        selectElement.value = currentValue;
    }
}

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            resolve('');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
        reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
        reader.readAsDataURL(file);
    });
}

function getAuthToken() {
    return localStorage.getItem('token') || localStorage.getItem('sonar_token') || '';
}

async function uploadArtistSongToApi({ nom, genereNom, audioFile, imageFile }) {
    const token = getAuthToken();
    if (!token) {
        throw new Error('No hay sesion activa. Inicia sesion de nuevo.');
    }

    const formData = new FormData();
    formData.append('nom', nom);
    formData.append('genere_nom', genereNom);
    formData.append('arxiu_bin', audioFile);
    formData.append('imatge_bin', imageFile);

    const response = await fetch(`${API_URL}/pujar-canco`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`
        },
        body: formData
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.success === false) {
        const message = data.message || 'No se pudo subir la cancion al servidor.';
        throw new Error(message);
    }

    return data;
}

function getArtistSongs() {
    const artistId = getCurrentArtistId();
    return getArtistSongsStore()
        .filter((song) => Number(song.id_artista) === artistId)
        .map((song) => ({
            id_canco: Number(song.id_canco) || Date.now(),
            nom: song.nom || 'Cancion',
            id_artista: artistId,
            imagen: song.imagen || '',
            audio_src: song.audio_src || '',
            audio_name: song.audio_name || '',
            duration: Number(song.duration) || 0,
            id_genere: Number(song.id_genere) || 0,
            genre_name: song.genre_name || getArtistGenreName(song.id_genere),
            views: Number(song.views || song.visualitzacions) || 0
        }));
}

function createArtistSong(songData) {
    const store = getArtistSongsStore();
    const nextId = store.reduce((maxId, item) => Math.max(maxId, Number(item.id_canco) || 0), 0) + 1;
    const songId = Number(songData.id_canco) || nextId;

    const newSong = {
        id_canco: songId,
        nom: songData.nom,
        id_artista: getCurrentArtistId(),
        imagen: songData.imagen || '',
        audio_src: songData.audio_src || '',
        audio_name: songData.audio_name || '',
        duration: Number(songData.duration) || 0,
        id_genere: Number(songData.id_genere) || 0,
        genre_name: songData.genre_name || getArtistGenreName(songData.id_genere),
        views: Number(songData.views) || 0
    };

    store.push(newSong);
    saveArtistSongsStore(store);
    return newSong;
}

function formatArtistDuration(seconds) {
    const total = Number(seconds);
    if (!Number.isFinite(total) || total <= 0) return 'N/D';
    const mins = Math.floor(total / 60);
    const secs = String(total % 60).padStart(2, '0');
    return `${mins}:${secs}`;
}

function renderArtistSongCard(song) {
    return `
        <article class="song-card" data-song-id="${song.id_canco}" data-song="${song.nom}" data-artist="${localStorage.getItem('userName') || 'Artista'}" data-cover="${song.imagen || ''}">
            <div class="song-cover" aria-hidden="true">Portada</div>
            <h3>${song.nom}</h3>
            <p class="song-artist">Views: ${formatPlayCount(song.views)}</p>
            <div class="playlist-card-meta">Duracion: ${formatArtistDuration(song.duration)} • Genero: ${song.genre_name || getArtistGenreName(song.id_genere)}</div>
            <div class="playlist-card-preview">MP3: ${song.audio_name || 'Sin archivo'} • ID cancion: ${song.id_canco}</div>
            <div class="song-actions artist-song-actions" aria-label="Acciones de la cancion">
                <button type="button" class="song-action-btn artist-song-album-btn" data-song-id="${song.id_canco}" aria-label="Anadir a album">+</button>
            </div>
        </article>
    `;
}

function initArtistHomeSongs() {
    const empty = document.getElementById('artistSongsEmpty');
    const addWrap = document.getElementById('artistAddSongWrap');
    const wrap = document.getElementById('artistSongsWrap');
    const grid = document.getElementById('artistSongsGrid');
    const ranking = document.getElementById('artistViewsRanking');
    const rankingPanel = ranking ? ranking.closest('aside') : null;

    if (!empty || !addWrap || !wrap || !grid || !ranking) return;

    const songs = getArtistSongs().sort((a, b) => b.views - a.views);

    if (songs.length === 0) {
        empty.hidden = false;
        addWrap.hidden = false;
        wrap.hidden = true;
        if (rankingPanel) rankingPanel.hidden = true;
        grid.innerHTML = '';
        ranking.innerHTML = '';
        return;
    }

    empty.hidden = true;
    addWrap.hidden = true;
    wrap.hidden = false;
    if (rankingPanel) rankingPanel.hidden = false;

    grid.innerHTML = songs.map(renderArtistSongCard).join('');
    ranking.innerHTML = songs
        .map((song, index) => `<li><span>${index + 1}. ${song.nom}</span><strong>${formatPlayCount(song.views)}</strong></li>`)
        .join('');

    initSongCardVisuals(grid);
    initArtistSongAlbumActions(grid);
}

function createArtistAlbumPopover() {
    let popover = document.getElementById('artistAlbumPopover');
    if (popover) return popover;

    popover = document.createElement('div');
    popover.id = 'artistAlbumPopover';
    popover.className = 'artist-album-popover';
    popover.hidden = true;
    document.body.appendChild(popover);
    return popover;
}

function closeArtistAlbumPopover() {
    const popover = document.getElementById('artistAlbumPopover');
    if (!popover) return;
    popover.hidden = true;
}

function initArtistAlbumPopoverDismiss() {
    if (isArtistAlbumPopoverDismissBound) return;
    isArtistAlbumPopoverDismissBound = true;

    window.addEventListener('resize', () => {
        closeArtistAlbumPopover();
    });

    document.addEventListener('click', (event) => {
        const popover = document.getElementById('artistAlbumPopover');
        if (!popover || popover.hidden) return;

        const clickedPopover = popover.contains(event.target);
        const clickedTrigger = event.target.closest('.artist-song-album-btn');
        if (!clickedPopover && !clickedTrigger) {
            closeArtistAlbumPopover();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeArtistAlbumPopover();
        }
    });
}

function showArtistAlbumFeedback(popover, message) {
    const feedback = popover.querySelector('#artistAlbumPopoverFeedback');
    if (!feedback) return;
    feedback.textContent = message;
}

function openArtistAlbumPopover(anchorElement, songId) {
    const popover = createArtistAlbumPopover();
    initArtistAlbumPopoverDismiss();

    const albums = getArtistAlbums();
    popover.innerHTML = '';

    const title = document.createElement('p');
    title.className = 'artist-album-popover-title';
    title.textContent = 'Anadir cancion a album';
    popover.appendChild(title);

    if (albums.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'artist-album-popover-empty';
        empty.textContent = 'Primero crea un album para poder anadir canciones.';
        popover.appendChild(empty);

        const goCreate = document.createElement('a');
        goCreate.className = 'artist-album-popover-create';
        goCreate.href = '/artista/album_artista.html';
        goCreate.textContent = 'Ir a crear album';
        popover.appendChild(goCreate);
    } else {
        const list = document.createElement('div');
        list.className = 'artist-album-popover-list';

        albums.forEach((album) => {
            const option = document.createElement('button');
            option.type = 'button';
            option.className = 'artist-album-popover-option';
            option.textContent = album.nom;
            option.addEventListener('click', () => {
                const result = addSongToArtistAlbum(album.id_album, songId);
                if (result.ok) {
                    showArtistAlbumFeedback(popover, `Cancion anadida a ${album.nom}.`);
                    setTimeout(closeArtistAlbumPopover, 650);
                    return;
                }

                if (result.reason === 'duplicate') {
                    showArtistAlbumFeedback(popover, 'Esta cancion ya esta en ese album.');
                    return;
                }

                showArtistAlbumFeedback(popover, 'No se pudo anadir la cancion al album.');
            });
            list.appendChild(option);
        });

        popover.appendChild(list);

        const feedback = document.createElement('p');
        feedback.className = 'artist-album-popover-feedback';
        feedback.id = 'artistAlbumPopoverFeedback';
        popover.appendChild(feedback);
    }

    const rect = anchorElement.getBoundingClientRect();

    popover.hidden = false;
    popover.style.visibility = 'hidden';

    const popoverWidth = popover.offsetWidth || 265;
    const popoverHeight = popover.offsetHeight || 220;
    const margin = 10;

    let left = window.scrollX + rect.left - ((popoverWidth - rect.width) / 2);
    const minLeft = window.scrollX + 8;
    const maxLeft = window.scrollX + window.innerWidth - popoverWidth - 8;
    left = Math.min(Math.max(left, minLeft), Math.max(minLeft, maxLeft));

    let top = window.scrollY + rect.top - popoverHeight - margin;
    const minTop = window.scrollY + 8;
    if (top < minTop) {
        top = window.scrollY + rect.bottom + margin;
    }

    popover.style.left = `${left}px`;
    popover.style.top = `${top}px`;
    popover.style.visibility = 'visible';
}

function initArtistSongAlbumActions(root = document) {
    const buttons = Array.from(root.querySelectorAll('.artist-song-album-btn'));
    if (buttons.length === 0) return;

    buttons.forEach((button) => {
        if (button.dataset.albumBound === 'true') return;
        button.dataset.albumBound = 'true';

        button.addEventListener('click', (event) => {
            event.stopPropagation();
            const songId = Number.parseInt(button.dataset.songId || '0', 10);
            if (!Number.isFinite(songId) || songId <= 0) return;
            openArtistAlbumPopover(button, songId);
        });
    });
}

function renderArtistAlbumCard(album) {
    const songs = getArtistAlbumSongs(album.id_album);
    const coverFromSongs = songs.find((song) => song.imagen)?.imagen || '';
    const cover = album.imagen || coverFromSongs || `https://picsum.photos/seed/artist-album-${album.id_album}/420/420`;
    const preview = songs.slice(0, 3).map((song) => song.nom).join(' • ');

    return `
        <article class="artist-album-card" aria-label="Album ${album.nom}">
            <div class="artist-album-cover" aria-hidden="true">
                <img src="${cover}" alt="Portada del album ${album.nom}">
            </div>
            <h3>${album.nom}</h3>
            <p class="artist-album-meta">${songs.length} cancion${songs.length === 1 ? '' : 'es'}</p>
            <p class="artist-album-preview">${preview || 'Aun no tiene canciones asignadas.'}</p>
        </article>
    `;
}

function initArtistAlbumPage() {
    const grid = document.getElementById('artistAlbumGrid');
    const createCard = document.getElementById('artistCreateAlbumCard');
    const badge = document.getElementById('artistAlbumCountBadge');
    const formSection = document.getElementById('artistAlbumFormSection');
    const form = document.getElementById('artistAlbumForm');
    const formFeedback = document.getElementById('artistAlbumFormFeedback');
    const cancelBtn = document.getElementById('artistAlbumCancelBtn');
    const empty = document.getElementById('artistAlbumEmpty');

    if (!grid || !createCard || !badge || !formSection || !form || !formFeedback || !cancelBtn || !empty) return;

    const showForm = () => {
        formFeedback.textContent = '';
        formSection.hidden = false;
        formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const hideForm = () => {
        form.reset();
        formFeedback.textContent = '';
        formSection.hidden = true;
    };

    const renderAlbums = () => {
        const existingCards = Array.from(grid.querySelectorAll('.artist-album-card'));
        existingCards.forEach((card) => card.remove());

        const albums = getArtistAlbums().sort((a, b) => Number(b.id_album) - Number(a.id_album));
        albums.forEach((album) => {
            createCard.insertAdjacentHTML('beforebegin', renderArtistAlbumCard(album));
        });

        badge.textContent = `${albums.length} album${albums.length === 1 ? '' : 'es'}`;
        empty.hidden = albums.length > 0;
    };

    createCard.addEventListener('click', showForm);
    cancelBtn.addEventListener('click', hideForm);

    form.addEventListener('submit', (event) => {
        event.preventDefault();

        const data = {
            nom: document.getElementById('albumName')?.value?.trim() || '',
            imagen: document.getElementById('albumImagen')?.value?.trim() || ''
        };

        const result = createArtistAlbum(data);
        if (!result.ok) {
            if (result.reason === 'name-required') {
                formFeedback.textContent = 'El nombre del album es obligatorio.';
                return;
            }

            if (result.reason === 'duplicate') {
                formFeedback.textContent = 'Ya tienes un album con ese nombre.';
                return;
            }

            formFeedback.textContent = 'No se pudo crear el album.';
            return;
        }

        formFeedback.textContent = 'Album creado correctamente.';
        hideForm();
        renderAlbums();
    });

    renderAlbums();
}

function initArtistSongPage() {
    const formSection = document.getElementById('artistSongFormSection');
    const form = document.getElementById('artistSongForm');
    const feedback = document.getElementById('artistSongFormFeedback');
    const empty = document.getElementById('artistSongListEmpty');
    const showFormBtn = document.getElementById('artistShowFormBtn');
    const cancelFormBtn = document.getElementById('artistCancelFormBtn');
    const grid = document.getElementById('artistSongListGrid');
    const badge = document.getElementById('artistSongCountBadge');
    const genreSelect = document.getElementById('songGenero');
    const imageInput = document.getElementById('songImagen');
    const audioInput = document.getElementById('songAudio');

    if (!formSection || !form || !feedback || !empty || !showFormBtn || !cancelFormBtn || !grid || !badge || !genreSelect || !imageInput || !audioInput) return;

    fillArtistGenreSelect(genreSelect);

    const showCreateForm = () => {
        feedback.textContent = '';
        formSection.hidden = false;
        formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const closeCreateForm = () => {
        form.reset();
        fillArtistGenreSelect(genreSelect);
        feedback.textContent = '';
        formSection.hidden = true;
    };

    const renderList = () => {
        const songs = getArtistSongs().sort((a, b) => b.views - a.views);

        badge.textContent = `${songs.length} cancion${songs.length === 1 ? '' : 'es'}`;

        if (songs.length === 0) {
            empty.hidden = false;
            grid.hidden = true;
            grid.innerHTML = '';
            return;
        }

        empty.hidden = true;
        grid.hidden = false;
        grid.innerHTML = songs.map(renderArtistSongCard).join('');
        initSongCardVisuals(grid);
        initArtistSongAlbumActions(grid);
    };

    showFormBtn.addEventListener('click', showCreateForm);
    cancelFormBtn.addEventListener('click', closeCreateForm);

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const imageFile = imageInput.files && imageInput.files[0] ? imageInput.files[0] : null;
        const audioFile = audioInput.files && audioInput.files[0] ? audioInput.files[0] : null;
        const genreId = Number.parseInt(genreSelect.value || '0', 10);

        if (!Number.isFinite(genreId) || genreId <= 0) {
            feedback.textContent = 'Debes seleccionar un genero valido.';
            return;
        }

        if (!imageFile) {
            feedback.textContent = 'Debes anadir una imagen desde tu equipo.';
            return;
        }

        if (!audioFile) {
            feedback.textContent = 'Debes anadir un archivo MP3 desde tu equipo.';
            return;
        }

        if (audioFile.type && audioFile.type !== 'audio/mpeg') {
            feedback.textContent = 'El archivo de audio debe ser MP3.';
            return;
        }

        const songName = document.getElementById('songName').value.trim();
        if (!songName) {
            feedback.textContent = 'El nombre de la cancion es obligatorio.';
            return;
        }

        const genreName = getArtistGenreName(genreId);

        feedback.textContent = 'Subiendo cancion...';

        try {
            const uploadResult = await uploadArtistSongToApi({
                nom: songName,
                genereNom: genreName,
                audioFile,
                imageFile
            });

            const imageDataURL = await readFileAsDataURL(imageFile);

            const songData = {
                id_canco: Number(uploadResult.id_canco) || undefined,
                nom: songName,
                duration: 0,
                id_genere: genreId,
                genre_name: genreName,
                imagen: imageDataURL,
                audio_src: '',
                audio_name: audioFile.name || '',
                views: 0
            };

            createArtistSong(songData);
            feedback.textContent = uploadResult.message || 'Cancion creada correctamente.';
            form.reset();
            fillArtistGenreSelect(genreSelect);
            formSection.hidden = true;
            renderList();
        } catch (error) {
            console.error('Error al subir la cancion del artista:', error);
            feedback.textContent = error.message || 'No se pudo subir la cancion al servidor.';
        }
    });

    renderList();
}

function initAdminDashboard() {
    const setText = (id, value) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    };

    const renderList = (id, items) => {
        const list = document.getElementById(id);
        if (!list) return;
        list.innerHTML = (items || [])
            .map((item) => `<li><span>${item.label}</span><strong>${item.value}</strong></li>`)
            .join('');
    };

    setText('adminTotalUsers', formatPlayCount(Number(ADMIN_DEFAULT_STATS.users.total) || 0));
    setText('adminUsersTrend', ADMIN_DEFAULT_STATS.users.trend);
    setText('adminTotalArtists', formatPlayCount(Number(ADMIN_DEFAULT_STATS.artists.total) || 0));
    setText('adminArtistsTrend', ADMIN_DEFAULT_STATS.artists.trend);
    setText('adminTotalSongs', formatPlayCount(Number(ADMIN_DEFAULT_STATS.songs.total) || 0));
    setText('adminSongsTrend', ADMIN_DEFAULT_STATS.songs.trend);
    setText('adminTotalPlaylists', formatPlayCount(Number(ADMIN_DEFAULT_STATS.playlists.total) || 0));
    setText('adminPlaylistsTrend', ADMIN_DEFAULT_STATS.playlists.trend);
    setText('adminStatsUpdated', ADMIN_DEFAULT_STATS.updatedLabel);
    setText('adminPeriodBadge', ADMIN_DEFAULT_STATS.periodLabel);

    renderList('adminTopGenres', ADMIN_DEFAULT_STATS.topGenres);
    renderList('adminTopArtists', ADMIN_DEFAULT_STATS.topArtists);
    renderList('adminModerationStats', ADMIN_DEFAULT_STATS.moderation);
}

function normalizeSearchText(value) {
    return (value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

function toDisplayName(value) {
    return (value || '')
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function initBuscarInteractions() {
    const searchInput = document.getElementById('buscarInput');
    const searchType = document.getElementById('buscarTipo');
    const cards = Array.from(document.querySelectorAll('.buscar-song-card'));
    const searchCount = document.getElementById('searchCount');
    const emptyState = document.getElementById('buscarNoResultados');

    if (!searchInput || !searchType || cards.length === 0) return;

    const runFilter = () => {
        const term = normalizeSearchText(searchInput.value.trim());
        const type = searchType.value;
        let visibleCount = 0;

        cards.forEach((card) => {
            const song = normalizeSearchText(card.dataset.song);
            const artist = normalizeSearchText(card.dataset.artist);

            let match = true;
            if (term) {
                if (type === 'cancion') match = song.includes(term);
                else if (type === 'artista') match = artist.includes(term);
                else match = song.includes(term) || artist.includes(term);
            }

            card.style.display = match ? '' : 'none';
            if (match) visibleCount++;
        });

        if (searchCount) {
            searchCount.textContent = `${visibleCount} resultado${visibleCount === 1 ? '' : 's'}`;
        }

        if (emptyState) {
            emptyState.hidden = visibleCount !== 0;
        }
    };

    searchInput.addEventListener('input', runFilter);
    searchType.addEventListener('change', runFilter);
    runFilter();
}

function formatCompactCount(value) {
    if (!Number.isFinite(value)) return 'N/D';
    return new Intl.NumberFormat('es-ES', {
        notation: 'compact',
        maximumFractionDigits: 1
    }).format(value);
}

function parseDurationToSeconds(durationText) {
    const parts = String(durationText || '').split(':').map((value) => Number.parseInt(value, 10));
    if (parts.length !== 2 || !Number.isFinite(parts[0]) || !Number.isFinite(parts[1])) return null;
    return (parts[0] * 60) + parts[1];
}

function formatSecondsAsDuration(totalSeconds) {
    if (!Number.isFinite(totalSeconds)) return 'N/D';
    const safeSeconds = Math.max(0, Math.round(totalSeconds));
    const minutes = Math.floor(safeSeconds / 60);
    const seconds = String(safeSeconds % 60).padStart(2, '0');
    return `${minutes}:${seconds}`;
}

function getCatalogSongs() {
    return Object.entries(SONG_INFO_CATALOG).map(([key, details]) => {
        const [rawSong = '', rawArtist = ''] = key.split('|');
        const song = toDisplayName(rawSong);
        const artist = toDisplayName(rawArtist);

        return {
            song,
            artist,
            album: details.album || 'Single',
            genre: details.genre || 'Pop',
            year: details.year || 'N/D',
            duration: details.duration || 'N/D',
            cover: details.cover || `https://picsum.photos/seed/${encodeURIComponent(`${song}-${artist}`)}/240/240`,
            plays: Number(details.plays) || createPseudoPlays(song, artist)
        };
    });
}

function buildArtistProfile(artistName, songs) {
    const normalizedArtist = normalizeSearchText(artistName);
    const fromCatalog = ARTIST_PROFILE_CATALOG[normalizedArtist] || {};

    const yearValues = songs
        .map((song) => Number.parseInt(song.year, 10))
        .filter((value) => Number.isFinite(value));

    const startYear = Number.isFinite(fromCatalog.started)
        ? fromCatalog.started
        : (yearValues.length > 0 ? Math.min(...yearValues) : 'N/D');

    const totalViews = songs.reduce((sum, song) => sum + (Number(song.plays) || 0), 0);
    const monthlyListeners = Math.max(15000, Math.round(totalViews / 18));

    const albumSet = new Set();
    songs.forEach((song) => {
        if (song.album) albumSet.add(song.album);
    });
    const albums = Array.from(albumSet);

    const genreStats = {};
    songs.forEach((song) => {
        const genre = song.genre || 'Pop';
        genreStats[genre] = (genreStats[genre] || 0) + 1;
    });

    const genres = Object.entries(genreStats)
        .sort((a, b) => b[1] - a[1])
        .map(([genre]) => genre);

    const avgSeconds = songs
        .map((song) => parseDurationToSeconds(song.duration))
        .filter((value) => Number.isFinite(value));

    const averageDuration = avgSeconds.length > 0
        ? formatSecondsAsDuration(avgSeconds.reduce((sum, value) => sum + value, 0) / avgSeconds.length)
        : 'N/D';

    const currentYear = new Date().getFullYear();
    const yearsActive = Number.isFinite(Number(startYear))
        ? `${Math.max(1, currentYear - Number(startYear) + 1)} años`
        : 'N/D';

    const topSongs = [...songs]
        .sort((a, b) => (Number(b.plays) || 0) - (Number(a.plays) || 0))
        .slice(0, 5);

    return {
        name: artistName,
        city: fromCatalog.city || 'Escena independiente',
        image: fromCatalog.image || `https://picsum.photos/seed/artist-${encodeURIComponent(normalizedArtist || 'sonar')}/560/560`,
        bio: fromCatalog.bio || `${artistName} es un proyecto emergente con presencia en la escena digital y enfoque en sonido contemporaneo.`,
        startYear,
        totalViews,
        monthlyListeners,
        albums,
        genres,
        mainGenre: genres[0] || 'Pop',
        averageDuration,
        yearsActive,
        topSongs
    };
}

function initArtistPage() {
    if (!document.body.classList.contains('artist-page')) return;

    const params = new URLSearchParams(window.location.search);
    const artistParam = (params.get('name') || '').trim();
    const normalizedParam = normalizeSearchText(artistParam);
    const catalogSongs = getCatalogSongs();

    let songs = catalogSongs.filter((song) => normalizeSearchText(song.artist) === normalizedParam);

    if (songs.length === 0 && normalizedParam) {
        songs = catalogSongs.filter((song) => normalizeSearchText(song.artist).includes(normalizedParam));
    }

    const resolvedArtist = songs[0]?.artist || (artistParam ? toDisplayName(artistParam) : 'Artista no encontrado');
    const profile = buildArtistProfile(resolvedArtist, songs);

    const setText = (id, value) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    };

    setText('artistHeaderTitle', resolvedArtist);
    setText('artistName', resolvedArtist);
    setText('artistHeaderSubtitle', songs.length > 0
        ? `Descubre su trayectoria, lanzamientos y datos clave.`
        : `No encontramos canciones de este artista en el catalogo actual.`);
    setText('artistTagline', `${profile.mainGenre} • ${profile.city}`);
    setText('artistStartYear', String(profile.startYear));
    setText('artistViews', formatPlayCount(profile.totalViews));
    setText('artistAlbumCount', `${profile.albums.length}`);
    setText('artistMonthlyListeners', formatCompactCount(profile.monthlyListeners));
    setText('artistYearsActive', profile.yearsActive);
    setText('artistAvgDuration', profile.averageDuration);
    setText('artistBio', profile.bio);

    const image = document.getElementById('artistImage');
    if (image) {
        image.src = profile.image;
        image.alt = `Imagen de ${resolvedArtist}`;
        image.addEventListener('error', () => {
            image.src = `https://picsum.photos/seed/artist-fallback-${encodeURIComponent(resolvedArtist)}/560/560`;
        }, { once: true });
    }

    const albumsList = document.getElementById('artistAlbumsList');
    if (albumsList) {
        albumsList.innerHTML = '';
        const albums = profile.albums.length > 0 ? profile.albums : ['Sin albumes publicados'];
        albums.forEach((album) => {
            const item = document.createElement('li');
            item.textContent = album;
            albumsList.appendChild(item);
        });
    }

    const genresWrap = document.getElementById('artistGenres');
    if (genresWrap) {
        genresWrap.innerHTML = '';
        const genres = profile.genres.length > 0 ? profile.genres : ['Pop'];
        genres.forEach((genre) => {
            const chip = document.createElement('span');
            chip.className = 'artist-genre-chip';
            chip.textContent = genre;
            genresWrap.appendChild(chip);
        });
    }

    const topSongsList = document.getElementById('artistTopSongsList');
    if (topSongsList) {
        topSongsList.innerHTML = '';

        if (profile.topSongs.length === 0) {
            const item = document.createElement('li');
            item.className = 'artist-top-empty';
            item.textContent = 'No hay canciones disponibles todavia.';
            topSongsList.appendChild(item);
        } else {
            profile.topSongs.forEach((song, index) => {
                const item = document.createElement('li');
                const title = document.createElement('span');
                title.textContent = `${index + 1}. ${song.song}`;

                const views = document.createElement('strong');
                views.textContent = formatPlayCount(song.plays);

                item.appendChild(title);
                item.appendChild(views);
                topSongsList.appendChild(item);
            });
        }
    }

    const emptyState = document.getElementById('artistEmptyState');
    if (emptyState) {
        emptyState.hidden = songs.length > 0;
    }

    const playBtn = document.getElementById('artistPlayBtn');
    if (playBtn) {
        playBtn.disabled = songs.length === 0;
        playBtn.addEventListener('click', () => {
            if (songs.length === 0) return;
            const queue = songs.map((song) => ({
                song: song.song,
                artist: song.artist,
                album: song.album,
                genre: song.genre,
                cover: song.cover
            }));
            startGlobalPlayback(queue, 0, true);
        });
    }

    const shuffleBtn = document.getElementById('artistShuffleBtn');
    if (shuffleBtn) {
        shuffleBtn.disabled = songs.length === 0;
        shuffleBtn.addEventListener('click', () => {
            if (songs.length === 0) return;
            const randomIndex = Math.floor(Math.random() * songs.length);
            const queue = songs.map((song) => ({
                song: song.song,
                artist: song.artist,
                album: song.album,
                genre: song.genre,
                cover: song.cover
            }));
            startGlobalPlayback(queue, randomIndex, true);
        });
    }
}

function initPlaylistQuickSave() {
    const songActionRows = Array.from(document.querySelectorAll('.song-card .song-actions'));
    if (songActionRows.length === 0) return;

    initPlaylistPopoverDismiss();

    songActionRows.forEach((row) => {
        let addButton = row.querySelector('.playlist-add-btn');
        let infoButton = row.querySelector('.song-info-btn');

        if (!addButton) {
            addButton = document.createElement('button');
            addButton.type = 'button';
            addButton.className = 'song-action-btn playlist-add-btn';
            addButton.setAttribute('aria-label', 'Guardar en playlist');
            addButton.textContent = '+';
            row.appendChild(addButton);
        }

        if (!infoButton) {
            infoButton = document.createElement('button');
            infoButton.type = 'button';
            infoButton.className = 'song-action-btn song-info-btn';
            infoButton.setAttribute('aria-label', 'Ver informacion de la cancion');
            infoButton.textContent = 'i';
            row.appendChild(infoButton);
        }

        if (addButton.dataset.playlistBound === 'true') return;
        addButton.dataset.playlistBound = 'true';

        addButton.addEventListener('click', (event) => {
            event.stopPropagation();

            const card = addButton.closest('.song-card');
            if (!card) return;

            const songData = extractSongFromCard(card);

            openPlaylistPopover(addButton, songData);
        });

        if (infoButton.dataset.infoBound === 'true') return;
        infoButton.dataset.infoBound = 'true';

        infoButton.addEventListener('click', (event) => {
            event.stopPropagation();

            const card = infoButton.closest('.song-card');
            const songData = extractSongFromCard(card);
            openSongInfoModal(songData);
        });
    });
}

function getSongInfo(songData) {
    const song = (songData.song || 'Cancion').trim();
    const artist = (songData.artist || 'Artista').trim();
    const albumFromCard = (songData.album || '').trim();
    const genreFromCard = (songData.genre || '').trim();

    const key = `${song.toLowerCase()}|${artist.toLowerCase()}`;
    const fromCatalog = SONG_INFO_CATALOG[key] || {};
    const fallbackPlays = createPseudoPlays(song, artist);

    return {
        song,
        artist,
        album: albumFromCard || fromCatalog.album || 'Single',
        genre: genreFromCard || fromCatalog.genre || 'Pop',
        year: fromCatalog.year || 'N/D',
        duration: fromCatalog.duration || 'N/D',
        cover: fromCatalog.cover || `https://picsum.photos/seed/${encodeURIComponent(`${song}-${artist}`)}/240/240`,
        plays: formatPlayCount(fromCatalog.plays || fallbackPlays)
    };
}

function createPseudoPlays(song, artist) {
    const text = `${song}|${artist}`;
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = (hash << 5) - hash + text.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash % 9000000) + 50000;
}

function formatPlayCount(value) {
    if (!Number.isFinite(value)) return 'N/D';
    return new Intl.NumberFormat('es-ES').format(value);
}

function initSongCardVisuals(root = document) {
    const cards = Array.from(root.querySelectorAll('.song-card'));

    cards.forEach((card) => {
        const songData = extractSongFromCard(card);
        const info = getSongInfo(songData);

        const cover = card.querySelector('.song-cover');
        if (cover && !cover.querySelector('img')) {
            cover.innerHTML = `<img src="${info.cover}" alt="Portada de ${info.song}">`;
        }
        card.dataset.cover = info.cover;

        const artistText = info.artist;
        const artistEl = card.querySelector('.song-artist');
        if (artistEl && !artistEl.querySelector('.song-artist-link')) {
            const href = `/artista.html?name=${encodeURIComponent(artistText)}`;
            artistEl.innerHTML = `<a class="song-artist-link" href="${href}">${artistText}</a>`;
        }
    });
}

function initSongInfoModal() {
    if (songInfoModal) return songInfoModal;

    const overlay = document.createElement('div');
    overlay.id = 'songInfoModal';
    overlay.className = 'song-info-modal';
    overlay.hidden = true;
    overlay.innerHTML = `
        <div class="song-info-panel" role="dialog" aria-modal="true" aria-labelledby="songInfoTitle">
            <button type="button" class="song-info-close" id="songInfoClose" aria-label="Cerrar">&times;</button>
            <h3 id="songInfoTitle">Info de la cancion</h3>
            <p class="song-info-line"><span>Titulo</span><strong id="songInfoSong">-</strong></p>
            <p class="song-info-line"><span>Artista</span><strong id="songInfoArtist">-</strong></p>
            <p class="song-info-line"><span>Album</span><strong id="songInfoAlbum">-</strong></p>
            <p class="song-info-line"><span>Genero</span><strong id="songInfoGenre">-</strong></p>
            <p class="song-info-line"><span>Fecha</span><strong id="songInfoYear">-</strong></p>
            <p class="song-info-line"><span>Duracion</span><strong id="songInfoDuration">-</strong></p>
            <p class="song-info-line"><span>Reproducciones</span><strong id="songInfoPlays">-</strong></p>
        </div>
    `;

    document.body.appendChild(overlay);

    const close = () => {
        overlay.hidden = true;
    };

    overlay.addEventListener('click', (event) => {
        if (event.target.closest('.song-info-close')) {
            close();
            return;
        }

        if (event.target === overlay) {
            close();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !overlay.hidden) {
            close();
        }
    });

    songInfoModal = overlay;
    return overlay;
}

function openSongInfoModal(songData) {
    const modal = initSongInfoModal();
    const info = getSongInfo(songData);

    const setText = (id, value) => {
        const element = modal.querySelector(id);
        if (element) element.textContent = value;
    };

    setText('#songInfoSong', info.song);
    setText('#songInfoArtist', info.artist);
    setText('#songInfoAlbum', info.album);
    setText('#songInfoGenre', info.genre);
    setText('#songInfoYear', info.year);
    setText('#songInfoDuration', info.duration);
    setText('#songInfoPlays', info.plays);

    modal.hidden = false;
}

function createPlaylistPopover() {
    let popover = document.getElementById('playlistPopover');
    if (popover) return popover;

    popover = document.createElement('div');
    popover.id = 'playlistPopover';
    popover.className = 'playlist-popover';
    popover.hidden = true;
    document.body.appendChild(popover);
    return popover;
}

function closePlaylistPopover() {
    const popover = document.getElementById('playlistPopover');
    if (!popover) return;
    popover.hidden = true;
}

function openPlaylistPopover(anchorElement, songData) {
    const popover = createPlaylistPopover();
    initPlaylistPopoverDismiss();
    renderPlaylistOptions(popover, songData, closePlaylistPopover);

    const rect = anchorElement.getBoundingClientRect();

    // Show first (hidden visually) to measure and place reliably.
    popover.hidden = false;
    popover.style.visibility = 'hidden';

    const popoverWidth = popover.offsetWidth || 265;
    const popoverHeight = popover.offsetHeight || 220;
    const margin = 10;

    let left = window.scrollX + rect.left - ((popoverWidth - rect.width) / 2);
    const minLeft = window.scrollX + 8;
    const maxLeft = window.scrollX + window.innerWidth - popoverWidth - 8;
    left = Math.min(Math.max(left, minLeft), Math.max(minLeft, maxLeft));

    // Open upward by default; if there's no space, open downward.
    let top = window.scrollY + rect.top - popoverHeight - margin;
    const minTop = window.scrollY + 8;
    if (top < minTop) {
        top = window.scrollY + rect.bottom + margin;
    }

    popover.style.left = `${left}px`;
    popover.style.top = `${top}px`;
    popover.style.visibility = 'visible';
}

function initPlaylistPopoverDismiss() {
    if (isPlaylistPopoverDismissBound) return;
    isPlaylistPopoverDismissBound = true;

    window.addEventListener('resize', () => {
        closePlaylistPopover();
    });

    document.addEventListener('click', (event) => {
        const popover = document.getElementById('playlistPopover');
        if (!popover || popover.hidden) return;

        const clickedPopover = popover.contains(event.target);
        const clickedPlus = event.target.closest('.playlist-add-btn');
        const clickedPlayerAdd = event.target.closest('.player-add-btn');
        if (!clickedPopover && !clickedPlus && !clickedPlayerAdd) {
            closePlaylistPopover();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closePlaylistPopover();
        }
    });
}

function getPlaylists() {
    try {
        const stored = JSON.parse(localStorage.getItem('sonar_playlists') || '[]');
        if (Array.isArray(stored) && stored.length > 0) return stored;
    } catch (error) {
        console.warn('No se pudieron leer playlists guardadas.', error);
    }

    const defaults = ['Favoritas', 'Gym', 'Chill'];
    localStorage.setItem('sonar_playlists', JSON.stringify(defaults));
    return defaults;
}

function savePlaylistName(name) {
    const normalizedName = (name || '').trim();
    if (!normalizedName) return null;

    const playlists = getPlaylists();
    const exists = playlists.some((playlist) => playlist.toLowerCase() === normalizedName.toLowerCase());
    if (exists) {
        return playlists.find((playlist) => playlist.toLowerCase() === normalizedName.toLowerCase()) || normalizedName;
    }

    const updated = [...playlists, normalizedName];
    localStorage.setItem('sonar_playlists', JSON.stringify(updated));
    return normalizedName;
}

function saveSongToPlaylist(playlistName, songData) {
    let playlistSongs = {};

    try {
        playlistSongs = JSON.parse(localStorage.getItem('sonar_playlist_songs') || '{}');
    } catch (error) {
        console.warn('No se pudieron leer canciones guardadas.', error);
    }

    const currentSongs = Array.isArray(playlistSongs[playlistName]) ? playlistSongs[playlistName] : [];
    const alreadyExists = currentSongs.some((item) => item.song === songData.song && item.artist === songData.artist);
    if (alreadyExists) return false;

    const nextSongs = [...currentSongs, songData];
    const updated = { ...playlistSongs, [playlistName]: nextSongs };
    localStorage.setItem('sonar_playlist_songs', JSON.stringify(updated));
    return true;
}

function saveSongToLibrary(songData) {
    let savedSongs = [];

    try {
        savedSongs = JSON.parse(localStorage.getItem('sonar_saved_songs') || '[]');
        if (!Array.isArray(savedSongs)) savedSongs = [];
    } catch (error) {
        console.warn('No se pudieron leer canciones guardadas.', error);
    }

    const alreadyExists = savedSongs.some((item) => item.song === songData.song && item.artist === songData.artist);
    if (alreadyExists) return false;

    const updated = [...savedSongs, songData];
    localStorage.setItem('sonar_saved_songs', JSON.stringify(updated));
    return true;
}

function removeSongFromLibrary(songData) {
    let savedSongs = [];

    try {
        savedSongs = JSON.parse(localStorage.getItem('sonar_saved_songs') || '[]');
        if (!Array.isArray(savedSongs)) savedSongs = [];
    } catch (error) {
        console.warn('No se pudieron leer canciones guardadas.', error);
    }

    const nextSongs = savedSongs.filter((item) => !(item.song === songData.song && item.artist === songData.artist));
    const removed = nextSongs.length !== savedSongs.length;
    localStorage.setItem('sonar_saved_songs', JSON.stringify(nextSongs));
    return removed;
}

function isSongInLibrary(songData) {
    try {
        const savedSongs = JSON.parse(localStorage.getItem('sonar_saved_songs') || '[]');
        if (!Array.isArray(savedSongs)) return false;
        return savedSongs.some((item) => item.song === songData.song && item.artist === songData.artist);
    } catch (error) {
        return false;
    }
}

function renderPlaylistOptions(popover, songData, closePopover) {
    const playlists = getPlaylists();

    popover.innerHTML = '';

    const title = document.createElement('p');
    title.className = 'playlist-popover-title';
    title.textContent = `Guardar "${songData.song}"`;
    popover.appendChild(title);

    const saveButton = document.createElement('button');
    saveButton.type = 'button';
    saveButton.className = 'playlist-popover-save';
    const alreadySaved = isSongInLibrary(songData);
    saveButton.textContent = alreadySaved ? 'Quitar de guardadas' : 'Guardar cancion';
    saveButton.addEventListener('click', () => {
        if (alreadySaved) {
            const wasRemoved = removeSongFromLibrary(songData);
            showPlaylistFeedback(popover, wasRemoved ? 'Cancion quitada de guardadas.' : 'No estaba en guardadas.');
            if (document.body.classList.contains('save-page')) {
                closePopover();
                initSavedSongsPage();
            }
            return;
        }

        const wasSaved = saveSongToLibrary(songData);
        showPlaylistFeedback(popover, wasSaved ? 'Cancion guardada en tu biblioteca.' : 'Esta cancion ya estaba guardada.');
    });
    popover.appendChild(saveButton);

    const list = document.createElement('div');
    list.className = 'playlist-popover-list';

    playlists.forEach((playlistName) => {
        const option = document.createElement('button');
        option.type = 'button';
        option.className = 'playlist-popover-option';
        option.textContent = playlistName;

        option.addEventListener('click', () => {
            const wasSaved = saveSongToPlaylist(playlistName, songData);
            showPlaylistFeedback(popover, wasSaved ? `Guardada en ${playlistName}` : `Ya existe en ${playlistName}`);
            if (wasSaved) {
                setTimeout(closePopover, 600);
            }
        });

        list.appendChild(option);
    });

    popover.appendChild(list);

    const createBtn = document.createElement('button');
    createBtn.type = 'button';
    createBtn.className = 'playlist-popover-create';
    createBtn.textContent = '+ Nueva playlist';

    createBtn.addEventListener('click', () => {
        const newName = window.prompt('Nombre de la nueva playlist:');
        const savedName = savePlaylistName(newName);
        if (!savedName) return;

        const wasSaved = saveSongToPlaylist(savedName, songData);
        showPlaylistFeedback(popover, wasSaved ? `Guardada en ${savedName}` : `Ya existe en ${savedName}`);
        renderPlaylistOptions(popover, songData, closePopover);
    });

    popover.appendChild(createBtn);

    const feedback = document.createElement('p');
    feedback.className = 'playlist-popover-feedback';
    feedback.id = 'playlistPopoverFeedback';
    popover.appendChild(feedback);
}

function showPlaylistFeedback(popover, message) {
    const feedback = popover.querySelector('#playlistPopoverFeedback');
    if (!feedback) return;
    feedback.textContent = message;
}

function initPlaylistPage() {
    const playlistGrid = document.getElementById('playlistGrid');
    const createCard = document.getElementById('createPlaylistCard');
    const playlistCount = document.getElementById('playlistCount');
    const nowPlaying = document.getElementById('playlistNowPlaying');

    if (!playlistGrid || !createCard) return;

    const createPlaylist = () => {
        const name = window.prompt('Nombre de la nueva playlist:');
        const savedName = savePlaylistName(name);
        if (!savedName) return;
        renderPlaylistCards();
    };

    createCard.addEventListener('click', createPlaylist);

    const setNowPlaying = (message, isError = false) => {
        if (!nowPlaying) return;
        nowPlaying.textContent = message;
        nowPlaying.classList.toggle('error', isError);
    };

    const renderPlaylistCards = () => {
        const previousCards = playlistGrid.querySelectorAll('.playlist-card');
        previousCards.forEach((card) => card.remove());

        const playlists = getPlaylists();

        let playlistSongs = {};
        try {
            playlistSongs = JSON.parse(localStorage.getItem('sonar_playlist_songs') || '{}');
        } catch (error) {
            console.warn('No se pudieron leer canciones de playlists.', error);
        }

        playlists.forEach((playlistName) => {
            const songs = Array.isArray(playlistSongs[playlistName]) ? playlistSongs[playlistName] : [];
            const songCount = songs.length;

            const card = document.createElement('article');
            card.className = 'playlist-card';

            const topLine = songs.slice(0, 2)
                .map((song) => `${song.song} - ${song.artist}`)
                .join(' | ');

            card.innerHTML = `
                <h3>${playlistName}</h3>
                <p class="playlist-card-meta">${songCount} cancion${songCount === 1 ? '' : 'es'}</p>
                <p class="playlist-card-preview">${topLine || 'Aun no has guardado canciones.'}</p>
                <div class="playlist-card-actions">
                    <button type="button" class="playlist-card-btn" data-action="play"><i class="fa-solid fa-play" aria-hidden="true"></i><span>Reproducir</span></button>
                    <button type="button" class="playlist-card-btn" data-action="shuffle"><i class="fa-solid fa-shuffle" aria-hidden="true"></i><span>Shuffle</span></button>
                </div>
            `;

            const playBtn = card.querySelector('[data-action="play"]');
            const shuffleBtn = card.querySelector('[data-action="shuffle"]');

            if (playBtn) {
                playBtn.addEventListener('click', () => {
                    if (songCount === 0) {
                        setNowPlaying(`La playlist ${playlistName} no tiene canciones.`, true);
                        return;
                    }

                    const queue = songs.map((song) => ({ ...song, playlist: playlistName }));
                    startGlobalPlayback(queue, 0, true);
                    setNowPlaying(`Reproduciendo: ${queue[0].song} - ${queue[0].artist} (${playlistName})`);
                });
            }

            if (shuffleBtn) {
                shuffleBtn.addEventListener('click', () => {
                    if (songCount === 0) {
                        setNowPlaying(`La playlist ${playlistName} no tiene canciones para shuffle.`, true);
                        return;
                    }

                    const randomIndex = Math.floor(Math.random() * songCount);
                    const queue = songs.map((song) => ({ ...song, playlist: playlistName }));
                    startGlobalPlayback(queue, randomIndex, true);
                    const randomSong = queue[randomIndex];
                    setNowPlaying(`Shuffle: ${randomSong.song} - ${randomSong.artist} (${playlistName})`);
                });
            }

            playlistGrid.insertBefore(card, createCard);
        });

        if (playlistCount) {
            playlistCount.textContent = `${playlists.length} playlist${playlists.length === 1 ? '' : 's'}`;
        }
    };

    renderPlaylistCards();
}

function initSavedSongsPage() {
    const savedSongsGrid = document.getElementById('savedSongsGrid');
    const savedSongsCount = document.getElementById('savedSongsCount');
    const savedSongsEmpty = document.getElementById('savedSongsEmpty');

    if (!savedSongsGrid || !savedSongsCount || !savedSongsEmpty) return;

    let savedSongs = [];
    try {
        savedSongs = JSON.parse(localStorage.getItem('sonar_saved_songs') || '[]');
        if (!Array.isArray(savedSongs)) savedSongs = [];
    } catch (error) {
        console.warn('No se pudieron leer canciones guardadas.', error);
    }

    savedSongsGrid.innerHTML = '';

    savedSongs.forEach((songData) => {
        const card = document.createElement('article');
        card.className = 'song-card saved-song-card';
        card.dataset.song = songData.song || 'Cancion';
        card.dataset.artist = songData.artist || 'Artista';
        if (songData.cover) card.dataset.cover = songData.cover;

        card.innerHTML = `
            <div class="song-cover" aria-hidden="true">Portada</div>
            <h3>${songData.song || 'Cancion'}</h3>
            <p class="song-artist">${songData.artist || 'Artista'}</p>
            <div class="song-actions" aria-label="Acciones de la cancion guardada">
                <button type="button" class="song-action-btn" aria-label="Me gusta">&#128077;</button>
                <button type="button" class="song-action-btn" aria-label="No me gusta">&#128078;</button>
                <button type="button" class="song-action-btn" aria-label="Reproducir">&#9654;</button>
                <button type="button" class="song-action-btn playlist-add-btn" aria-label="Guardar en playlist">+</button>
            </div>
        `;

        savedSongsGrid.appendChild(card);
    });

    savedSongsCount.textContent = `${savedSongs.length} guardada${savedSongs.length === 1 ? '' : 's'}`;
    savedSongsEmpty.hidden = savedSongs.length !== 0;

    // Reengancha comportamientos en tarjetas renderizadas dinamicamente.
    initSongCardVisuals(savedSongsGrid);
    initPlaylistQuickSave();
    initSongCardPlayback();
}

function initGlobalPlayerBar() {
    if (globalPlayer) return;

    const bar = document.createElement('div');
    bar.id = 'globalPlayerBar';
    bar.className = 'global-player-bar hidden';
    bar.innerHTML = `
        <div class="player-main-controls" aria-label="Controles de reproduccion">
            <button type="button" class="player-control-btn" data-player-action="prev" aria-label="Cancion anterior">&#9198;</button>
            <button type="button" class="player-control-btn player-play-btn" data-player-action="toggle" aria-label="Pausar o continuar">&#9654;</button>
            <button type="button" class="player-control-btn" data-player-action="next" aria-label="Siguiente cancion">&#9197;</button>
        </div>
        <div class="player-track-info">
            <div class="player-cover" id="playerCover" aria-hidden="true">
                <img class="player-cover-img" id="playerCoverImg" src="" alt="" hidden>
                <span class="player-cover-fallback" id="playerCoverFallback" hidden></span>
            </div>
            <div class="player-meta">
                <p class="player-song" id="playerSongTitle">Sin reproduccion</p>
                <p class="player-artist" id="playerSongArtist">Selecciona una cancion para empezar</p>
            </div>
        </div>
        <div class="player-extra-controls" aria-label="Acciones extra">
            <button type="button" class="player-action-btn" data-player-action="like" aria-label="Me gusta">&#128077;</button>
            <button type="button" class="player-action-btn" data-player-action="dislike" aria-label="No me gusta">&#128078;</button>
            <button type="button" class="player-action-btn player-add-btn" data-player-action="add" aria-label="Anadir a playlist">+</button>
            <div class="player-volume-wrap">
                <span class="player-volume-icon" id="playerVolumeIcon" aria-hidden="true">&#128266;</span>
                <input type="range" id="playerVolume" min="0" max="100" step="1" value="70" aria-label="Control de volumen">
            </div>
        </div>
    `;

    document.body.appendChild(bar);

    globalPlayer = {
        bar,
        playToggle: bar.querySelector('[data-player-action="toggle"]'),
        prevBtn: bar.querySelector('[data-player-action="prev"]'),
        nextBtn: bar.querySelector('[data-player-action="next"]'),
        likeBtn: bar.querySelector('[data-player-action="like"]'),
        dislikeBtn: bar.querySelector('[data-player-action="dislike"]'),
        addBtn: bar.querySelector('[data-player-action="add"]'),
        volumeInput: bar.querySelector('#playerVolume'),
        volumeIcon: bar.querySelector('#playerVolumeIcon'),
        cover: bar.querySelector('#playerCover'),
        coverImg: bar.querySelector('#playerCoverImg'),
        coverFallback: bar.querySelector('#playerCoverFallback'),
        songTitle: bar.querySelector('#playerSongTitle'),
        songArtist: bar.querySelector('#playerSongArtist')
    };

    globalPlayer.coverImg.addEventListener('error', () => {
        globalPlayer.coverImg.src = '';
        globalPlayer.coverImg.hidden = true;
        globalPlayer.coverFallback.hidden = true;
    });

    globalPlayer.coverImg.addEventListener('load', () => {
        globalPlayer.coverImg.hidden = false;
        globalPlayer.coverFallback.hidden = true;
    });

    globalPlayer.playToggle.addEventListener('click', () => {
        if (globalPlayerState.queue.length === 0) return;
        globalPlayerState.isPlaying = !globalPlayerState.isPlaying;
        updateGlobalPlayerUI();
    });

    globalPlayer.prevBtn.addEventListener('click', () => {
        moveGlobalTrack(-1);
    });

    globalPlayer.nextBtn.addEventListener('click', () => {
        moveGlobalTrack(1);
    });

    globalPlayer.likeBtn.addEventListener('click', () => {
        globalPlayerState.liked = globalPlayerState.liked === 1 ? 0 : 1;
        updateGlobalPlayerUI();
    });

    globalPlayer.dislikeBtn.addEventListener('click', () => {
        globalPlayerState.liked = globalPlayerState.liked === -1 ? 0 : -1;
        updateGlobalPlayerUI();
    });

    globalPlayer.addBtn.addEventListener('click', (event) => {
        const currentSong = getCurrentGlobalSong();
        if (!currentSong) return;
        openPlaylistPopover(event.currentTarget, { song: currentSong.song, artist: currentSong.artist });
    });

    globalPlayer.volumeInput.addEventListener('input', (event) => {
        globalPlayerState.volume = Number(event.target.value);
        updateGlobalPlayerUI();
    });
}

function initSongCardPlayback() {
    const buttons = Array.from(document.querySelectorAll('.song-card .song-action-btn'));
    if (buttons.length === 0) return;

    buttons.forEach((button) => {
        const label = (button.getAttribute('aria-label') || '').toLowerCase();
        if (!label.includes('reproduc')) return;
        if (button.dataset.playerBound === 'true') return;
        button.dataset.playerBound = 'true';

        button.addEventListener('click', () => {
            const queue = getSongQueueFromCards();
            if (queue.length === 0) return;

            const card = button.closest('.song-card');
            const selectedSong = extractSongFromCard(card);
            const index = Math.max(0, queue.findIndex((song) => song.song === selectedSong.song && song.artist === selectedSong.artist));

            startGlobalPlayback(queue, index, true);
        });
    });
}

function extractSongFromCard(card) {
    if (!card) return { song: 'Cancion', artist: 'Artista' };

    const song = card.querySelector('h3')?.textContent?.trim() || card.dataset.song || 'Cancion';
    const artist = card.querySelector('.song-artist')?.textContent?.trim() || card.dataset.artist || 'Artista';
    const album = card.dataset.album || '';
    const genre = card.dataset.genre || '';
    const cover = card.querySelector('.song-cover img')?.getAttribute('src') || card.dataset.cover || '';
    return { song, artist, album, genre, cover };
}

function getSongQueueFromCards() {
    const cards = Array.from(document.querySelectorAll('.song-card'));
    return cards
        .filter((card) => !card.classList.contains('playlist-card'))
        .filter((card) => card.style.display !== 'none')
        .map((card) => extractSongFromCard(card));
}

function getCurrentGlobalSong() {
    if (globalPlayerState.index < 0 || globalPlayerState.index >= globalPlayerState.queue.length) return null;
    return globalPlayerState.queue[globalPlayerState.index];
}

function startGlobalPlayback(queue, index = 0, autoplay = true) {
    initGlobalPlayerBar();

    globalPlayerState.queue = Array.isArray(queue) ? queue : [];
    globalPlayerState.index = Math.min(Math.max(index, 0), Math.max(globalPlayerState.queue.length - 1, 0));
    globalPlayerState.isPlaying = Boolean(autoplay) && globalPlayerState.queue.length > 0;
    globalPlayerState.liked = 0;

    if (globalPlayerState.queue.length > 0) {
        globalPlayer.bar.classList.remove('hidden');
    }

    updateGlobalPlayerUI();
}

function moveGlobalTrack(step) {
    if (globalPlayerState.queue.length === 0) return;
    globalPlayerState.index = (globalPlayerState.index + step + globalPlayerState.queue.length) % globalPlayerState.queue.length;
    globalPlayerState.isPlaying = true;
    globalPlayerState.liked = 0;
    updateGlobalPlayerUI();
}

function updateGlobalPlayerUI() {
    if (!globalPlayer) return;

    const currentSong = getCurrentGlobalSong();
    const isTrackLoaded = Boolean(currentSong);

    globalPlayer.playToggle.textContent = globalPlayerState.isPlaying ? '❚❚' : '▶';
    globalPlayer.prevBtn.disabled = !isTrackLoaded;
    globalPlayer.nextBtn.disabled = !isTrackLoaded;
    globalPlayer.playToggle.disabled = !isTrackLoaded;

    globalPlayer.likeBtn.classList.toggle('active', globalPlayerState.liked === 1);
    globalPlayer.dislikeBtn.classList.toggle('active', globalPlayerState.liked === -1);

    globalPlayer.volumeInput.value = String(globalPlayerState.volume);
    if (globalPlayerState.volume === 0) globalPlayer.volumeIcon.textContent = '🔇';
    else if (globalPlayerState.volume < 45) globalPlayer.volumeIcon.textContent = '🔉';
    else globalPlayer.volumeIcon.textContent = '🔊';

    if (!currentSong) {
        globalPlayer.songTitle.textContent = 'Sin reproduccion';
        globalPlayer.songArtist.textContent = 'Selecciona una cancion para empezar';
        globalPlayer.coverImg.src = '';
        globalPlayer.coverImg.alt = '';
        globalPlayer.coverImg.hidden = true;
        globalPlayer.coverFallback.hidden = true;
        return;
    }

    const songInfo = getSongInfo(currentSong);

    globalPlayer.songTitle.textContent = currentSong.song;
    globalPlayer.songArtist.textContent = `${currentSong.artist}${currentSong.playlist ? ` • ${currentSong.playlist}` : ''}`;
    globalPlayer.coverFallback.hidden = true;
    globalPlayer.coverImg.alt = `Portada de ${songInfo.song}`;
    globalPlayer.coverImg.src = currentSong.cover || songInfo.cover;

    const playlistNowPlaying = document.getElementById('playlistNowPlaying');
    if (playlistNowPlaying) {
        playlistNowPlaying.classList.remove('error');
        playlistNowPlaying.textContent = `Reproduciendo: ${currentSong.song} - ${currentSong.artist}`;
    }
}
