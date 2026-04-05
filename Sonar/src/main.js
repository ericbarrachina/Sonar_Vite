// ========================================
// SONAR - Script Unificado Profesional
// ========================================

const API_URL = 'http://172.20.10.3:3000';
let isPlaylistPopoverDismissBound = false;
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

    // 6. Interacciones de busqueda (pagina Explorar)
    initBuscarInteractions();

    // 7. Guardar canciones en playlists desde las tarjetas
    initPlaylistQuickSave();

    // 8. Vista de playlists
    initPlaylistPage();

    // 9. Vista de guardados
    initSavedSongsPage();

    // 10. Mejora visual de tarjetas (portada + link artista)
    initSongCardVisuals();

    // 11. Barra de reproduccion global
    initGlobalPlayerBar();
    initSongCardPlayback();
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

function initBuscarInteractions() {
    const searchInput = document.getElementById('buscarInput');
    const searchType = document.getElementById('buscarTipo');
    const cards = Array.from(document.querySelectorAll('.buscar-song-card'));
    const searchCount = document.getElementById('searchCount');
    const emptyState = document.getElementById('buscarNoResultados');

    if (!searchInput || !searchType || cards.length === 0) return;

    const normalize = (value) => (value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    const runFilter = () => {
        const term = normalize(searchInput.value.trim());
        const type = searchType.value;
        let visibleCount = 0;

        cards.forEach((card) => {
            const song = normalize(card.dataset.song);
            const artist = normalize(card.dataset.artist);

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

            const songTitle = card.querySelector('h3')?.textContent?.trim() || 'Cancion';
            const songArtist = card.querySelector('.song-artist')?.textContent?.trim() || 'Artista';
            const songData = { song: songTitle, artist: songArtist };

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
            <div class="player-cover" id="playerCover" aria-hidden="true">♪</div>
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
        songTitle: bar.querySelector('#playerSongTitle'),
        songArtist: bar.querySelector('#playerSongArtist')
    };

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
    return { song, artist, album, genre };
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
        globalPlayer.cover.textContent = '♪';
        return;
    }

    globalPlayer.songTitle.textContent = currentSong.song;
    globalPlayer.songArtist.textContent = `${currentSong.artist}${currentSong.playlist ? ` • ${currentSong.playlist}` : ''}`;
    globalPlayer.cover.textContent = currentSong.song.trim().charAt(0).toUpperCase() || '♪';

    const playlistNowPlaying = document.getElementById('playlistNowPlaying');
    if (playlistNowPlaying) {
        playlistNowPlaying.classList.remove('error');
        playlistNowPlaying.textContent = `Reproduciendo: ${currentSong.song} - ${currentSong.artist}`;
    }
}