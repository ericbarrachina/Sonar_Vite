// ========================================
// SONAR - Script Unificado Profesional
// ========================================

const API_URL = 'http://172.20.10.3:3000';
let isPlaylistPopoverDismissBound = false;
let isArtistAlbumPopoverDismissBound = false;
let globalPlayer = null;
const globalPlayerState = {
    queue: [],
    index: -1,
    isPlaying: false,
    liked: 0,
    volume: 70
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
    users: { total: 0, trend: 'Total acumulado' },
    artists: { total: 0, trend: 'Total acumulado' },
    songs: { total: 0, trend: 'Total acumulado' },
    playlists: { total: 0, trend: 'Total acumulado' },
    albums: { total: 0, trend: 'Total acumulado' },
    updatedLabel: 'Pendiente de actualizacion',
    periodLabel: 'Top 5',
    topGenres: [
        { label: 'Sin datos', value: '0 canciones' }
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
    const isProfilePage = body.classList.contains('perfil-page');
    const isArtistProfilePage = body.classList.contains('perfil-artista-page');
    const isHomePage = body.classList.contains('home-page') && !isArtistHomePage && !isArtistSongPage && !body.classList.contains('playlist-page') && !body.classList.contains('perfil-page') && !body.classList.contains('artist-page');
    const isSongLibraryPage = (body.classList.contains('home-page') && !isArtistHomePage && !isArtistSongPage) || body.classList.contains('playlist-page') || body.classList.contains('artist-page');

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

    if (isHomePage || isArtistHomePage || isArtistSongPage || isArtistAlbumPage || isAdminPage || body.classList.contains('playlist-page') || body.classList.contains('perfil-page')) {
        initHomeInteractions();
    }

    if (isSongLibraryPage) {
        initPlaylistQuickSave();
        initSongCardVisuals();
        initSongCardPlayback();
    }

    if (body.classList.contains('playlist-page')) {
        initPlaylistPage();
    }

    if (isProfilePage) {
        initProfileSettingsPage();
    }

    if (isArtistProfilePage) {
        initArtistProfileSettingsPage();
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

    // Ejecutar al final para evitar que otro init reemplace el contenedor ya pintado.
    if (isHomePage) {
        renderizarCanciones();
    }

    if (isSongLibraryPage && !isLoginPage && !isRegisterPage) {
        initGlobalPlayerBar();
    }
});

async function renderizarCanciones() {
    const contenedor = document.getElementById('lista-canciones') || document.getElementById('contenedor-musica') || document.getElementById('artistSongsGrid');

    if (!contenedor) {
        console.error("No existe ningún contenedor de canciones (lista-canciones o contenedor-musica).");
        return;
    }

    contenedor.innerHTML = '<p class="buscar-empty" style="grid-column: 1 / -1; color: #fff;">Cargando canciones...</p>';

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 8000);

    try {
        const response = await fetch(`${API_URL}/cancons`, {
            method: 'GET',
            cache: 'no-store',
            signal: controller.signal
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
            const message = result?.message || `Error ${response.status} al cargar canciones`;
            throw new Error(message);
        }

        const canciones = Array.isArray(result)
            ? result
            : Array.isArray(result.data)
                ? result.data
                : Array.isArray(result.rows)
                    ? result.rows
                    : Array.isArray(result.canciones)
                        ? result.canciones
                        : [];

        if (canciones.length === 0) {
            contenedor.innerHTML = '<p class="buscar-empty" style="grid-column: 1 / -1; color: #fff;">No hay canciones en la base de datos.</p>';
            return;
        }

        const isArtistGrid = contenedor.id === 'artistSongsGrid';
        if (isArtistGrid) {
            const empty = document.getElementById('artistSongsEmpty');
            const addWrap = document.getElementById('artistAddSongWrap');
            const wrap = document.getElementById('artistSongsWrap');
            const ranking = document.getElementById('artistViewsRanking');
            const rankingPanel = ranking ? ranking.closest('aside') : null;

            if (empty) empty.hidden = true;
            if (addWrap) addWrap.hidden = true;
            if (wrap) wrap.hidden = false;
            if (rankingPanel) rankingPanel.hidden = true;
        }

        contenedor.innerHTML = '';

        canciones.forEach((canco) => {
            const titulo = canco.titol || canco.nom || canco.titulo || 'Sin titulo';
            const artista = canco.artista || canco.nom_artista || 'Desconocido';
            const genero = canco.genere || canco.genero || 'S/G';
            const idCanco = canco.id_canco || canco.id || '';
            const imageUrl = `${API_URL}/imatge/${idCanco}`;
            const audioUrl = `${API_URL}/audio/${idCanco}`;

            const card = document.createElement('article');
            card.className = 'song-card card-canco';
            card.dataset.song = titulo;
            card.dataset.artist = artista;
            card.dataset.genre = genero;
            card.dataset.idCanco = String(idCanco);
            card.dataset.cover = imageUrl;
            card.dataset.audioSrc = audioUrl;

            card.innerHTML = `
                <div class="song-cover" aria-hidden="true">
                    <img src="${imageUrl}" alt="Portada de ${titulo}" loading="lazy" decoding="async" fetchpriority="low">
                </div>
                <h3>${titulo}</h3>
                <p class="song-artist">${artista}</p>
                <p><strong>Genero:</strong> ${genero}</p>
                <div class="song-actions" aria-label="Acciones de la cancion">
                    <button type="button" class="song-action-btn" aria-label="Me gusta">&#128077;</button>
                    <button type="button" class="song-action-btn" aria-label="No me gusta">&#128078;</button>
                    <button type="button" class="song-action-btn" aria-label="Reproducir">&#9654;</button>
                    <button type="button" class="song-action-btn playlist-add-btn" aria-label="Guardar en playlist">+</button>
                </div>
            `;

            const img = card.querySelector('img');
            if (img) {
                img.addEventListener('error', () => {
                    const cover = card.querySelector('.song-cover');
                    if (cover) {
                        cover.innerHTML = 'Portada';
                    }
                }, { once: true });
            }

            contenedor.appendChild(card);
        });

        // Reengancha comportamiento comun cuando se renderiza dinamicamente.
        initSongCardVisuals(contenedor);
        initPlaylistQuickSave();
        initSongCardPlayback();
    } catch (error) {
        const message = error?.name === 'AbortError'
            ? 'Tiempo de espera agotado al cargar canciones.'
            : (error?.message || 'No se pudo cargar la musica.');

        console.error('Error al cargar canciones:', error);
        contenedor.innerHTML = `<p class="buscar-empty" style="grid-column: 1 / -1; color: #ff8f8f;">Error: ${message}</p>`;
    } finally {
        window.clearTimeout(timeoutId);
    }
}

// ========================================
// GESTIÓN DE SESIÓN (JWT)
// ========================================

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
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('userAlias');
    localStorage.removeItem('userType');
    localStorage.removeItem('authCode');
    localStorage.removeItem('authEntity');
    localStorage.removeItem('userEmail');
    window.location.href = 'index.html';
}

function getOrCreateFormErrorElement(formId, errorId) {
    const form = document.getElementById(formId);
    if (!form) return null;

    let errorDiv = document.getElementById(errorId);
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = errorId;
        errorDiv.style.color = '#ff4d4d';
        errorDiv.style.fontSize = '0.9rem';
        errorDiv.style.marginBottom = '15px';
        errorDiv.style.textAlign = 'center';
        errorDiv.style.fontWeight = '500';
        errorDiv.style.display = 'none';
        form.insertBefore(errorDiv, form.querySelector('button[type="submit"]'));
    }

    return errorDiv;
}

function setFormError(errorElement, message) {
    if (!errorElement) return;
    errorElement.textContent = message || '';
    errorElement.style.display = message ? 'block' : 'none';
}

function resolveRedirectFromCodigo(codigo) {
    const normalized = Number.parseInt(codigo, 10);
    if (normalized === 1) return '/artista/home_artista.html';
    if (normalized === 2) return '/admin/admin_site.html';
    if (normalized === 3) return '/home.html';
    return '';
}

