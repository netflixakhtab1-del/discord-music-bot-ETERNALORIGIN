const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('restart')
        .setDescription('Restart Bot (Owner Only)'),

    async execute(interaction, client) {
        await interaction.reply("♻️ Restarting process...");
        process.exit(0); // PM2 or Docker should restart it
    },
};
