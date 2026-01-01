const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Emoji = require('../../utils/emoji');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Clear the music queue'),

    async execute(interaction, client) {
        const player = client.riffy.players.get(interaction.guild.id);
        if (!player) return interaction.reply({ content: `${Emoji.error} No music playing!`, ephemeral: true });

        if (player.queue.length === 0) return interaction.reply({ content: `${Emoji.error} Queue is already empty!`, ephemeral: true });

        player.queue.clear();

        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setDescription(`${Emoji.success} **Cleared the queue!**`);

        return interaction.reply({ embeds: [embed] });
    },
};