function resolveAuthEntity(data, preferredEntity = '') {
    const userData = data?.user || data || {};
    const normalizedPreferred = String(preferredEntity || '').toLowerCase();
    const rawType = String(userData?.tipus || data?.tipus || '').toLowerCase();

    if (rawType.includes('artista')) return 'artistes';
    if (rawType.includes('usuari') || rawType.includes('usuario')) return 'usuaris';

    const hasArtistId = Number.parseInt(
        userData?.id_artista
        || userData?.artist_id
        || userData?.id_artist
        || data?.id_artista
        || data?.artist_id
        || data?.id_artist
        || '0',
        10
    ) > 0;

    if (hasArtistId) return 'artistes';

    const hasUserId = Number.parseInt(
        userData?.id_usuario
        || userData?.id_usuari
        || userData?.id_user
        || userData?.user_id
        || data?.id_usuario
        || data?.id_usuari
        || data?.id_user
        || data?.user_id
        || userData?.id
        || data?.id
        || '0',
        10
    ) > 0;

    if (hasUserId) return 'usuaris';

    if (normalizedPreferred === 'usuaris' || normalizedPreferred === 'usuarios') return 'usuaris';
    if (normalizedPreferred === 'artistes' || normalizedPreferred === 'artistas') return 'artistes';

    return '';
}

function storeAuthSession(data, preferredEntity = '') {
    if (!data) return;

    const userData = data.user || data;
    const authCode = Number.parseInt(data?.codigo || userData?.codigo || '0', 10);
    const authEntity = resolveAuthEntity(data, preferredEntity);
    const sessionUserId = Number.parseInt(
        userData?.id_usuario
        || userData?.id_usuari
        || userData?.id_user
        || userData?.user_id
        || userData?.artist_id
        || userData?.id_artista
        || userData?.id
        || data?.id_usuario
        || data?.id_usuari
        || data?.id_user
        || data?.user_id
        || data?.artist_id
        || data?.id_artista
        || data?.id
        || '0',
        10
    );

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

    if (Number.isFinite(authCode) && authCode > 0) {
        localStorage.setItem('authCode', String(authCode));
    }

    const sessionEmail = userData?.correu || data?.correu || '';
    if (sessionEmail) {
        localStorage.setItem('userEmail', sessionEmail);
    }

    if (authEntity) {
        localStorage.setItem('authEntity', authEntity);
    }

    if (Number.isFinite(sessionUserId) && sessionUserId > 0) {
        localStorage.setItem('userId', String(sessionUserId));
        localStorage.setItem('id_usuario', String(sessionUserId));
        localStorage.setItem('id_usuari', String(sessionUserId));

        if (authEntity === 'artistes' || data.user?.tipus === 'artista') {
            localStorage.setItem('artistId', String(sessionUserId));
        }
    }
}

function resolveAuthRedirect(data, fallbackPath = '/home.html', preferredEntity = '') {
    if (typeof data?.redirect === 'string' && data.redirect.trim()) {
        return data.redirect;
    }

    const codigoFromResponse = Number.parseInt(data?.codigo || data?.user?.codigo || '0', 10);
    const codigoFromStorage = Number.parseInt(localStorage.getItem('authCode') || '0', 10);
    const redirectByCodigo = resolveRedirectFromCodigo(codigoFromResponse || codigoFromStorage);
    if (redirectByCodigo) {
        return redirectByCodigo;
    }

    const userData = data?.user || data || {};
    const authEntity = resolveAuthEntity(data, preferredEntity) || localStorage.getItem('authEntity') || '';
    const userType = userData?.tipus || localStorage.getItem('userType') || '';
    const userId = Number.parseInt(
        userData?.id_usuario
        || userData?.id_usuari
        || userData?.id_user
        || userData?.user_id
        || userData?.id
        || localStorage.getItem('id_usuario')
        || localStorage.getItem('id_usuari')
        || localStorage.getItem('userId')
        || '0',
        10
    );

    // Orden solicitado:
    // 1) Si pertenece a usuaris, validar admin por id=10.
    // 2) Si no es admin, enviar a home usuario.
    // 3) Si pertenece a artistes, enviar a home artista.
    if (authEntity === 'usuaris') {
        if (userId === 10) {
            return '/admin/admin_site.html';
        }
        return '/home.html';
    }

    if (authEntity === 'artistes' || userType === 'artista') {
        return '/artista/home_artista.html';
    }

    return fallbackPath;
}

// ========================================
// LÓGICA DE REGISTRO
// ========================================
async function handleRegistro(e) {
    e.preventDefault();

    const errorDiv = getOrCreateFormErrorElement('registroForm', 'registroFormError');
    setFormError(errorDiv, '');

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
                storeAuthSession(data, 'usuaris');
                window.location.replace(resolveAuthRedirect(data, '/home.html', 'usuaris'));
                return;
            }

            const loginResponse = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ correu: dadesUsuari.correu, contrasenya: dadesUsuari.contrasenya })
            });

            const loginData = await loginResponse.json().catch(() => ({}));

            if (loginResponse.ok) {
                storeAuthSession(loginData, 'usuaris');
                window.location.replace(resolveAuthRedirect(loginData, '/home.html', 'usuaris'));
                return;
            }

            alert("✅ ¡Cuenta creada con éxito! Ya puedes iniciar sesión.");
            window.location.replace('/login.html?registro=ok');
        } else {
            const message = data?.message || 'No se pudo completar el registro.';
            if (message.toLowerCase().includes('email ya existe')) {
                setFormError(errorDiv, 'Este email ya existe en el sistema. Usa otro o inicia sesion.');
            } else {
                setFormError(errorDiv, message);
            }
        }
    } catch (error) {
        console.error("Error en el registro:", error);
        setFormError(errorDiv, 'No se pudo conectar con el servidor de Sonar.');
    }
}

