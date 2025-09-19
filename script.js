

// ==========================
// CONFIG
// ==========================
const BIRTH_YEAR = 2007;
const BIRTH_MONTH = 3;  // April (0-based)
const BIRTH_DAY = 16;
const TIMEZONE = "Europe/London";

const DISCORD_USER_ID = "1105670358419374120";
const MANUAL_BADGES = ["NITRO", "DEVELOPER", "QUEST"];

const statusColors = {
    online: "#43a25a",
    idle: "#ca9654",
    dnd: "#d83a42",
    offline: "#83838b"
};

const badgeIcons = {
    NITRO: "https://discordresources.com/img/discordnitro.svg",
    DEVELOPER: "https://discordresources.com/img/activedeveloper.svg",
    QUEST: "https://discordresources.com/img/quest.png"
};

// ==========================
// CACHE DOM
// ==========================
const ageEl = document.getElementById("age-count");

const dom = {
    dcUser: document.getElementById("dc-user"),
    dcStatus: document.getElementById("dc-status"),
    dcBadges: document.getElementById("dc-badges"),
    dcAvatar: document.querySelector(".dc-avatar"),
    dcCustomStatus: document.getElementById("dc-custom-status"),
    firstHour: document.getElementById("first-hour"),
    lastHour: document.getElementById("last-hour"),
    spotifyCard: document.getElementById("spotify-card"),
    spotifyAlbum: document.getElementById("spotify-album"),
    spotifySong: document.getElementById("spotify-song"),
    spotifyArtist: document.getElementById("spotify-artist"),
    spotifyLink: document.getElementById("spotify-link"),
    spFill: document.getElementById("sp-fill"),
    spCurrent: document.getElementById("sp-current"),
    spDuration: document.getElementById("sp-duration")
};

// ==========================
// FAVICON FUNCTIONS
// ==========================
function setFavicon(url) {
    let link = document.querySelector("#favicon");
    if (!link) {
        link = document.createElement("link");
        link.id = "favicon";
        link.rel = "icon";
        document.head.appendChild(link);
    }
    link.href = url;
}

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return m + ":" + (s < 10 ? "0" : "") + s;
}

// ==========================
// NAVIGATION
// ==========================
function initNav() {
    const navLinks = document.querySelectorAll('.section-jump');
    const sections = document.querySelectorAll('main > section');

    function showSection(targetId) {
        sections.forEach(sec => {
            if (sec.id === targetId) {
                sec.style.display = 'block';
                setTimeout(() => sec.style.opacity = 1, 20);
            } else {
                sec.style.opacity = 0;
                setTimeout(() => sec.style.display = 'none', 500);
            }
        });

        navLinks.forEach(link => {
            const linkId = link.getAttribute('href').slice(1);
            if (linkId === targetId) {
                link.style.borderColor = '#ff69b4';
                link.style.pointerEvents = 'none';
                link.style.opacity = '0.7';
            } else {
                link.style.borderColor = '#2f2f2f';
                link.style.pointerEvents = 'auto';
                link.style.opacity = '1';
            }
        });

        history.pushState(null, '', `#${targetId}`);
    }

    navLinks.forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const targetId = link.getAttribute('href').slice(1);
            showSection(targetId);
        });
    });

    const initialHash = window.location.hash.slice(1);
    if (initialHash && document.getElementById(initialHash)) showSection(initialHash);
    else showSection('home');

    window.addEventListener('popstate', () => {
        const hash = window.location.hash.slice(1) || 'home';
        if (document.getElementById(hash)) showSection(hash);
    });
}

// ==========================
// AGE FUNCTIONS
// ==========================
function updateAge() {
    if (!ageEl) return;

    const now = new Date();
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" })
        .formatToParts(now);

    const year = Number(parts.find(p => p.type === "year").value);
    const month = Number(parts.find(p => p.type === "month").value) - 1;
    const day = Number(parts.find(p => p.type === "day").value);

    let age = year - BIRTH_YEAR;
    if (month < BIRTH_MONTH || (month === BIRTH_MONTH && day < BIRTH_DAY)) age--;

    ageEl.textContent = age;
}

