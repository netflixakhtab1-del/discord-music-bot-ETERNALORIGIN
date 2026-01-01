const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Emoji = require('../../utils/emoji');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('maintenance')
        .setDescription('Maintenance Mode (Owner Only)'),

    async execute(interaction, client) {
        // This command supports both Slash and Prefix. 
        // Logic assumes prefix usage mainly: !maintenance <cmd> <time>

        let args = [];
        let user = interaction.user;

        // Message-based parsing
        if (!interaction.isChatInputCommand && !interaction.isButton) {
            // It's our mock interaction, but arguments aren't passed in 'options' typically for legacy.
            // We need to access the original message content if possible or rely on mock checks?
            // Actually, index.js parses args but doesn't pass them easily to execute. 
            // We will assume index.js logic updates to pass args, or we use a hack.
            // Hack: we'll check interaction.content if available (passed from index) or assume interaction.options.getString('command') works if we built it that way.

            // BUT, the current MockInteraction in index.js tries to emulate slash options.
            // So we should try to get options "string".
            // However, for !maintenance cmd time, these are positional.
            // index.js Mock 'getString' joins remaining args.
        }

        const fullArgs = interaction.options.getString('args') || "";
        // Wait, index.js:818 return args.join(' ') || null for any getString call.
        // So calling getString('anything') gets the rest of the args.

        const input = interaction.options.getString('input') || "";
        const parts = input.trim().split(/ +/);

        const cmdName = parts[0];
        const timeStr = parts[1]; // Optional

        if (!cmdName) return interaction.reply("Usage: `!maintenance <cmd> [time]`");

        // Parse Time
        let duration = 24 * 60 * 60 * 1000; // Default 24h
        if (timeStr) {
            const match = timeStr.match(/^(\d+)([smhd])$/);
            if (match) {
                const val = parseInt(match[1]);
                const unit = match[2];
                if (unit === 's') duration = val * 1000;
                if (unit === 'm') duration = val * 60000;
                if (unit === 'h') duration = val * 3600000;
                if (unit === 'd') duration = val * 86400000;
            }
        }

        const expiry = Date.now() + duration;

        if (!client.maintenance) client.maintenance = new Map();

        // Toggle off if already exists and no time specified? Or just overwrite?
        // User said: "when time not add mean it will be lock to 24hrs" 
        // So we overwrite.

        if (cmdName === 'all' || cmdName === 'global') {
            // Global maintenance not requested but good to have
        }

        client.maintenance.set(cmdName, { expiry });

        return interaction.reply(`${Emoji.lock || '🔒'} Command **${cmdName}** is now in maintenance for **${msToTime(duration)}**.`);
    },
};

function msToTime(duration) {
    let seconds = Math.floor((duration / 1000) % 60),
        minutes = Math.floor((duration / (1000 * 60)) % 60),
        hours = Math.floor((duration / (1000 * 60 * 60)) % 24),
        days = Math.floor((duration / (1000 * 60 * 60 * 24)));

    days = (days < 10) ? "0" + days : days;
    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;

    return days + "d " + hours + "h " + minutes + "m " + seconds + "s";
}
