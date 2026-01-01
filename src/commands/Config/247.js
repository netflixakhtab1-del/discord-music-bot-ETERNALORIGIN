const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Emoji = require('../../utils/emoji');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('247')
        .setDescription('Toggle 24/7 mode'),

    async execute(interaction, client) {
        const player = client.riffy.players.get(interaction.guild.id);

        if (!player) {
            return interaction.reply({ content: `${Emoji.error} I need to be connected to a voice channel first!`, ephemeral: true });
        }

        // Toggle 24/7 mode
        player.is247 = !player.is247;

        const status = player.is247 ? 'Enabled' : 'Disabled';
        const emoji = player.is247 ? Emoji.success : Emoji.error;

        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setDescription(`${emoji} 24/7 Mode is now **${status}**`)
            .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

        return interaction.reply({ embeds: [embed] });
    },
};
