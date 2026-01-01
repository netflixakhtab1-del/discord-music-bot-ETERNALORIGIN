const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Emoji = require('../../utils/emoji');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bassboost')
        .setDescription('Toggle Bassboost filter'),

    async execute(interaction, client) {
        const player = client.riffy.players.get(interaction.guildId);
        if (!player) return interaction.reply({ content: `${Emoji.error || '❌'} No music playing!`, ephemeral: true });

        player.filters.setBassboost(true);

        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setDescription(`${Emoji.success || '✅'} **Bassboost Filter** has been enabled!`);

        return interaction.reply({ embeds: [embed] });
    },
};