function scheduleNextBirthdayUpdate() {
    const now = new Date();
    const yearLondon = Number(new Intl.DateTimeFormat("en-GB", { timeZone: TIMEZONE, year: "numeric" }).format(now));
    let targetLondon = new Date(Date.UTC(yearLondon, BIRTH_MONTH, BIRTH_DAY, 0, 0, 0));
    const nowLondon = new Date(new Date().toLocaleString("en-GB", { timeZone: TIMEZONE }));

    if (nowLondon >= targetLondon) targetLondon.setUTCFullYear(targetLondon.getUTCFullYear() + 1);

    setTimeout(() => {
        updateAge();
        scheduleNextBirthdayUpdate();
    }, targetLondon - nowLondon);
}

// ==========================
// LANYARD WEBSOCKET
// ==========================
function connectLanyard() {
    const ws = new WebSocket("wss://api.lanyard.rest/socket");
    let heartbeatInterval;
    ws.onopen = () => {
        ws.send(JSON.stringify({ op: 2, d: { subscribe_to_id: DISCORD_USER_ID } }));
        heartbeatInterval = setInterval(() => ws.send(JSON.stringify({ op: 3 })), 30000);
    };
    ws.onmessage = event => {
        const payload = JSON.parse(event.data);
        if (!["INIT_STATE", "PRESENCE_UPDATE"].includes(payload.t)) return;
        const data = payload.d;

        // Discord
        updateStatusIndicator(data.discord_status);
        updateUsername(data.discord_user);
        updateAvatar(data.discord_user);
        updateBadges();
        updateCustomStatus(data.activities);

        // Game
        const gameCard = document.getElementById("game-card");
        const gameName = document.getElementById("game-name");
        const gameDetails = document.getElementById("game-details");
        const gameDuration = document.getElementById("game-duration");
        const gameIcon = document.getElementById("game-icon");

        function formatDuration(ms) {
            const totalSec = Math.floor(ms / 1000);
            const h = Math.floor(totalSec / 3600);
            const m = Math.floor((totalSec % 3600) / 60);
            const s = totalSec % 60;
            if (h > 0) return `${h}h ${m}m`;
            if (m > 0) return `${m}m ${s}s`;
            return `${s}s`;
        }
        function updateGameTimer(start, el) {
            const update = () => { el.textContent = formatDuration(Date.now() - start); };
            update();
            return setInterval(update, 1000);
        }

        const game = data.activities.find(act => act.type === 0);
        if (game) {
            gameCard.style.display = "block";
            gameName.textContent = game.name;
            gameDetails.textContent = game.details || "";

            if (game.application_id) {
                gameIcon.src = `https://dcdn.dstn.to/app-icons/${game.application_id}.png?size=512`;
            } else {
                gameIcon.src = "assets/game-placeholder.jpg";
            }
            gameIcon.style.display = "inline-block";

            if (game.timestamps?.start) {
                if (gameCard.gameInterval) clearInterval(gameCard.gameInterval);
                gameCard.gameInterval = updateGameTimer(game.timestamps.start, gameDuration);
            } else {
                gameDuration.textContent = "Unknown";
                if (gameCard.gameInterval) clearInterval(gameCard.gameInterval);
            }
        } else {
            gameCard.style.display = "none";
            gameIcon.src = "assets/game-placeholder.jpg";
            gameDuration.textContent = "";
            if (gameCard.gameInterval) clearInterval(gameCard.gameInterval);
        }

        // Spotify
        if (data.listening_to_spotify) {
            const spotify = data.spotify;
            startTime = spotify.timestamps.start;
            endTime = spotify.timestamps.end;

            if (spotify.track_id !== currentTrack) {
                currentTrack = spotify.track_id;
                if (dom.spotifyCard) dom.spotifyCard.style.display = "block";
                if (dom.spotifyAlbum) dom.spotifyAlbum.src = spotify.album_art_url;
                if (dom.spotifyLink) dom.spotifyLink.href = "https://open.spotify.com/track/" + spotify.track_id;
                if (dom.spotifySong) dom.spotifySong.textContent = spotify.song;
                if (dom.spotifyArtist) dom.spotifyArtist.textContent = spotify.artist;
            }

            clearInterval(progressInterval);
            progressInterval = setInterval(updateSpotifyProgress, 1000);
        } else {
            if (dom.spotifyCard) dom.spotifyCard.style.display = "none";
            clearInterval(progressInterval);
            currentTrack = null;
        }
    };
    ws.onclose = () => {
        clearInterval(heartbeatInterval);
        clearInterval(progressInterval);
        setTimeout(connectLanyard, 1000);
    };
}

