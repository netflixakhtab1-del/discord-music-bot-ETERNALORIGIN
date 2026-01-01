const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, version } = require('discord.js');
const packageJson = require('../../../package.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('View bot statistics'),

    async execute(interaction, client) {
        const duration1 = Math.round((Date.now() - client.uptime) / 1000);
        const guildsCounts = client.guilds.cache.size;
        const channelsCounts = client.channels.cache.size;
        const usercount = client.users.cache.size;
        const ping = client.ws.ping;

        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setAuthor({
                name: `${client.user.username} Information`,
                iconURL: client.user.displayAvatarURL(),
            })
            .setFooter({
                text: 'Made with ❤️ by Gametime',
                iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
            })
            .setDescription(
                `>>> . Bot Name : ${client.user.username}\n. Servers : ${guildsCounts}\n. Channels : ${channelsCounts}\n. Users : ${usercount}\n. Discord.js : v${version}\n. Bot Version : v${packageJson.version}\n. Uptime : <t:${duration1}:R>\n. Ping : ${ping}ms`,
            );

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setStyle(ButtonStyle.Danger)
                .setCustomId(`guild4`)
                .setLabel(`${guildsCounts} Servers`)
                .setDisabled(true),
            new ButtonBuilder()
                .setStyle(ButtonStyle.Danger)
                .setCustomId(`guild5`)
                .setLabel(`${usercount} Users`)
                .setDisabled(true),
            new ButtonBuilder()
                .setStyle(ButtonStyle.Danger)
                .setCustomId(`guild6`)
                .setLabel(`${ping}ms`)
                .setDisabled(true),
        );
        return interaction.reply({ embeds: [embed], components: [row] });
    },
};

