const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaveserver')
        .setDescription('Leave a server (Owner Only)'),

    async execute(interaction, client) {
        // Logic to support leaving specific ID or current
        let guildId = interaction.guild ? interaction.guild.id : null;

        // Try to parse args if available from prefix usage
        const args = interaction.options.getString('input');
        if (args) guildId = args.trim();

        if (!guildId) return interaction.reply("Please specify a Server ID or use inside a server.");

        const guild = client.guilds.cache.get(guildId);
        if (!guild) return interaction.reply("Guild not found.");

        try {
            await guild.leave();
            return interaction.reply(`✅ Left guild: **${guild.name}** (${guild.id})`);
        } catch (e) {
            return interaction.reply(`❌ Failed to leave guild: ${e.message}`);
        }
    },
};
