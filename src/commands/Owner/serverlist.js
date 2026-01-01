const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverlist')
        .setDescription('List Guilds (Owner Only)'),

    async execute(interaction, client) {
        const guilds = client.guilds.cache.map(g => `• **${g.name}** (${g.id}) - ${g.memberCount} members`).join('\n');

        // Handle long lists
        if (guilds.length > 4000) {
            // Truncate or file attachment (simple truncate for now)
            return interaction.reply({ content: `**Servers:**\n${guilds.slice(0, 1900)}...\n(List truncated)`, ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle(`Servers (${client.guilds.cache.size})`)
            .setDescription(guilds)
            .setColor('#2b2d31');

        return interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
