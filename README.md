# Eternal Origin

<div align="center">
    <img src="https://media.discordapp.net/attachments/1083049581895520266/1083049581895520266/f9e9d6d4e8c15a6b.jpg" alt="Logo" width="200" height="200">
</div>

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-v16+-green?style=for-the-badge&logo=node.js)
![Discord.js](https://img.shields.io/badge/Discord.js-v14-blue?style=for-the-badge&logo=discord)
![Lavalink](https://img.shields.io/badge/Audio-Lavalink-red?style=for-the-badge)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-green?style=for-the-badge&logo=mongodb)

*A Next-Generation, Feature-Rich Discord Music Bot.*

[Support Server](https://discord.gg/4pHM99WGXp) • [Report Bug](https://github.com/netflixakhtab1-del/issues)

</div>

---

## 🌟 Key Features

*   **🎵 Advanced Music System**: Powered by **Lavalink** and **Riffy** for zero-lag, high-quality audio.
*   **🎨 Dynamic Music Cards**: Beautiful "Now Playing" cards with 15+ themes (Classic, Spotify, Neon, Cyberpunk, Anime, and more).
*   **🎛️ Audio Filters**: Real-time filters including **Nightcore, Vaporwave, Bassboost, Lofi, Pitch, and Speed**.
*   **🔄 24/7 System**: Keeps the bot in the voice channel 24/7 with a simple toggle found in `Config`.
*   **💾 Persistent Autoplay**: Smart autoplay that remembers your preference even after a restart (MongoDB backed).
*   **⏯️ Interactive Buttons**: Control music easily with Pause, Skip, Stop, Loop, and Shuffle buttons.
*   **❤️ Favorites System**: Save your favorite songs and play them later.
*   **🔊 Dual Command Support**: Supports both Slash Commands (`/play`) and Prefix Commands (`!play`).

---

## 🚀 Installation & Setup

### Prerequisites

1.  **Node.js**: v18.0.0 or higher recommended.
2.  **MongoDB**: A valid MongoDB URI (Atlas or Local).
3.  **Lavalink v4**: A working Lavalink node (or use a public one).

### 🖥️ Local Installation

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/yourusername/Eternalorigin.git
    cd Eternalorigin
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```
    *(Note: This installs all required packages including `discord.js`, `riffy`, `mongoose`, etc.)*

3.  **Configure Environment**
    *   Rename `.env.example` to `.env`.
    *   Fill in the required details:
        ```env
        DISCORD_TOKEN=your_bot_token
        CLIENT_ID=your_client_id
        MONGO_URI=your_mongodb_connection_string
        LAVALINK_HOST=localhost
        LAVALINK_PORT=2333
        LAVALINK_PASSWORD=youshallnotpass
        ```

4.  **Start the Bot**
    ```bash
    npm start
    ```

---

## ☁️ Deploying to Hosting (Pterodactyl, etc.)

This bot is designed to run on Pterodactyl, VPS, or any Node.js environment.

### ⚠️ IMPORTANT: Deployment Settings
If you are deploying on a panel like Pterodactyl, ensure you configure the **Startup Settings** correctly:

*   **Main File**: `src/index.js`
    *(Do NOT use `npm start` as the file. The file is `src/index.js`)*

### Environment Variables for Panel
If your host does not support `.env` files, add these variables in the **"Variables"** or **"Environment"** tab:

| Variable | Description |
| :--- | :--- |
| `DISCORD_TOKEN` | Your Bot Token |
| `CLIENT_ID` | Your Application ID |
| `MONGO_URI` | MongoDB Connection URL |
| `LAVALINK_HOST` | Node IP/Host |
| `LAVALINK_PORT` | Node Port |
| `LAVALINK_PASSWORD` | Node Password |
| `LAVALINK_SECURE` | `true` or `false` (SSL) |

---

## 📚 Commands

### 🎵 Music
*   `/play` (or `!p`): Play a song from YouTube, Spotify, SoundCloud, etc.
*   `/search`: Search for a specific result.
*   `/queue`: View the current song queue.
*   `/nowplaying`: Show the current song's music card.
*   `/skip`: Skip the current track.
*   `/pause` / `/resume`: Toggle playback.
*   `/stop`: Stop music and leave the channel.
*   `/shuffle`: Shuffle the queue.
*   `/loop`: Toggle loop modes (Track/Queue/Off).
*   `/volume`: Adjust volume (0-100).
*   `/seek`: Seek to a specific time in the track.
*   `/autoplay`: Toggle persistent autoplay.

### 🎛️ Filters
*   `/filter`: Apply audio effects (Nightcore, Vaporwave, 8D, etc.).
*   `/reset`: Clear all active filters and speed modifications.

### ⚙️ Configuration
*   `/247`: Toggle 24/7 mode (Bot stays in VC).
*   `/setprefix`: Change the bot's prefix for the server.

---

## 🤝 Project Structure

```
src/
├── commands/       # Slash & Prefix Commands
├── events/         # Event Handlers (ready, messageCreate, etc.)
├── database/       # Mongoose Schemas (Guild, User, Autoplay)
├── utils/          # Helpers (CardGenerator, emoji.js, etc.)
└── index.js        # Main Entry Point
```

## ❤️ Credits

*   **Developer**: Gametime
*   **Library**: [Discord.js](https://discord.js.org/)
*   **Audio**: [Riffy](https://github.com/riffy-team/riffy)
*   **Database**: [Mongoose](https://mongoosejs.com/)

---

<div align="center">
    Made with ❤️ by Gametime & The Team
</div>