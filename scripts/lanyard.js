const lanyard = new WebSocket("wss://api.lanyard.rest/socket")
let heartbeat
let durationUpdateInterval

function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    } else {
        return `${seconds}s`;
    }
}

let currentActivityData = null;

function updateActivityDurations() {
    if (!currentActivityData) return;
    
    const now = Date.now();
    const d = currentActivityData;
    const activities = currentActivityData.activities;
    
    activities.forEach(activity => {
        if (activity.type === 0 && activity.timestamps && activity.timestamps.start) {
            const gameCard = document.querySelector('.game-card');
            const durationSpan = gameCard.querySelector('.activity-duration');
            
            if (durationSpan) {
                const elapsed = now - activity.timestamps.start;
                durationSpan.textContent = ` (${formatDuration(elapsed)})`;
            }
        }

        if (activity.type === 2 && activity.timestamps && activity.timestamps.start) {
            const movieCard = document.querySelector('.song-card');
            const durationSpan = movieCard.querySelector('.activity-duration');
            
            if (durationSpan) {
                const elapsed = now - activity.timestamps.start;
                const total = activity.timestamps.end - activity.timestamps.start;
                durationSpan.textContent = ` (${formatDuration(elapsed)} / ${formatDuration(total)})`;
            }
        }
        
        if (activity.type === 3 && activity.timestamps && activity.timestamps.start) {
            const movieCard = document.querySelector('.movie-card');
            const durationSpan = movieCard.querySelector('.activity-duration');
            
            if (durationSpan) {
                const elapsed = now - activity.timestamps.start;
                const total = activity.timestamps.end - activity.timestamps.start;
                durationSpan.textContent = ` (${formatDuration(elapsed)} / ${formatDuration(total)})`;
            }
        }
    });
}

lanyard.addEventListener("open", () => {
    console.log("Connected with Lanyard")
})

lanyard.addEventListener("message", event => {
    const data = JSON.parse(event.data);
    
    // heartbeat setup
    if (data.op === 1) {
        const heartbeat_interval = data.d.heartbeat_interval;
        heartbeat = setInterval(() => {
            lanyard.send(JSON.stringify({ op: 3 }))
        }, heartbeat_interval)
        lanyard.send(JSON.stringify({
            op: 2,
            d: {
                subscribe_to_id: "1105670358419374120"
            }
        }))
    }
    
    if (data.op === 0 && (data.t === "INIT_STATE" || data.t === "PRESENCE_UPDATE")) {
        const discord = data.d.discord_user
        const d = data.d
        const activities = data.d.activities
        
        currentActivityData = d;
        
        const gameCard = document.querySelector('.game-card')
        const songCard = document.querySelector('.song-card')
        const movieCard = document.querySelector('.movie-card')
        const userName = document.querySelector('.profile-name')
        const userStatusDot = document.querySelector('.profile-status-dot')
        const userStatusTXT = document.querySelector('.profile-status-txt')
        const gameIcon = document.querySelector('.game-icon')
        const gameName = document.querySelector('.game-name')
        const gameDetails = document.querySelector('.game-details')
        const songIcon = document.querySelector('.song-icon')
        const songName = document.querySelector('.song-name')
        const songArtist = document.querySelector('.song-artist')
        const movieIcon = document.querySelector('.movie-icon')
        const movieName = document.querySelector('.movie-name')
        const movieDetails = document.querySelector('.movie-details')
        
        if (gameCard) {
            gameCard.style.display = "none"
            gameCard.style.gridColumn = ""
        }
        if (songCard) {
            songCard.style.display = "none"
            songCard.style.gridColumn = ""
        }
        if (movieCard) {
            movieCard.style.display = "none"
            movieCard.style.gridColumn = ""
        }

        userName.textContent = discord.display_name
        
        switch(d.discord_status) {
            case "offline":
                d.discord_status = "Offline"
                userStatusDot.style.backgroundColor = "#4c4f69"
                userStatusDot.style.boxShadow = "0 0 8px #4c4f69"
                break;
            case "online":
                d.discord_status = "Online"
                userStatusDot.style.backgroundColor = "#40a02b"
                userStatusDot.style.boxShadow = "0 0 8px #40a02b"
                break;
            case "idle":
                d.discord_status = "Idle"
                userStatusDot.style.backgroundColor = "#df8e1d"
                userStatusDot.style.boxShadow = "0 0 8px #df8e1d"
                break;
            case "dnd":
                d.discord_status = "Busy"
                userStatusDot.style.backgroundColor = "#d20f39"
                userStatusDot.style.boxShadow = "0 0 8px #d20f39"
                break;
        }
        userStatusTXT.textContent = d.discord_status;
        
        activities.forEach(activity => {
            switch (activity.type) {
                case 0:
                    gameCard.style.display = "flex"
                    if (activity.application_id) {
                        gameIcon.src = `https://dcdn.dstn.to/app-icons/${activity.application_id}.png?size=128`
                    } else {
                        gameIcon.src = "/assets/undefined_discord-id.png"
                    }
                    gameIcon.alt = `${activity.name} Icon`
                    gameName.textContent = activity.name
                    gameDetails.textContent = activity.details
                    break;
                    
                case 2:
                    songCard.style.display = "flex"
                    songIcon.src = d.spotify.album_art_url
                    songIcon.alt = `${d.spotify.song} Cover`
                    songName.href = `https://open.spotify.com/track/${d.spotify.track_id}`
                    songName.textContent = d.spotify.song
                    songArtist.textContent = d.spotify.artist
                    break;
                    
                case 3:
                    movieCard.style.display = "flex"
                    const movieIconURL = activity.assets.large_image.split("/https/").pop()
                    movieIcon.src = `https://${movieIconURL}`
                    movieIcon.alt = `${activity.details} Poster`
                    movieName.textContent = activity.details
                    movieDetails.textContent = activity.state
                    break;
            }
        })
        
        const visibleCards = [gameCard, songCard, movieCard].filter(
            card => card && card.style.display === "flex"
        )

        if (visibleCards.length % 2 === 1) {
            const lastCard = visibleCards[visibleCards.length - 1]
            lastCard.style.gridColumn = "1 / -1"
        }
        
        if (durationUpdateInterval) {
            clearInterval(durationUpdateInterval);
        }
        updateActivityDurations();
        durationUpdateInterval = setInterval(updateActivityDurations, 1000);

    }
})

lanyard.addEventListener("close", () => {
    console.log("Disconnected from Lanyard")
    if (durationUpdateInterval) {
        clearInterval(durationUpdateInterval);
    }
})