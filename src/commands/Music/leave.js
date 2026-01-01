const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const Emoji = require('../../utils/emoji');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leave')
        .setDescription('Disconnect the bot from the voice channel'),

    async execute(interaction, client) {
        const player = client.riffy.players.get(interaction.guild.id);

        if (!player) {
            return interaction.reply({ content: `${Emoji.error} I am not connected to a voice channel!`, flags: MessageFlags.Ephemeral });
        }

        const member = interaction.guild.members.cache.get(interaction.user.id);
        if (!member.voice.channel || member.voice.channel.id !== player.voiceChannel) {
            return interaction.reply({ content: `${Emoji.error} You need to be in the same voice channel to disconnect me!`, flags: MessageFlags.Ephemeral });
        }

        player.destroy();

        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setTitle(`${Emoji.success} Left Voice Channel`)
            .setDescription(`Disconnected from the voice channel and cleared the queue.`)
            .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

        return interaction.reply({ embeds: [embed] });
    },
};
