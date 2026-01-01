const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const Emoji = require('../../utils/emoji');
const consola = require('consola');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('join')
        .setDescription('Summon the bot to your voice channel'),

    async execute(interaction, client) {
        if (!interaction.guild) return interaction.reply({ content: 'This command can only be used in a server!', flags: MessageFlags.Ephemeral });

        await interaction.deferReply();

        const member = interaction.member;
        if (!member.voice.channel) return interaction.editReply(`${Emoji.error} You are not in a voice channel!`);

        try {
            const player = client.riffy.createConnection({
                guildId: interaction.guild.id,
                voiceChannel: member.voice.channel.id,
                textChannel: interaction.channel.id,
                deaf: true
            });

            const embed = new EmbedBuilder()
                .setColor('#2b2d31')
                .setTitle(`${Emoji.success} Joined Voice Channel`)
                .setDescription(`Successfully connected to ${member.voice.channel}.`)
                .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

            return interaction.editReply({ embeds: [embed] });
        } catch (error) {
            consola.error('Join command error:', error);
            return interaction.editReply(`${Emoji.error} Failed to join: ${error.message}`);
        }
    },
};
