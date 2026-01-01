const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Emoji = require('../../utils/emoji');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reset')
        .setDescription('Clear all active filters'),

    async execute(interaction, client) {
        const player = client.riffy.players.get(interaction.guildId);
        if (!player) return interaction.reply({ content: `${Emoji.error || '❌'} No music playing!`, ephemeral: true });

        // Explicitly clear ALL filter types to ensure nothing persists
        player.filters.setTimescale(false);
        player.filters.setRotation(false);
        player.filters.setBassboost(false);
        player.filters.setNightcore(false);
        player.filters.setKaraoke(false);
        player.filters.setDistortion(false);
        player.filters.setLowPass(false);
        player.filters.setVaporwave(false);

        player.filters.clearFilters();
        player.setVolume(100);

        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setDescription(`${Emoji.success || '✅'} All filters have been **cleared**!`);

        return interaction.reply({ embeds: [embed] });
    },
};
