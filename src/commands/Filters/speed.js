const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Emoji = require('../../utils/emoji');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('speed')
        .setDescription('Change playback speed')
        .addNumberOption(option =>
            option.setName('amount')
                .setDescription('Speed multiplier (0.5 - 2.0)')
                .setMinValue(0.5)
                .setMaxValue(2.0)
                .setRequired(true)
        ),

    async execute(interaction, client) {
        const player = client.riffy.players.get(interaction.guildId);
        if (!player) return interaction.reply({ content: `${Emoji.error || '❌'} No music playing!`, ephemeral: true });

        const speed = interaction.options.getNumber('amount');
        player.filters.setTimescale(true, { speed: speed, pitch: 1.0, rate: 1.0 });

        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setDescription(`${Emoji.success || '✅'} **Speed** set to **${speed}x**!`);

        return interaction.reply({ embeds: [embed] });
    },
};