async function handleRegistroArtista(e) {
    e.preventDefault();

    const errorDiv = getOrCreateFormErrorElement('registroArtistaForm', 'registroArtistaFormError');
    setFormError(errorDiv, '');

    const artistaData = {
        nom: document.getElementById('artistaNombre').value,
        correu: document.getElementById('artistaEmail').value,
        contrasenya: document.getElementById('artistaPassword').value,
        imatge_perfil: ''
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
                storeAuthSession(data, 'artistes');
                window.location.replace(resolveAuthRedirect(data, '/home_artista.html', 'artistes'));
                return;
            }

            const loginResponse = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ correu: artistaData.correu, contrasenya: artistaData.contrasenya })
            });

            const loginData = await loginResponse.json().catch(() => ({}));

            if (loginResponse.ok) {
                storeAuthSession(loginData, 'artistes');
                window.location.replace(resolveAuthRedirect(loginData, '/home_artista.html', 'artistes'));
                return;
            }

            alert('✅ Cuenta de artista creada. Ahora puedes iniciar sesión.');
            window.location.replace('/login.html?registro=ok');
        } else {
            const message = data?.message || 'No se pudo crear la cuenta de artista.';
            if (message.toLowerCase().includes('email ya existe')) {
                setFormError(errorDiv, 'Este email ya existe en el sistema. Usa otro o inicia sesion.');
            } else {
                setFormError(errorDiv, message);
            }
        }
    } catch (error) {
        console.error('Error en el registro de artista:', error);
        setFormError(errorDiv, 'No se pudo conectar con el servidor de Sonar.');
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

async function readJsonSafe(response) {
    return response.json().catch(() => ({}));
}

function upsertPerfilFeedback(form, type, message) {
    if (!form) return;

    let feedback = form.querySelector('.perfil-feedback');
    if (!feedback) {
        feedback = document.createElement('div');
        feedback.className = 'perfil-feedback';
        form.insertBefore(feedback, form.querySelector('button[type="submit"]'));
    }

    if (!message) {
        feedback.textContent = '';
        feedback.hidden = true;
        feedback.classList.remove('perfil-feedback-error', 'perfil-feedback-success');
        return;
    }

    feedback.textContent = message;
    feedback.hidden = false;
    feedback.classList.remove('perfil-feedback-error', 'perfil-feedback-success');
    feedback.classList.add(type === 'success' ? 'perfil-feedback-success' : 'perfil-feedback-error');
}

function setFormSubmittingState(form, isSubmitting) {
    if (!form) return;

    const submitButton = form.querySelector('button[type="submit"]');
    if (!submitButton) return;

    if (!submitButton.dataset.originalLabel) {
        submitButton.dataset.originalLabel = submitButton.textContent || '';
    }

    submitButton.disabled = Boolean(isSubmitting);
    submitButton.textContent = isSubmitting ? 'Guardando...' : submitButton.dataset.originalLabel;
}

function ensureProfileToken() {
    const token = getAuthToken();
    if (!token) {
        alert('Tu sesion ha expirado. Inicia sesion de nuevo.');
        window.location.replace('/login.html');
        return '';
    }
    return token;
}

function decodeJwtPayload(token) {
    try {
        const parts = String(token || '').split('.');
        if (parts.length < 2) return null;
        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
        const decoded = atob(padded);
        return JSON.parse(decoded);
    } catch (error) {
        return null;
    }
}

function ensureArtistProfileToken() {
    const token = getAuthToken();
    const artistId = localStorage.getItem('artistId') || '';
    const tokenPayload = decodeJwtPayload(token);
    const tokenType = String(tokenPayload?.tipus || '').toLowerCase();
    const tokenId = Number.parseInt(tokenPayload?.id || '0', 10);
    const userType = String(localStorage.getItem('userType') || '').toLowerCase();
    
    if (!token) {
        alert('Tu sesion ha expirado. Inicia sesion de nuevo.');
        window.location.replace('/login.html');
        return '';
    }
    
    // El token es la fuente de verdad para el tipo de cuenta.
    if (tokenType !== 'artista') {
        alert('Solo los artistas pueden acceder a esta pagina.');
        window.location.replace('/home.html');
        return '';
    }
    
    // Verificar que hay un ID de artista
    if (!artistId || Number.parseInt(artistId, 10) <= 0) {
        alert('Tu sesion no tiene un ID de artista valido.');
        window.location.replace('/login.html');
        return '';
    }

    // Sincroniza ids locales con el id real del token para evitar cruces de sesion.
    if (Number.isFinite(tokenId) && tokenId > 0 && Number.parseInt(artistId, 10) !== tokenId) {
        localStorage.setItem('artistId', String(tokenId));
        localStorage.setItem('userId', String(tokenId));
        localStorage.setItem('id_usuario', String(tokenId));
        localStorage.setItem('id_usuari', String(tokenId));
    }

    if (userType !== 'artista') {
        localStorage.setItem('userType', 'artista');
    }
    
    return token;
}

function initProfileSettingsPage() {
    const aliasForm = document.getElementById('userProfileAliasForm');
    const passwordForm = document.getElementById('userProfilePasswordForm');
    const deleteForm = document.getElementById('userProfileDeleteForm');

    const token = ensureProfileToken();
    if (!token) return;

    const aliasInput = document.getElementById('userProfileAliasInput');
    if (aliasInput) {
        aliasInput.value = localStorage.getItem('userAlias') || '';
    }

    if (aliasForm) {
        aliasForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            upsertPerfilFeedback(aliasForm, '', '');

            const nuevoAlias = (aliasInput?.value || '').trim();
            if (!nuevoAlias) {
                upsertPerfilFeedback(aliasForm, 'error', 'El alias no puede estar vacio.');
                return;
            }

            setFormSubmittingState(aliasForm, true);

            try {
                const response = await fetch(`${API_URL}/actualizar-alias`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ nuevoAlias })
                });

                const data = await readJsonSafe(response);
                if (!response.ok || data?.success === false) {
                    upsertPerfilFeedback(aliasForm, 'error', data?.message || 'No se pudo actualizar el alias.');
                    return;
                }

                const aliasFinal = String(data?.nuevoAlias || nuevoAlias).trim();
                localStorage.setItem('userAlias', aliasFinal);
                upsertPerfilFeedback(aliasForm, 'success', data?.message || 'Alias actualizado correctamente.');
            } catch (error) {
                upsertPerfilFeedback(aliasForm, 'error', error?.message || 'Error de conexion con el servidor.');
            } finally {
                setFormSubmittingState(aliasForm, false);
            }
        });
    }

    if (passwordForm) {
        passwordForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            upsertPerfilFeedback(passwordForm, '', '');

            const contrasyaActual = document.getElementById('userProfileCurrentPasswordInput')?.value || '';
            const nuevaContrasenya = document.getElementById('userProfileNewPasswordInput')?.value || '';
            const verificarContrasenya = document.getElementById('userProfileConfirmPasswordInput')?.value || '';

            if (!contrasyaActual || !nuevaContrasenya || !verificarContrasenya) {
                upsertPerfilFeedback(passwordForm, 'error', 'Todos los campos son requeridos.');
                return;
            }

            if (nuevaContrasenya.length < 8) {
                upsertPerfilFeedback(passwordForm, 'error', 'La nueva contraseña debe tener al menos 8 caracteres.');
                return;
            }

            if (nuevaContrasenya !== verificarContrasenya) {
                upsertPerfilFeedback(passwordForm, 'error', 'Las nuevas contraseñas no coinciden.');
                return;
            }

            setFormSubmittingState(passwordForm, true);

            try {
                const response = await fetch(`${API_URL}/actualizar-contrasenya`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        contrasyaActual,
                        nuevaContrasenya,
                        verificarContrasenya
                    })
                });

                const data = await readJsonSafe(response);
                if (!response.ok || data?.success === false) {
                    upsertPerfilFeedback(passwordForm, 'error', data?.message || 'No se pudo cambiar la contraseña.');
                    return;
                }

                passwordForm.reset();
                upsertPerfilFeedback(passwordForm, 'success', data?.message || 'Contraseña actualizada correctamente.');
            } catch (error) {
                upsertPerfilFeedback(passwordForm, 'error', error?.message || 'Error de conexion con el servidor.');
            } finally {
                setFormSubmittingState(passwordForm, false);
            }
        });
    }

    if (deleteForm) {
        deleteForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            upsertPerfilFeedback(deleteForm, '', '');

            const contrasenya = document.getElementById('userProfileDeletePasswordInput')?.value || '';
            if (!contrasenya) {
                upsertPerfilFeedback(deleteForm, 'error', 'Debes confirmar tu contraseña para eliminar la cuenta.');
                return;
            }

            const confirmed = window.confirm('Esta accion eliminara tu cuenta y todos tus datos. ¿Seguro que quieres continuar?');
            if (!confirmed) return;

            setFormSubmittingState(deleteForm, true);

            try {
                const response = await fetch(`${API_URL}/eliminar-cuenta`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ contrasenya })
                });

                const data = await readJsonSafe(response);
                if (!response.ok || data?.success === false) {
                    upsertPerfilFeedback(deleteForm, 'error', data?.message || 'No se pudo eliminar la cuenta.');
                    return;
                }

                alert(data?.message || 'Tu cuenta ha sido eliminada correctamente.');
                logout();
            } catch (error) {
                upsertPerfilFeedback(deleteForm, 'error', error?.message || 'Error de conexion con el servidor.');
            } finally {
                setFormSubmittingState(deleteForm, false);
            }
        });
    }
}