// ==========================
// DISCORD
// ==========================
function updateUsername(user) {
    if (dom.dcUser && user) dom.dcUser.textContent = user.username;
}

function updateStatusIndicator(status) {
    if (!dom.dcStatus) return;
    dom.dcStatus.style.backgroundColor = statusColors[status] || "#83838b";
    dom.dcStatus.style.animation = status === "loading" ? "loading 2s infinite" : "none";
}

function updateBadges() {
    if (!dom.dcBadges) return;
    if (!MANUAL_BADGES.length) { dom.dcBadges.style.display = "none"; return; }
    dom.dcBadges.innerHTML = "";
    dom.dcBadges.style.display = "flex";
    MANUAL_BADGES.forEach(flag => {
        const url = badgeIcons[flag]; if (!url) return;
        const img = document.createElement("img");
        img.src = url;
        img.alt = flag;
        img.className = "dc-badge";
        dom.dcBadges.appendChild(img);
    });
}

function updateAvatar(user) {
    if (!dom.dcAvatar || !user) return;
    const { id, avatar } = user;
    if (avatar) {
        const ext = avatar.startsWith("a_") ? "gif" : "png";
        dom.dcAvatar.style.backgroundImage = `url('https://cdn.discordapp.com/avatars/${id}/${avatar}.${ext}?size=256')`;
    } else {
        const defaultAvatar = (parseInt(id) >> 22) % 6;
        dom.dcAvatar.style.backgroundImage = `url('https://cdn.discordapp.com/embed/avatars/${defaultAvatar}.png')`;
    }
}

function updateCustomStatus(activities) {
    if (!dom.dcCustomStatus) return;

    const customStatus = activities.find(a => a.type === 4);
    if (customStatus && (customStatus.state || customStatus.emoji)) {
        let text = customStatus.state || "";

        if (customStatus.emoji) {
            if (customStatus.emoji.id) {
                const ext = customStatus.emoji.animated ? "gif" : "png";
                const url = `https://cdn.discordapp.com/emojis/${customStatus.emoji.id}.${ext}?size=128&quality=lossless`;
                dom.dcCustomStatus.innerHTML = `<img src="${url}" alt="${customStatus.emoji.name}" class="dc-status-emoji"> ${text}`;
            } else {
                dom.dcCustomStatus.textContent = `${customStatus.emoji.name} ${text}`;
            }
        } else {
            dom.dcCustomStatus.textContent = text;
        }

        dom.dcCustomStatus.style.display = "inline-block";
    } else {
        dom.dcCustomStatus.style.display = "none";
        dom.dcCustomStatus.textContent = "";
    }
}

