const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Emoji = require('../../utils/emoji');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skipall')
        .setDescription('Skip all songs and clear queue'),

    async execute(interaction, client) {
        const player = client.riffy.players.get(interaction.guild.id);
        if (!player) return interaction.reply({ content: `${Emoji.error} No music playing!`, ephemeral: true });

        player.queue.clear();
        player.stop(); // Stops current song, next one would be empty so it finishes.

        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setDescription(`${Emoji.success} **Skipped all songs and cleared queue!**`);

        return interaction.reply({ embeds: [embed] });
    },
};
