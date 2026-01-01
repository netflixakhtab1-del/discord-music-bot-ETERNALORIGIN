const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Emoji = require('../../utils/emoji');
const packageJson = require('../../../package.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('about')
        .setDescription('Get information about the bot'),

    async execute(interaction, client) {
        const duration1 = Math.round((Date.now() - client.uptime) / 1000);

        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setAuthor({ name: `${client.user.username} Information`, iconURL: client.user.displayAvatarURL() })
            .setDescription(`**${client.user.username}** is a next-generation music bot with premium audio quality and advanced features.`)
            .addFields(
                {
                    name: `${Emoji.information || 'ℹ️'} **Bot Information**`,
                    value: `> ${Emoji.developer || '👨‍💻'} **Developer:** Gametime\n> ${Emoji.star || '🌟'} **Aura:** Infinite\n> ${Emoji.link || '🔗'} **Version:** v${packageJson.version}\n> ${Emoji.library || '📚'} **Library:** Discord.js & Riffy`,
                    inline: true
                },
                {
                    name: `${Emoji.config || '⚙️'} **System Stats**`,
                    value: `> ${Emoji.server || '🖥️'} **Servers:** ${client.guilds.cache.size}\n> ${Emoji.users || '👥'} **Users:** ${client.users.cache.size}\n> ${Emoji.time || '🕒'} **Uptime:** <t:${duration1}:R>\n> ${Emoji.ping || '🏓'} **Ping:** ${client.ws.ping}ms`,
                    inline: true
                }
            )
            .setImage(process.env.BOT_IMAGE_BG)
            .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: 'Made with ❤️ by Gametime' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('Support Server')
                .setStyle(ButtonStyle.Link)
                .setURL(process.env.SUPPORT_SERVER || 'https://discord.gg/4pHM99WGXp'),
            new ButtonBuilder()
                .setLabel('Add Bot')
                .setStyle(ButtonStyle.Link)
                .setURL(`https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`)
        );

        return interaction.reply({ embeds: [embed], components: [row] });
    },
};

