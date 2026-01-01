const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const Emoji = require('../../utils/emoji');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vote')
        .setDescription('Vote for the bot on Top.gg'),

    async execute(interaction, client) {
        const voteUrl = `https://top.gg/bot/${client.user.id}/vote`;

        const embed = new EmbedBuilder()
            .setColor('#FF3366')
            .setTitle('Vote for Us!')
            .setDescription(`Support **${client.user.username}** by voting on Top.gg! It really helps us out.`)
            .setThumbnail(client.user.displayAvatarURL());

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Vote on Top.gg')
                    .setStyle(ButtonStyle.Link)
                    .setURL(voteUrl)
            );

        await interaction.reply({ embeds: [embed], components: [row] });
    },
};
