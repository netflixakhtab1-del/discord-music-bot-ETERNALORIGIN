const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reload')
        .setDescription('Reloads the bot (Owner Only)'), // Placeholder for reloadall

    async execute(interaction, client) {
        await interaction.reply("♻️ Reloading commands not fully implemented in hot-swap. Please use `!restart`.");
    },
};
