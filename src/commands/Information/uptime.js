const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Emoji = require('../../utils/emoji');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('uptime')
        .setDescription('Check how long the bot has been online'),

    async execute(interaction, client) {
        const duration1 = Math.round((Date.now() - client.uptime) / 1000);

        const embed = new EmbedBuilder()
            .setDescription(`${Emoji.time || '🕒'} | **My Last Boot Was** <t:${duration1}:R>`)
            .setColor('#2b2d31')
            .setFooter({ text: 'Online & Ready', iconURL: client.user.displayAvatarURL() });

        return interaction.reply({ embeds: [embed] });
    },
};

