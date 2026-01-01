const { Classic } = require('musicard');
const { Spotify } = require('canvafy');
const { musicCard } = require('musicard-quartz');
const { dynamicCard } = require("songcard");
const path = require('path');
const fs = require('fs');
const axios = require('axios');

function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000) % 60;
    const minutes = Math.floor(ms / 60000) % 60;
    const hours = Math.floor(ms / 3600000);
    if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

// Helper: robustly fetch image as Buffer
async function getBuffer(source, fallbackUrl = null) {
    try {
        if (!source) return null;
        if (Buffer.isBuffer(source)) return source;

        // Local File
        if (typeof source === 'string' && fs.existsSync(source) && fs.statSync(source).size > 0) {
            return fs.readFileSync(source);
        }

        // URL
        if (typeof source === 'string' && source.startsWith('http')) {
            const res = await axios.get(source, { responseType: 'arraybuffer', timeout: 3000 });
            return Buffer.from(res.data);
        }

        return null;
    } catch (e) {
        if (fallbackUrl) {
            try {
                const res = await axios.get(fallbackUrl, { responseType: 'arraybuffer', timeout: 3000 });
                return Buffer.from(res.data);
            } catch (e2) { return null; }
        }
        return null;
    }
}

async function generateCard(track, theme) {
    // Normalization
    const author = track.info.author || 'Unknown Artist';
    let requesterName = track.info.requester?.globalName || track.info.requester?.username || 'System';
    if (requesterName.length > 15) requesterName = requesterName.substring(0, 15) + '...';
    let thumbnail = track.info.thumbnail || 'https://cdn.discordapp.com/embed/avatars/0.png';
    let title = track.info.title || 'Unknown Title';
    if (title.length > 40) title = title.substring(0, 40) + '...';

    // Safety: Ensure length is a number for Canvafy
    const length = Number(track.info.length) || 0;
    const durationStr = formatDuration(length);
    const subText = `Req: ${requesterName}`;

    // Helper for Local Assets path
    const getAssetPath = (filename) => {
        const p = path.join(__dirname, '../assets/backgrounds', filename);
        if (fs.existsSync(p)) return p;
        return null;
    };

    try {
        // Pre-fetch Thumbnail Buffer (Safe against 404s)
        const thumbnailBuff = await getBuffer(thumbnail, 'https://cdn.discordapp.com/embed/avatars/0.png')
            || await getBuffer('https://cdn.discordapp.com/embed/avatars/0.png'); // Hard fallback

        // --- THEME DISPATCHER ---

        // 1. **NEW SPOTIFY (Cinematic)** - Canvafy
        if (theme === 'spotify') {
            // Using Canvafy for the cinematic, centered look with blur
            const card = await new Spotify()
                .setAuthor(author || ' ')
                .setAlbum(subText || ' ')
                .setTimestamp(1, length || 1000)
                .setImage(thumbnailBuff)
                .setTitle(title || ' ')
                .setBlur(5)
                .setOverlayOpacity(0.7);

            return await card.build();
        }

        // 2. **MUSICARD (Classic/Anime/Landscape)**
        if (['landscape', 'classic', 'sunset', 'light', 'anime'].includes(theme)) {

            // Anime: Random Local Art (Expanded to 15)
            if (theme === 'anime') {
                const animeFiles = [
                    'anime_1.jpg', 'anime_2.jpg', 'anime_3.jpg', 'anime_4.jpg', 'anime_5.jpg',
                    'anime_6.jpg', 'anime_7.jpg', 'anime_8.jpg', 'anime_9.jpg', 'anime_10.jpg',
                    'anime_11.jpg', 'anime_12.jpg', 'anime_13.jpg', 'anime_14.jpg', 'anime_15.jpg'
                ];
                const randomFile = animeFiles[Math.floor(Math.random() * animeFiles.length)];
                const bgPath = getAssetPath(randomFile);
                const bgBuff = await getBuffer(bgPath);

                return await Classic({
                    thumbnailImage: thumbnailBuff,
                    backgroundImage: bgBuff || thumbnailBuff, // Fallback
                    backgroundColor: '#1a1a1a',
                    progressColor: '#FFD700',
                    progressBarColor: '#444444',
                    name: title,
                    nameColor: '#FFFFFF',
                    author: author,
                    authorColor: '#E0E0E0',
                    startTime: '0:00',
                    endTime: durationStr,
                    imageDarkness: 40,
                    roundedCorner: true,
                });
            }

            // Landscape: Side-by-Side (Dark Luxury)
            if (theme === 'landscape') {
                return await Classic({
                    thumbnailImage: thumbnailBuff,
                    backgroundImage: null,
                    backgroundColor: '#0F0F0F',
                    progressColor: '#FFD700',
                    progressBarColor: '#333333',
                    name: title,
                    nameColor: '#FFFFFF',
                    author: author,
                    authorColor: '#CCCCCC',
                    startTime: '0:00',
                    endTime: durationStr,
                    imageDarkness: 0,
                    roundedCorner: true,
                });
            }

            // Classic: **Recycled Old Spotify Style** (Green/Black)
            if (theme === 'classic') {
                return await Classic({
                    thumbnailImage: thumbnailBuff,
                    backgroundImage: thumbnailBuff, // Optional: usage of thumb as BG like old custom
                    backgroundColor: '#191414',
                    progressColor: '#1DB954',
                    progressBarColor: '#535353',
                    name: title,
                    nameColor: '#FFFFFF',
                    author: author,
                    authorColor: '#B3B3B3',
                    startTime: '0:00',
                    endTime: durationStr,
                    imageDarkness: 60,
                    roundedCorner: true,
                });
            }

            // Light / Sunset
            if (theme === 'light') {
                return await Classic({
                    thumbnailImage: thumbnailBuff,
                    backgroundColor: '#FFFFFF',
                    progressColor: '#FF69B4',
                    progressBarColor: '#E0E0E0',
                    name: title,
                    nameColor: '#000000',
                    author: author,
                    authorColor: '#555555',
                    startTime: '0:00',
                    endTime: durationStr
                });
            }
            if (theme === 'sunset') {
                const bg = getAssetPath('sunset.jpg');
                const bgBuff = await getBuffer(bg);
                return await Classic({
                    thumbnailImage: thumbnailBuff,
                    backgroundImage: bgBuff,
                    backgroundColor: '#2F3136',
                    progressColor: '#FFA500',
                    progressBarColor: '#444444',
                    name: title,
                    nameColor: '#FFFFFF',
                    author: author,
                    authorColor: '#E0E0E0',
                    startTime: '0:00',
                    endTime: durationStr,
                    imageDarkness: 30
                });
            }
        }

        // 3. **MUSICARD-QUARTZ (Glass/Neon)**
        if (['neon', 'retro', 'blur', 'pastel'].includes(theme)) {
            let quartzTheme = 'quartz+';
            if (theme === 'neon') quartzTheme = 'quartz+';
            if (theme === 'retro') quartzTheme = 'onepiece+';
            if (theme === 'blur') quartzTheme = 'vector+';
            if (theme === 'pastel') quartzTheme = 'quartz+';

            const card = new musicCard({
                name: title,
                author: author,
                color: 'auto',
                theme: quartzTheme,
                brightness: 80,
                thumbnail: thumbnailBuff, // Passing Buffer
                progress: 10,
                startTime: '0:00',
                endTime: durationStr
            });
            return await card.build();
        }

        // 4. **SONGCARD (Dynamic/Forest/Crimson) & CYBERPUNK (Redesign)**
        if (['forest', 'crimson', 'cyberpunk'].includes(theme)) {
            let bgPath = null;
            if (theme === 'forest') bgPath = getAssetPath('forest.jpg');
            if (theme === 'crimson') bgPath = getAssetPath('crimson.jpg');

            // Cyberpunk Redesign using Classic + Neon Colors + Custom BG
            if (theme === 'cyberpunk') {
                // Use new vivid asset
                const cyberBg = await getBuffer(getAssetPath('cyberpunk.jpg')) || thumbnailBuff;
                return await Classic({
                    thumbnailImage: thumbnailBuff,
                    backgroundImage: cyberBg,
                    backgroundColor: '#0a0a0a',        // Pitch Dark
                    progressColor: '#00e5ff',          // Neon Cyan
                    progressBarColor: '#ff0055',       // Neon Pink
                    name: title,
                    nameColor: '#00e5ff',              // Neon Cyan Title
                    author: author,
                    authorColor: '#ffffff',
                    startTime: '0:00',
                    endTime: durationStr,
                    imageDarkness: 40,                 // Contrast
                    roundedCorner: true
                });
            }

            const bgBuff = bgPath ? await getBuffer(bgPath) : thumbnailBuff;

            return await dynamicCard({
                thumbnailURL: thumbnailBuff,
                songTitle: title,
                songArtist: author,
                fontColor: '#FFFFFF',
                barColor: theme === 'forest' ? '#00FF00' : '#FF0000', // Crimson is red
                bgImage: bgBuff // Buffer
            });
        }

        // 5. **CANVAFY (Ocean/Midnight)**
        if (['ocean', 'midnight'].includes(theme)) {
            const card = await new Spotify()
                .setAuthor(author || ' ')
                .setAlbum(subText || ' ')
                .setTimestamp(1, length || 1000)
                .setImage(thumbnailBuff)
                .setTitle(title || ' ');

            if (theme === 'ocean') {
                card.setBlur(3);
                card.setOverlayOpacity(0.5);
            } else {
                card.setBlur(8);
                card.setOverlayOpacity(0.9);
            }
            return await card.build();
        }

        // Catch-all
        return await Classic({
            thumbnailImage: thumbnailBuff,
            backgroundColor: '#2F3136',
            progressColor: '#7289DA',
            name: title,
            author: author,
            startTime: '0:00',
            endTime: durationStr
        });

    } catch (e) {
        console.error(`Theme ${theme} FAILED:`, e);
        // Error logging removed by request to keep folder clean
        // fs.appendFileSync('card_errors.log', ...) REMOVED

        // Last Resort Fallback
        return await Classic({
            thumbnailImage: 'https://cdn.discordapp.com/embed/avatars/0.png',
            backgroundColor: '#000000',
            progressColor: '#FF0000',
            name: "Error",
            author: title,
            startTime: '0:00',
            endTime: durationStr
        });
    }
}

module.exports = { generateCard };