function initArtistProfileSettingsPage() {
    const nameForm = document.getElementById('artistProfileNameForm');
    const passwordForm = document.getElementById('artistProfilePasswordForm');
    const deleteForm = document.getElementById('artistProfileDeleteForm');

    const token = ensureArtistProfileToken();
    if (!token) return;

    const nameInput = document.getElementById('artistProfileNameInput');
    if (nameInput) {
        nameInput.value = localStorage.getItem('userName') || '';
    }

    if (nameForm) {
        nameForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            upsertPerfilFeedback(nameForm, '', '');

            const nuevoNom = (nameInput?.value || '').trim();
            if (!nuevoNom) {
                upsertPerfilFeedback(nameForm, 'error', 'El nombre no puede estar vacio.');
                return;
            }

            setFormSubmittingState(nameForm, true);

            try {
                const response = await fetch(`${API_URL}/actualizar-nom-artista`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ nuevoNom })
                });

                const data = await readJsonSafe(response);
                console.log('[ARTIST PROFILE] /actualizar-nom-artista status:', response.status);
                if (!response.ok || data?.success === false) {
                    upsertPerfilFeedback(nameForm, 'error', data?.message || 'No se pudo actualizar el nombre.');
                    return;
                }

                const nomFinal = String(data?.nuevoNom || nuevoNom).trim();
                localStorage.setItem('userName', nomFinal);
                upsertPerfilFeedback(nameForm, 'success', data?.message || 'Nombre actualizado correctamente.');
            } catch (error) {
                upsertPerfilFeedback(nameForm, 'error', error?.message || 'Error de conexion con el servidor.');
            } finally {
                setFormSubmittingState(nameForm, false);
            }
        });
    }

    if (passwordForm) {
        passwordForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            upsertPerfilFeedback(passwordForm, '', '');

            const contrasyaActual = document.getElementById('artistProfileCurrentPasswordInput')?.value || '';
            const nuevaContrasenya = document.getElementById('artistProfileNewPasswordInput')?.value || '';
            const verificarContrasenya = document.getElementById('artistProfileConfirmPasswordInput')?.value || '';

            if (!contrasyaActual || !nuevaContrasenya || !verificarContrasenya) {
                upsertPerfilFeedback(passwordForm, 'error', 'Todos los campos son requeridos.');
                return;
            }

            if (nuevaContrasenya.length < 8) {
                upsertPerfilFeedback(passwordForm, 'error', 'La nueva contraseña debe tener al menos 8 caracteres.');
                return;
            }

            if (nuevaContrasenya !== verificarContrasenya) {
                upsertPerfilFeedback(passwordForm, 'error', 'Las nuevas contraseñas no coinciden.');
                return;
            }

            setFormSubmittingState(passwordForm, true);

            try {
                const response = await fetch(`${API_URL}/actualizar-contrasenya-artista`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        contrasyaActual,
                        nuevaContrasenya,
                        verificarContrasenya
                    })
                });

                const data = await readJsonSafe(response);
                console.log('[ARTIST PROFILE] /actualizar-contrasenya-artista status:', response.status);
                if (!response.ok || data?.success === false) {
                    upsertPerfilFeedback(passwordForm, 'error', data?.message || 'No se pudo cambiar la contraseña.');
                    return;
                }

                passwordForm.reset();
                upsertPerfilFeedback(passwordForm, 'success', data?.message || 'Contraseña actualizada correctamente.');
            } catch (error) {
                upsertPerfilFeedback(passwordForm, 'error', error?.message || 'Error de conexion con el servidor.');
            } finally {
                setFormSubmittingState(passwordForm, false);
            }
        });
    }

    if (deleteForm) {
        deleteForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            upsertPerfilFeedback(deleteForm, '', '');

            const contrasenya = document.getElementById('artistProfileDeletePasswordInput')?.value || '';
            if (!contrasenya) {
                upsertPerfilFeedback(deleteForm, 'error', 'Debes confirmar tu contraseña para eliminar la cuenta.');
                return;
            }

            const confirmed = window.confirm('Esta accion eliminara tu cuenta, todas tus canciones y albumes. ¿Seguro que quieres continuar?');
            if (!confirmed) return;

            setFormSubmittingState(deleteForm, true);

            try {
                const response = await fetch(`${API_URL}/eliminar-cuenta-artista`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ contrasenya })
                });

                const data = await readJsonSafe(response);
                console.log('[ARTIST PROFILE] /eliminar-cuenta-artista status:', response.status);
                if (!response.ok || data?.success === false) {
                    upsertPerfilFeedback(deleteForm, 'error', data?.message || 'No se pudo eliminar la cuenta.');
                    return;
                }

                alert(data?.message || 'Tu cuenta ha sido eliminada correctamente.');
                logout();
            } catch (error) {
                upsertPerfilFeedback(deleteForm, 'error', error?.message || 'Error de conexion con el servidor.');
            } finally {
                setFormSubmittingState(deleteForm, false);
            }
        });
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
    const starTitle = starPopup?.querySelector('h3');
    const starDescription = starPopup?.querySelector('p');

    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }

    const getRandomSongsQueue = async () => {
        const songsFromCards = getSongQueueFromCards();
        if (songsFromCards.length > 0) return songsFromCards;

        const response = await fetch(`${API_URL}/cancons`, {
            method: 'GET',
            cache: 'no-store'
        });

        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(result?.message || `Error ${response.status} al cargar canciones`);
        }

        const songs = Array.isArray(result)
            ? result
            : Array.isArray(result?.data)
                ? result.data
                : Array.isArray(result?.rows)
                    ? result.rows
                    : Array.isArray(result?.canciones)
                        ? result.canciones
                        : [];

        return songs.map((song) => {
            const idCanco = Number(song?.id_canco || song?.id || 0);
            return {
                song: song?.titol || song?.nom || song?.titulo || 'Sin titulo',
                artist: song?.artista || song?.nom_artista || 'Desconocido',
                genre: song?.genere || song?.genero || '',
                id_canco: idCanco,
                cover: idCanco > 0 ? `${API_URL}/imatge/${idCanco}` : '',
                audioSrc: idCanco > 0 ? `${API_URL}/audio/${idCanco}` : ''
            };
        });
    };

    if (starButton && starPopup) {
        starButton.addEventListener('click', async () => {
            try {
                const queue = await getRandomSongsQueue();
                if (queue.length === 0) {
                    if (starTitle) starTitle.textContent = 'No hay canciones';
                    if (starDescription) starDescription.textContent = 'Todavia no hay canciones disponibles para elegir una random.';
                    starPopup.classList.add('open');
                    return;
                }

                const randomIndex = Math.floor(Math.random() * queue.length);
                const randomSong = queue[randomIndex];

                startGlobalPlayback(queue, randomIndex, true);

                if (starTitle) starTitle.textContent = 'Tu random de hoy';
                if (starDescription) {
                    starDescription.textContent = `${randomSong.song} - ${randomSong.artist}`;
                }

                starPopup.classList.add('open');
            } catch (error) {
                console.error('No se pudo obtener una cancion random.', error);
                if (starTitle) starTitle.textContent = 'Error';
                if (starDescription) {
                    starDescription.textContent = 'No se pudo obtener una cancion aleatoria en este momento.';
                }
                starPopup.classList.add('open');
            }
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

async function fetchMisAlbumsFromApi() {
    const token = getAuthToken();
    if (!token) {
        throw new Error('No hay sesion activa. Inicia sesion para gestionar albumes.');
    }

    const currentArtistId = Number(getCurrentArtistId() || 0);
    const currentUserId = Number(getCurrentSessionUserId() || 0);

    const response = await fetch(`${API_URL}/mis-albums`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result?.success) {
        throw new Error(result?.message || `Error ${response.status} al cargar albumes`);
    }

    const list = Array.isArray(result?.data)
        ? result.data
        : Array.isArray(result?.data?.albums)
            ? result.data.albums
            : Array.isArray(result?.data?.albumes)
                ? result.data.albumes
                : Array.isArray(result?.albums)
                    ? result.albums
                    : [];
    const mapped = list.map((album) => {
        const rawSongs = Array.isArray(album?.canciones)
            ? album.canciones
            : Array.isArray(album?.cancons)
                ? album.cancons
                : Array.isArray(album?.songs)
                    ? album.songs
                    : Array.isArray(album?.canciones_album)
                        ? album.canciones_album
                        : [];

        const songs = rawSongs
            .map((song) => {
                const idCanco = Number(song?.id_canco || song?.id || 0);
                const titol = song?.titol || song?.nom || song?.titulo || 'Cancion';
                const artista = song?.artista || song?.nom_artista || 'Desconocido';

                return {
                    id_canco: idCanco,
                    song: titol,
                    artist: artista,
                    titol,
                    nom: titol,
                    artista,
                    album: album?.nom || album?.nom_album || album?.name || 'Album',
                    genre: song?.genere || song?.genero || song?.genre || '',
                    cover: idCanco > 0 ? `${API_URL}/imatge/${idCanco}` : '',
                    audioSrc: idCanco > 0 ? `${API_URL}/audio/${idCanco}` : ''
                };
            })
            .filter((song) => (song.song || '').trim().length > 0);

        const ownerIdRaw = Number(
            album?.id_artista
            || album?.id_artist
            || album?.artist_id
            || album?.id_user
            || album?.id_usuari
            || album?.user_id
            || 0
        );

        return {
            id_album: Number(album?.id_album || album?.id || 0),
            nom: album?.nom || album?.nom_album || album?.name || 'Album',
            owner_id: Number.isFinite(ownerIdRaw) ? ownerIdRaw : 0,
            total_cancons: Number(
                album?.total_cancons
                || album?.total_canciones
                || album?.total_cancons_album
                || songs.length
                || 0
            ),
            canciones: songs
        };
    }).filter((album) => album.id_album > 0);

    // Defensive filter: if owner id is present in payload, keep only logged-in artist albums.
    const hasOwnerData = mapped.some((album) => album.owner_id > 0);
    if (!hasOwnerData) return mapped;

    const expectedOwnerId = currentArtistId > 0 ? currentArtistId : currentUserId;
    if (!Number.isFinite(expectedOwnerId) || expectedOwnerId <= 0) return mapped;

    return mapped.filter((album) => album.owner_id === expectedOwnerId);
}

async function crearAlbum(nomAlbumParam) {
    const nomAlbum = (nomAlbumParam ?? prompt('Nom del nou alubm:') ?? '').trim();
    if (!nomAlbum) return { success: false, reason: 'empty-name' };

    const token = getAuthToken();
    if (!token) {
        alert('Has d\'iniciar sessio per crear albumes.');
        return { success: false, reason: 'missing-token' };
    }

    const currentUserId = getCurrentSessionUserId();
    const currentArtistId = Number(getCurrentArtistId() || 0);
    const payload = { nom: nomAlbum };

    if (currentUserId > 0) {
        payload.id_usuario = currentUserId;
        payload.id_user = currentUserId;
    }

    if (currentArtistId > 0) {
        payload.id_artista = currentArtistId;
        payload.artist_id = currentArtistId;
    }

    try {
        const response = await fetch(`${API_URL}/crear-album`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data?.success) {
            const message = data?.message || `Error ${response.status} al crear album`;
            alert(message);
            return { success: false, reason: 'api-error', message };
        }

        alert('Album creat correctament!');
        return { success: true, data };
    } catch (error) {
        console.error('Error:', error);
        return { success: false, reason: 'network-error', message: error?.message };
    }
}

async function afegirAAlbum(idAlbum, idCanco) {
    const token = getAuthToken();
    if (!token) {
        alert('Has d\'iniciar sessio per afegir cancons a l\'album.');
        return { success: false, reason: 'missing-token' };
    }

    try {
        const response = await fetch(`${API_URL}/afegir-a-album`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ id_album: idAlbum, id_canco: idCanco })
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data?.success) {
            const message = data?.message || `Error ${response.status} al afegir canco a album`;
            alert(message);
            return { success: false, reason: 'api-error', message };
        }

        alert('Canco afegida!');
        return { success: true, data };
    } catch (error) {
        console.error('Error:', error);
        return { success: false, reason: 'network-error', message: error?.message };
    }
}

async function eliminarAlbum(idAlbum) {
    const token = getAuthToken();
    if (!token) {
        alert('Has d\'iniciar sessio per eliminar albumes.');
        return { success: false, reason: 'missing-token' };
    }

    const safeId = Number(idAlbum);
    if (!Number.isFinite(safeId) || safeId <= 0) {
        return { success: false, reason: 'invalid-id', message: 'ID d\'album no valid.' };
    }

    try {
        const response = await fetch(`${API_URL}/eliminar-album/${safeId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data?.success) {
            const message = data?.message || `Error ${response.status} al eliminar album`;
            return { success: false, reason: 'api-error', message };
        }

        return { success: true, data };
    } catch (error) {
        return { success: false, reason: 'network-error', message: error?.message };
    }
}

async function renderizarMisAlbums() {
    const contenedor = document.getElementById('lista-albums') || document.getElementById('artistAlbumGrid');
    const createCard = document.getElementById('artistCreateAlbumCard');
    const badge = document.getElementById('artistAlbumCountBadge');
    const empty = document.getElementById('artistAlbumEmpty');
    if (!contenedor) return [];

    const previous = Array.from(contenedor.querySelectorAll('.artist-album-card, .card-album'));
    previous.forEach((node) => node.remove());

    try {
        const albums = await fetchMisAlbumsFromApi();

        albums.forEach((album) => {
            const songs = Array.isArray(album.canciones) ? album.canciones : [];
            const songCount = Number(album.total_cancons || songs.length || 0);
            const card = document.createElement('article');
            card.className = 'playlist-card artist-album-card card-album';

            const songList = songs.length > 0
                ? songs.map((song) => `<li>${song.song}</li>`).join('')
                : '<li>Aquest album esta buit...</li>';

            card.innerHTML = `
                <h3>${album.nom}</h3>
                <p class="playlist-card-meta">${songCount} cancion${songCount === 1 ? '' : 'es'}</p>
                <p class="playlist-card-preview">Canciones del album:</p>
                <div class="playlist-card-actions">
                    <button type="button" class="playlist-card-btn" data-action="delete-album"><i class="fa-solid fa-trash" aria-hidden="true"></i><span>Eliminar</span></button>
                </div>
                <div class="playlist-card-songs" data-role="album-songs">
                    <ul>${songList}</ul>
                </div>
            `;

            const deleteBtn = card.querySelector('[data-action="delete-album"]');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', async () => {
                    const confirmed = window.confirm(`Vols eliminar l\'album "${album.nom}"? Aquesta accio no es pot desfer.`);
                    if (!confirmed) return;

                    const result = await eliminarAlbum(album.id_album);
                    if (!result.success) {
                        alert(result.message || 'No se pudo eliminar el album.');
                        return;
                    }

                    await renderizarMisAlbums();
                });
            }

            if (createCard) {
                contenedor.insertBefore(card, createCard);
            } else {
                contenedor.appendChild(card);
            }
        });

        if (badge) badge.textContent = `${albums.length} album${albums.length === 1 ? '' : 'es'}`;
        if (empty) empty.hidden = albums.length > 0;

        return albums;
    } catch (error) {
        console.error('Error cargando albumes:', error);
        if (badge) badge.textContent = '0 albumes';
        if (empty) {
            empty.hidden = false;
            empty.textContent = 'No se pudieron cargar tus albumes.';
        }
        return [];
    }
}

