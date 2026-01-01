const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Emoji = require('../../utils/emoji');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('8d')
        .setDescription('Toggle 8D filter'),

    async execute(interaction, client) {
        const player = client.riffy.players.get(interaction.guildId);
        if (!player) return interaction.reply({ content: `${Emoji.error || '❌'} No music playing!`, ephemeral: true });

        // Toggle logic or just set? Users usually expect toggle or "on". 
        // For simplicity and clarity, we'll enable it. To disable, they can use /reset or /clear.
        // Or we can check if it's already on. Riffy doesn't expose "is8d" easily without tracking state manually.
        // We'll just Set it for now.

        player.filters.setRotation(true, { rotationHz: 0.2 });

        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setDescription(`${Emoji.success || '✅'} **8D Filter** has been enabled!`);

        return interaction.reply({ embeds: [embed] });
    },
};