// ==========================
// ACTIVE HOURS
// ==========================
function updateActiveHours() {
    const tz = "Europe/London"; const now = new Date();
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
    const ymd = {}; parts.forEach(p => { if (p.type !== "literal") ymd[p.type] = p.value; });
    const year = Number(ymd.year), month = Number(ymd.month), day = Number(ymd.day);
    const utcMidTs = Date.UTC(year, month - 1, day, 0, 0, 0);
    const londonMidParts = new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date(utcMidTs));
    const lm = {}; londonMidParts.forEach(p => { if (p.type !== "literal") lm[p.type] = p.value; });
    const offsetMinutes = Number(lm.hour) * 60 + Number(lm.minute);
    function londonToVisitorString(hour, minute, dayOffset = 0) {
        const utcForLondon = Date.UTC(year, month - 1, day + dayOffset, hour, minute, 0) - offsetMinutes * 60000;
        return new Date(utcForLondon).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
    }
    const startLocal = londonToVisitorString(13, 0);
    const endLocal = londonToVisitorString(0, 0, 1);
    if (dom.firstHour) dom.firstHour.textContent = startLocal;
    if (dom.lastHour) dom.lastHour.textContent = endLocal;
}

function scheduleNextMidnightUpdate() {
    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5);
    setTimeout(() => { updateActiveHours(); scheduleNextMidnightUpdate(); }, nextMidnight - now);
}

// ==========================
// SPOTIFY
// ==========================
let currentTrack = null, startTime = 0, endTime = 0, progressInterval;
function updateSpotifyProgress() {
    if (!dom.spFill || !dom.spCurrent || !dom.spDuration) return;
    const now = Date.now(), elapsed = now - startTime, duration = endTime - startTime;
    const percent = Math.min((elapsed / duration) * 100, 100);
    dom.spFill.style.width = percent + "%";
    dom.spCurrent.textContent = formatTime(elapsed / 1000);
    dom.spDuration.textContent = formatTime(duration / 1000);
    if (percent >= 100) clearInterval(progressInterval);
}

// ==========================
// PROJECT LIST
// ==========================
async function loadProjects() {
    try {
        const res = await fetch("projects.json");
        const data = await res.json();
        const categories = [
            { key: "favourites", containerId: "favourites" },
            { key: "games", containerId: "games" },
            { key: "websites", containerId: "websites" }
        ];

        categories.forEach(cat => {
            const projects = data[cat.key] || [];
            const container = document.getElementById(cat.containerId);
            if (!container) return;

            container.innerHTML = projects.map(p => {
                const languages = (p.languages || []).map(lang => `<span class="${lang.class}">${lang.name}</span>`).join(" ");
                const cardContent = `
                    <div class="project">
                        ${p.icon ? `<i class="${p.icon}"></i>` : ""}
                        <img src="${p.logo}" alt="${p.title}" class="project-logo">
                        <div class="game-info">
                            <h3 class="project-title">${p.title}</h3>
                            <p class="project-desc">${p.description}</p>
                            <p class="project-code">${languages}</p>
                            <p class="project-status-${p.status}">${p.status}</p>
                        </div>
                    </div>
                `;
                return p.url ? `<a href="${p.url}" target="_blank">${cardContent}</a>` : cardContent;
            }).join("");
        });
    } catch (err) {
        console.error("Failed to load projects:", err);
    }
}

// ==========================
// CONTACT FORM SUBMISSION
// ==========================
const contactForm = document.querySelector('.contact-form');
const contactResponse = document.querySelector('.contact-response');

if (contactForm && contactResponse) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const formData = new FormData(contactForm);
        fetch(contactForm.action, {
            method: contactForm.method,
            body: formData,
            headers: { 'Accept': 'application/json' }
        }).then(response => {
            if (response.ok) {
                contactResponse.textContent = 'Message sent successfully!';
                contactForm.reset();
            } else {
                contactResponse.textContent = 'Failed to send message. Please try again.';
            }
        }).catch(() => {
            contactResponse.textContent = 'Failed to send message. Please try again.';
        });
    });
}

// ==========================
// INIT
// ==========================
function init() {
    setFavicon("assets/favicon.ico");
    document.addEventListener("visibilitychange", () => setFavicon(document.hidden ? "assets/favicon-away.ico" : "assets/favicon.ico"));
    initNav(); loadProjects();
    updateAge(); scheduleNextBirthdayUpdate();
    updateActiveHours(); scheduleNextMidnightUpdate();
    connectLanyard();
}

document.addEventListener("DOMContentLoaded", init);
