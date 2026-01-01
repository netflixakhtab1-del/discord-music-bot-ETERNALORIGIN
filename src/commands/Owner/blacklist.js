const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('blacklist')
        .setDescription('Blacklist User (Owner Only)'),

    async execute(interaction, client) {
        if (!client.blacklist) client.blacklist = new Set();

        const input = interaction.options.getString('input') || "";
        const userId = input.trim();

        if (!userId) return interaction.reply("Usage: `!blacklist <user_id>`");

        if (client.blacklist.has(userId)) {
            client.blacklist.delete(userId);
            return interaction.reply(`🔓 Unblacklisted user ${userId}`);
        } else {
            client.blacklist.add(userId);
            return interaction.reply(`⛔ Blacklisted user ${userId}`);
        }
    },
};