function getArtistAlbums() {
    const artistId = getCurrentArtistId();
    return getArtistAlbumsStore()
        .filter((album) => Number(album.id_artista) === artistId)
        .map((album) => ({
            id_album: Number(album.id_album) || 0,
            id_artista: artistId,
            nom: album.nom || 'Album'
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
        nom: name
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

function getCurrentSessionUserId() {
    const fromStorage = Number.parseInt(
        localStorage.getItem('userId')
        || localStorage.getItem('artistId')
        || localStorage.getItem('id_usuario')
        || localStorage.getItem('id_usuari')
        || localStorage.getItem('id_user')
        || '0',
        10
    );

    return Number.isFinite(fromStorage) && fromStorage > 0 ? fromStorage : 0;
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

function normalizeArtistSongItem(song, fallbackArtistId = 0) {
    const idCanco = Number(song?.id_canco || song?.id || 0);
    const idArtistaRaw = Number(
        song?.id_artista
        || song?.artist_id
        || song?.id_artist
        || song?.id_user
        || song?.id_usuari
        || song?.user_id
        || fallbackArtistId
        || 0
    );
    const titol = song?.titol || song?.nom || song?.titulo || song?.title || 'Cancion';
    const artista = song?.artista || song?.nom_artista || song?.artist || localStorage.getItem('userName') || 'Artista';

    return {
        id_canco: idCanco,
        nom: titol,
        id_artista: Number.isFinite(idArtistaRaw) ? idArtistaRaw : fallbackArtistId,
        imagen: song?.imagen || song?.imatge || '',
        audio_src: song?.audio_src || song?.audioSrc || '',
        audio_name: song?.audio_name || song?.nom_arxiu || '',
        duration: Number(song?.duration || song?.duracion || 0) || 0,
        id_genere: Number(song?.id_genere || song?.genre_id || 0) || 0,
        genre_name: song?.genre_name || song?.genere_nom || song?.genere || song?.genero || getArtistGenreName(song?.id_genere),
        views: Number(song?.views || song?.visualitzacions || 0) || 0,
        artist: artista
    };
}

async function fetchMisCanconsFromApi() {
    const token = getAuthToken();
    if (!token) {
        throw new Error('No hay sesion activa. Inicia sesion para gestionar canciones.');
    }

    const currentArtistId = Number(getCurrentArtistId() || 0);
    const currentUserId = Number(getCurrentSessionUserId() || 0);

    const response = await fetch(`${API_URL}/mis-cancons`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    const result = await response.json().catch(() => ({}));
    if (response.status === 404) {
        return getArtistSongs();
    }

    if (!response.ok || !result?.success) {
        throw new Error(result?.message || `Error ${response.status} al cargar canciones`);
    }

    const list = Array.isArray(result?.data) ? result.data : [];
    const mapped = list.map((song) => normalizeArtistSongItem(song, currentArtistId)).filter((song) => song.id_canco > 0);

    const hasOwnerData = list.some((song) => {
        const ownerId = Number(
            song?.id_artista
            || song?.artist_id
            || song?.id_artist
            || song?.id_user
            || song?.id_usuari
            || song?.user_id
            || 0
        );
        return Number.isFinite(ownerId) && ownerId > 0;
    });

    if (!hasOwnerData) {
        return mapped;
    }

    const expectedOwnerId = currentArtistId > 0 ? currentArtistId : currentUserId;
    if (!Number.isFinite(expectedOwnerId) || expectedOwnerId <= 0) return mapped;

    return mapped.filter((song) => Number(song.id_artista) === expectedOwnerId);
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

async function renderizarMisCancons() {
    const empty = document.getElementById('artistSongsEmpty');
    const addWrap = document.getElementById('artistAddSongWrap');
    const wrap = document.getElementById('artistSongsWrap');
    const grid = document.getElementById('artistSongsGrid');
    const ranking = document.getElementById('artistViewsRanking');
    const rankingPanel = ranking ? ranking.closest('aside') : null;

    if (!empty || !addWrap || !wrap || !grid || !ranking) return [];

    const token = getAuthToken();
    if (!token) {
        empty.hidden = false;
        addWrap.hidden = false;
        wrap.hidden = true;
        if (rankingPanel) rankingPanel.hidden = true;
        grid.innerHTML = '';
        ranking.innerHTML = '';
        return [];
    }

    grid.innerHTML = '<p class="buscar-empty" style="grid-column: 1 / -1; color: #fff;">Cargando tus canciones...</p>';

    try {
        const songs = (await fetchMisCanconsFromApi()).sort((a, b) => b.views - a.views);

        if (songs.length === 0) {
            empty.hidden = false;
            addWrap.hidden = false;
            wrap.hidden = true;
            if (rankingPanel) rankingPanel.hidden = true;
            grid.innerHTML = '';
            ranking.innerHTML = '';
            return [];
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
        return songs;
    } catch (error) {
        console.error('Error cargando las canciones del artista:', error);
        empty.hidden = false;
        addWrap.hidden = false;
        wrap.hidden = true;
        if (rankingPanel) rankingPanel.hidden = true;
        grid.innerHTML = '';
        ranking.innerHTML = '';
        empty.textContent = error?.message || 'No se pudieron cargar tus canciones.';
        return [];
    }
}

function initArtistHomeSongs() {
    renderizarMisCancons();
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

async function openArtistAlbumPopover(anchorElement, songId) {
    const popover = createArtistAlbumPopover();
    initArtistAlbumPopoverDismiss();

    popover.innerHTML = '';

    const title = document.createElement('p');
    title.className = 'artist-album-popover-title';
    title.textContent = 'Anadir cancion a album';
    popover.appendChild(title);

    const loading = document.createElement('p');
    loading.className = 'artist-album-popover-empty';
    loading.textContent = 'Carregant albumes...';
    popover.appendChild(loading);

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

    let albums = [];
    try {
        albums = await fetchMisAlbumsFromApi();
    } catch (error) {
        popover.innerHTML = '';
        popover.appendChild(title);
        const fail = document.createElement('p');
        fail.className = 'artist-album-popover-empty';
        fail.textContent = error?.message || 'No se pudieron cargar los albumes.';
        popover.appendChild(fail);
        return;
    }

    popover.innerHTML = '';
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
            option.addEventListener('click', async () => {
                const result = await afegirAAlbum(album.id_album, songId);
                if (result.success) {
                    showArtistAlbumFeedback(popover, `Cancion anadida a ${album.nom}.`);
                    setTimeout(closeArtistAlbumPopover, 650);
                    return;
                }

                showArtistAlbumFeedback(popover, result.message || 'No se pudo anadir la cancion al album.');
            });
            list.appendChild(option);
        });

        popover.appendChild(list);

        const feedback = document.createElement('p');
        feedback.className = 'artist-album-popover-feedback';
        feedback.id = 'artistAlbumPopoverFeedback';
        popover.appendChild(feedback);
    }

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
    const preview = songs.slice(0, 3).map((song) => song.nom).join(' • ');

    return `
        <article class="artist-album-card" aria-label="Album ${album.nom}">
            <h3>${album.nom}</h3>
            <p class="artist-album-meta">${songs.length} cancion${songs.length === 1 ? '' : 'es'}</p>
            <p class="artist-album-preview">${preview || 'Aun no tiene canciones asignadas.'}</p>
        </article>
    `;
}

function initArtistAlbumPage() {
    const grid = document.getElementById('artistAlbumGrid');
    const form = document.getElementById('artistAlbumForm');
    const formFeedback = document.getElementById('artistAlbumFormFeedback');
    if (!grid || !form || !formFeedback) return;

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const nom = document.getElementById('albumName')?.value?.trim() || '';
        const result = await crearAlbum(nom);
        if (!result.success) {
            formFeedback.textContent = result.message || 'No se pudo crear el album.';
            return;
        }

        formFeedback.textContent = 'Album creado correctamente.';
        form.reset();
        await renderizarMisAlbums();
    });

    renderizarMisAlbums();
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

    const applyStats = (stats) => {
        setText('adminTotalUsers', formatPlayCount(Number(stats.users.total) || 0));
        setText('adminUsersTrend', stats.users.trend);
        setText('adminTotalArtists', formatPlayCount(Number(stats.artists.total) || 0));
        setText('adminArtistsTrend', stats.artists.trend);
        setText('adminTotalSongs', formatPlayCount(Number(stats.songs.total) || 0));
        setText('adminSongsTrend', stats.songs.trend);
        setText('adminTotalPlaylists', formatPlayCount(Number(stats.playlists.total) || 0));
        setText('adminPlaylistsTrend', stats.playlists.trend);
        setText('adminTotalAlbums', formatPlayCount(Number(stats.albums.total) || 0));
        setText('adminAlbumsTrend', stats.albums.trend);
        setText('adminStatsUpdated', stats.updatedLabel);
        setText('adminPeriodBadge', stats.periodLabel);
        renderList('adminTopGenres', stats.topGenres);
    };

    const mapApiStatsToViewModel = (payload) => {
        const topGeneros = Array.isArray(payload?.topGeneros)
            ? payload.topGeneros
            : [];

        return {
            users: { total: Number(payload?.totalUsuarios) || 0, trend: 'Total acumulado' },
            artists: { total: Number(payload?.totalArtistas) || 0, trend: 'Total acumulado' },
            songs: { total: Number(payload?.totalCanciones) || 0, trend: 'Total acumulado' },
            playlists: { total: Number(payload?.totalPlaylists) || 0, trend: 'Total acumulado' },
            albums: { total: Number(payload?.totalAlbumes) || 0, trend: 'Total acumulado' },
            updatedLabel: `Actualizado: ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`,
            periodLabel: `Top ${Math.max(topGeneros.length, 1)}`,
            topGenres: topGeneros.length > 0
                ? topGeneros.map((row, index) => {
                    const name = row.nombre || row.nom || 'Genero sin nombre';
                    const songs = Number(row.canciones || row.total_canciones || 0);
                    return {
                        label: `${index + 1}. ${name}`,
                        value: `${formatPlayCount(songs)} canciones`
                    };
                })
                : [{ label: 'Sin datos', value: '0 canciones' }]
        };
    };

    applyStats(ADMIN_DEFAULT_STATS);

    const token = getAuthToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    fetch(`${API_URL}/admin/stats`, {
        method: 'GET',
        headers,
        cache: 'no-store'
    })
        .then(async (response) => {
            const result = await response.json().catch(() => ({}));
            if (!response.ok || result?.success === false) {
                throw new Error(result?.message || `Error ${response.status} al obtener estadisticas`);
            }

            const stats = mapApiStatsToViewModel(result);
            applyStats(stats);
        })
        .catch((error) => {
            console.error('Error cargando estadisticas de admin:', error);
            setText('adminStatsUpdated', 'No se pudo actualizar desde el servidor');
        });
}


function initPlaylistQuickSave() {
    const songActionRows = Array.from(document.querySelectorAll('.song-card .song-actions'));
    if (songActionRows.length === 0) return;

    songActionRows.forEach((row) => {
        let addButton = row.querySelector('.playlist-add-btn');

        if (!addButton) {
            addButton = document.createElement('button');
            addButton.type = 'button';
            addButton.className = 'song-action-btn playlist-add-btn';
            addButton.setAttribute('aria-label', 'Guardar en playlist');
            addButton.textContent = '+';
            row.appendChild(addButton);
        }

        if (addButton.dataset.playlistBound === 'true') return;
        addButton.dataset.playlistBound = 'true';

        addButton.addEventListener('click', async (event) => {
            event.stopPropagation();

            const card = addButton.closest('.song-card');
            if (!card) return;

            const songData = extractSongFromCard(card);
            const idCanco = Number(songData.id_canco || songData.idCanco || card.dataset.idCanco || card.dataset.songId || 0);
            if (!Number.isFinite(idCanco) || idCanco <= 0) {
                alert('No s\'ha trobat l\'ID de la canço.');
                return;
            }

            await openPlaylistPopover(addButton, {
                ...songData,
                id_canco: idCanco,
                idCanco
            });
        });
    });
}

function getSongInfo(songData) {
    const song = (songData.song || 'Cancion').trim();
    const artist = (songData.artist || 'Artista').trim();
    const album = (songData.album || 'Single').trim();
    const genre = (songData.genre || 'Pop').trim();
    const year = (songData.year || 'N/D').trim();
    const duration = (songData.duration || 'N/D').trim();
    const cover = String(songData.cover || '').trim();
    const plays = Number(songData.plays || 0);

    return {
        song,
        artist,
        album,
        genre,
        year,
        duration,
        cover,
        plays: plays > 0 ? formatPlayCount(plays) : 'N/D'
    };
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
        if (artistEl) {
            artistEl.textContent = artistText;
        }
    });
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

async function afegirCancoAPlaylist(idPlaylist, idCanco) {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error("Has d'iniciar sessió per afegir cançons a una playlist.");
    }

    const response = await fetch(`${API_URL}/afegir-a-playlist`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            id_playlist: idPlaylist,
            id_canco: idCanco
        })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data?.success) {
        throw new Error(data?.message || `Error ${response.status} al afegir la cançó`);
    }

    return data;
}

