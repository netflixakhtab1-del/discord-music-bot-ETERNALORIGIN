const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Emoji = require('../../utils/emoji');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vaporwave')
        .setDescription('Toggle Vaporwave filter'),

    async execute(interaction, client) {
        const player = client.riffy.players.get(interaction.guildId);
        if (!player) return interaction.reply({ content: `${Emoji.error || '❌'} No music playing!`, ephemeral: true });

        player.filters.setVaporwave(true);

        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setDescription(`${Emoji.success || '✅'} **Vaporwave Filter** has been enabled!`);

        return interaction.reply({ embeds: [embed] });
    },
};