function renderPlaylistPopoverContent(popover, songData, playlists = []) {
    popover.innerHTML = '';

    const title = document.createElement('p');
    title.className = 'playlist-popover-title';
    title.textContent = `Afegir "${songData.song || 'Canço'}"`;
    popover.appendChild(title);

    const list = document.createElement('div');
    list.className = 'playlist-popover-list';

    if (!Array.isArray(playlists) || playlists.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'playlist-popover-feedback';
        empty.textContent = 'No tens playlists creades encara.';
        popover.appendChild(empty);
        return;
    }

    playlists.forEach((playlist) => {
        const option = document.createElement('button');
        option.type = 'button';
        option.className = 'playlist-popover-option';
        option.textContent = playlist.nom;

        option.addEventListener('click', async () => {
            try {
                const idPlaylist = Number(playlist.id_playlist || 0);
                const idCanco = Number(songData.id_canco || songData.idCanco || 0);
                if (!idPlaylist || !idCanco) {
                    throw new Error('No s\'ha pogut identificar la playlist o la cançó.');
                }

                await afegirCancoAPlaylist(idPlaylist, idCanco);
                alert(`Cançó afegida a "${playlist.nom}"!`);
                closePlaylistPopover();
            } catch (error) {
                const feedback = popover.querySelector('#playlistPopoverFeedback');
                if (feedback) feedback.textContent = error?.message || 'No s\'ha pogut afegir la cançó.';
            }
        });

        list.appendChild(option);
    });

    popover.appendChild(list);

    const feedback = document.createElement('p');
    feedback.className = 'playlist-popover-feedback';
    feedback.id = 'playlistPopoverFeedback';
    popover.appendChild(feedback);
}

async function openPlaylistPopover(anchorElement, songData) {
    initPlaylistPopoverDismiss();
    const popover = createPlaylistPopover();

    popover.innerHTML = '<p class="playlist-popover-feedback">Carregant playlists...</p>';
    popover.hidden = false;
    popover.style.visibility = 'hidden';

    const rect = anchorElement.getBoundingClientRect();
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

    try {
        const playlists = await fetchMisPlaylists();
        renderPlaylistPopoverContent(popover, songData, playlists);
    } catch (error) {
        popover.innerHTML = `<p class="playlist-popover-feedback">${error?.message || 'No s\'han pogut carregar les playlists.'}</p>`;
    }
}

async function afegirAPlaylist(idCanco) {
    const nomPlaylist = prompt('Introdueix el nom de la teva Playlist:');
    if (!nomPlaylist) return;

    const token = localStorage.getItem('token');
    if (!token) {
        alert("Has d'iniciar sessió per afegir cançons a una playlist.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/crear-playlist`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                nom_playlist: nomPlaylist,
                id_canco: idCanco
            })
        });

        const data = await response.json();
        if (data.success) {
            const nomResposta = data?.playlist?.nom || data?.nom_playlist || nomPlaylist;
            const idPlaylist = data?.playlist?.id ?? data?.id_playlist ?? 'N/A';
            alert(`Afegit correctament!\nPlaylist: ${nomResposta}\nID playlist: ${idPlaylist}\nID canco: ${idCanco}`);
        } else {
            alert("Error: " + data.message);
        }
    } catch (error) {
        console.error('Error de connexió:', error);
        alert("No s'ha pogut connectar amb el servidor.");
    }
}

async function crearPlaylist(event) {
    event.preventDefault();

    const playlistInput = document.getElementById('input-nom-playlist');
    const nomPlaylist = (playlistInput?.value || '').trim();
    const token = localStorage.getItem('token');

    if (!nomPlaylist) {
        alert('Introdueix un nom de playlist.');
        return { success: false };
    }

    if (!token) {
        alert("Has d'iniciar sessió per crear una playlist.");
        return { success: false };
    }

    try {
        const response = await fetch(`${API_URL}/crear-playlist`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                nom: nomPlaylist
            })
        });

        const result = await response.json();

        if (result.success) {
            const nomCreada = result?.playlist?.nom || nomPlaylist;
            const idCreada = result?.playlist?.id ?? result?.id_playlist ?? 'N/A';
            const missatge = result?.message || 'Playlist creada correctament';
            alert(`${missatge}\nNom: ${nomCreada}\nID: ${idCreada}`);
            return { success: true, nom: nomCreada, id: idCreada };
        } else {
            alert("Error: " + result.message);
            return { success: false, message: result?.message };
        }

    } catch (error) {
        console.error("Error de connexió:", error);
        alert("No s'ha pogut connectar amb el servidor.");
        return { success: false, message: error?.message };
    }
}

function normalizePlaylistSong(songData, playlistName) {
    const idCanco = Number(songData?.id_canco || songData?.id || 0);
    return {
        song: songData?.titol || songData?.nom || songData?.titulo || songData?.title || 'Cancion',
        artist: songData?.artista || songData?.nom_artista || songData?.artist || 'Desconocido',
        album: songData?.album || '',
        genre: songData?.genere || songData?.genero || songData?.genre || '',
        cover: idCanco > 0 ? `${API_URL}/imatge/${idCanco}` : '',
        audioSrc: idCanco > 0 ? `${API_URL}/audio/${idCanco}` : '',
        id_canco: idCanco,
        playlist: playlistName || ''
    };
}

function normalizePlaylistItem(playlist) {
    const id = Number(playlist?.id_playlist || playlist?.id || 0);
    const nom = String(playlist?.nom || playlist?.nom_playlist || playlist?.name || '').trim();
    const rawSongs = playlist?.canciones || playlist?.cancons || playlist?.songs || [];
    const songs = Array.isArray(rawSongs)
        ? rawSongs.map((song) => normalizePlaylistSong(song, nom))
        : [];
    const totalCancons = Number(playlist?.total_cancons || songs.length || 0);

    return {
        id_playlist: id,
        nom,
        songs,
        total_cancons: Number.isFinite(totalCancons) ? totalCancons : songs.length
    };
}

async function fetchMisPlaylists() {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('Inicia sessió per veure les teves playlists.');
    }

    const response = await fetch(`${API_URL}/mis-playlists`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result?.success) {
        throw new Error(result?.message || `Error ${response.status} al cargar playlists`);
    }

    const data = Array.isArray(result?.data) ? result.data : [];
    return data
        .map((item) => normalizePlaylistItem(item))
        .filter((item) => item.id_playlist > 0 && item.nom);
}

async function eliminarPlaylist(idPlaylist) {
    const token = getAuthToken();
    if (!token) {
        alert('Has d\'iniciar sessio per eliminar playlists.');
        return { success: false, reason: 'missing-token' };
    }

    const safeId = Number(idPlaylist);
    if (!Number.isFinite(safeId) || safeId <= 0) {
        return { success: false, reason: 'invalid-id', message: 'ID de playlist no valid.' };
    }

    try {
        const response = await fetch(`${API_URL}/eliminar-playlist/${safeId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data?.success) {
            const message = data?.message || `Error ${response.status} al eliminar playlist`;
            return { success: false, reason: 'api-error', message };
        }

        return { success: true, data };
    } catch (error) {
        return { success: false, reason: 'network-error', message: error?.message };
    }
}

async function renderizarMisPlaylists() {
    const contenedor = document.getElementById('lista-playlists') || document.getElementById('playlistGrid');
    const playlistCount = document.getElementById('playlistCount');
    const nowPlaying = document.getElementById('playlistNowPlaying');

    if (!contenedor) return [];

    const token = localStorage.getItem('token');
    if (!token) {
        if (playlistCount) playlistCount.textContent = '0 playlists';
        if (nowPlaying) {
            nowPlaying.classList.add('error');
            nowPlaying.textContent = 'Inicia sessió per veure les teves playlists.';
        }
        return [];
    }

    const previousCards = contenedor.querySelectorAll('.playlist-card');
    previousCards.forEach((card) => card.remove());

    try {
        const playlists = await fetchMisPlaylists();

        if (playlists.length === 0) {
            if (playlistCount) playlistCount.textContent = '0 playlists';
            if (nowPlaying) {
                nowPlaying.classList.remove('error');
                nowPlaying.textContent = 'Encara no tens cap playlist creada.';
            }
            return [];
        }

        playlists.forEach((playlist) => {
            const songs = playlist.songs;
            const songCount = Number(playlist.total_cancons || songs.length || 0);

            const card = document.createElement('article');
            card.className = 'playlist-card';

            const songsListHtml = songs.length > 0
                ? songs
                    .map((song) => `<li>${song.song} - ${song.artist}</li>`)
                    .join('')
                : '<li>Aquesta llista esta buida...</li>';

            card.innerHTML = `
                <h3>${playlist.nom}</h3>
                <p class="playlist-card-meta">${songCount} cancion${songCount === 1 ? '' : 'es'}</p>
                <p class="playlist-card-preview">Pulsa "Ver canciones" para ver el listado.</p>
                <div class="playlist-card-actions">
                    <button type="button" class="playlist-card-btn" data-action="play"><i class="fa-solid fa-play" aria-hidden="true"></i><span>Reproducir</span></button>
                    <button type="button" class="playlist-card-btn" data-action="shuffle"><i class="fa-solid fa-shuffle" aria-hidden="true"></i><span>Shuffle</span></button>
                    <button type="button" class="playlist-card-btn" data-action="toggle-songs"><i class="fa-solid fa-list" aria-hidden="true"></i><span>Ver canciones</span></button>
                    <button type="button" class="playlist-card-btn" data-action="delete-playlist"><i class="fa-solid fa-trash" aria-hidden="true"></i><span>Eliminar</span></button>
                </div>
                <div class="playlist-card-songs" data-role="songs" hidden>
                    <ul>${songsListHtml}</ul>
                </div>
            `;

            const playBtn = card.querySelector('[data-action="play"]');
            const shuffleBtn = card.querySelector('[data-action="shuffle"]');
            const toggleSongsBtn = card.querySelector('[data-action="toggle-songs"]');
            const deletePlaylistBtn = card.querySelector('[data-action="delete-playlist"]');
            const songsPanel = card.querySelector('[data-role="songs"]');

            if (playBtn) {
                playBtn.addEventListener('click', () => {
                    if (songCount === 0) {
                        if (nowPlaying) {
                            nowPlaying.classList.add('error');
                            nowPlaying.textContent = `La playlist ${playlist.nom} no tiene canciones.`;
                        }
                        return;
                    }

                    startGlobalPlayback(songs, 0, true);
                    if (nowPlaying) {
                        nowPlaying.classList.remove('error');
                        nowPlaying.textContent = `Reproduciendo: ${songs[0].song} - ${songs[0].artist} (${playlist.nom})`;
                    }
                });
            }

            if (shuffleBtn) {
                shuffleBtn.addEventListener('click', () => {
                    if (songCount === 0) {
                        if (nowPlaying) {
                            nowPlaying.classList.add('error');
                            nowPlaying.textContent = `La playlist ${playlist.nom} no tiene canciones para shuffle.`;
                        }
                        return;
                    }

                    const randomIndex = Math.floor(Math.random() * songCount);
                    startGlobalPlayback(songs, randomIndex, true);
                    const randomSong = songs[randomIndex];
                    if (nowPlaying) {
                        nowPlaying.classList.remove('error');
                        nowPlaying.textContent = `Shuffle: ${randomSong.song} - ${randomSong.artist} (${playlist.nom})`;
                    }
                });
            }

            if (toggleSongsBtn && songsPanel) {
                toggleSongsBtn.addEventListener('click', () => {
                    const isHidden = songsPanel.hidden;
                    songsPanel.hidden = !isHidden;
                    const label = toggleSongsBtn.querySelector('span');
                    if (label) {
                        label.textContent = isHidden ? 'Ocultar canciones' : 'Ver canciones';
                    }
                });
            }

            if (deletePlaylistBtn) {
                deletePlaylistBtn.addEventListener('click', async () => {
                    const confirmed = window.confirm(`Vols eliminar la playlist "${playlist.nom}"? Aquesta accio no es pot desfer.`);
                    if (!confirmed) return;

                    const result = await eliminarPlaylist(playlist.id_playlist);
                    if (!result.success) {
                        alert(result.message || 'No se pudo eliminar la playlist.');
                        return;
                    }

                    await renderizarMisPlaylists();
                });
            }

            contenedor.appendChild(card);
        });

        if (playlistCount) {
            playlistCount.textContent = `${playlists.length} playlist${playlists.length === 1 ? '' : 's'}`;
        }

        return playlists;
    } catch (error) {
        console.error('Error cargando playlists:', error);
        if (playlistCount) playlistCount.textContent = '0 playlists';
        if (nowPlaying) {
            nowPlaying.classList.add('error');
            nowPlaying.textContent = 'Error al carregar les llistes.';
        }
        return [];
    }
}

function initPlaylistPage() {
    const createPlaylistForm = document.getElementById('createPlaylistForm');
    const playlistNameInput = document.getElementById('input-nom-playlist');
    const nowPlaying = document.getElementById('playlistNowPlaying');

    const playlistContainer = document.getElementById('playlistGrid') || document.getElementById('lista-playlists');
    if (!playlistContainer) return;

    if (createPlaylistForm) {
        createPlaylistForm.addEventListener('submit', async (event) => {
            const response = await crearPlaylist(event);
            if (!response?.success) return;

            createPlaylistForm.reset();
            if (playlistNameInput) playlistNameInput.focus();

            await renderizarMisPlaylists();

            if (nowPlaying) {
                nowPlaying.classList.remove('error');
                nowPlaying.textContent = `Playlist creada: ${response.nom}`;
            }
        });
    }

    renderizarMisPlaylists();
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
        <audio id="globalPlayerAudio" preload="none" hidden></audio>
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
        audio: bar.querySelector('#globalPlayerAudio'),
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

        const idCanco = Number(currentSong.id_canco || currentSong.idCanco || 0);
        if (!Number.isFinite(idCanco) || idCanco <= 0) {
            alert('No s\'ha trobat l\'ID de la canço actual.');
            return;
        }

        openPlaylistPopover(event.currentTarget, {
            song: currentSong.song,
            artist: currentSong.artist,
            id_canco: idCanco,
            idCanco
        });
    });

    globalPlayer.volumeInput.addEventListener('input', (event) => {
        globalPlayerState.volume = Number(event.target.value);
        if (globalPlayer.audio) {
            globalPlayer.audio.volume = globalPlayerState.volume / 100;
        }
        updateGlobalPlayerUI();
    });

    if (globalPlayer.audio) {
        globalPlayer.audio.volume = globalPlayerState.volume / 100;
        globalPlayer.audio.addEventListener('ended', () => {
            if (globalPlayerState.queue.length === 0) return;
            moveGlobalTrack(1);
        });
    }
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
    const audioSrc = card.dataset.audioSrc || '';
    const idCanco = Number(card.dataset.idCanco || card.dataset.songId || 0);
    return {
        song,
        artist,
        album,
        genre,
        cover,
        audioSrc,
        id_canco: Number.isFinite(idCanco) ? idCanco : 0
    };
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
    syncGlobalPlayerAudio();
}

function moveGlobalTrack(step) {
    if (globalPlayerState.queue.length === 0) return;
    globalPlayerState.index = (globalPlayerState.index + step + globalPlayerState.queue.length) % globalPlayerState.queue.length;
    globalPlayerState.isPlaying = true;
    globalPlayerState.liked = 0;
    updateGlobalPlayerUI();
    syncGlobalPlayerAudio();
}

function syncGlobalPlayerAudio() {
    if (!globalPlayer?.audio) return;

    const currentSong = getCurrentGlobalSong();
    if (!currentSong) {
        globalPlayer.audio.pause();
        globalPlayer.audio.removeAttribute('src');
        globalPlayer.audio.load();
        return;
    }

    const nextSrc = currentSong.audioSrc || currentSong.audio_src || `${API_URL}/audio/${currentSong.id_canco || ''}`;
    if (globalPlayer.audio.src !== nextSrc) {
        globalPlayer.audio.src = nextSrc;
        globalPlayer.audio.load();
    }

    globalPlayer.audio.volume = globalPlayerState.volume / 100;

    if (globalPlayerState.isPlaying) {
        const playPromise = globalPlayer.audio.play();
        if (playPromise?.catch) {
            playPromise.catch((error) => {
                console.warn('No se pudo iniciar la reproduccion de audio.', error);
            });
        }
    } else {
        globalPlayer.audio.pause();
    }
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
        syncGlobalPlayerAudio();
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

    syncGlobalPlayerAudio();
}
