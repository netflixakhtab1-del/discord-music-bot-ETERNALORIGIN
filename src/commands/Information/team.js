const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const Emoji = require('../../utils/emoji');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('team')
        .setDescription('Meet the team behind the bot'),

    async execute(interaction, client) {
        // IDs
        const gametimeId = process.env.GAMETIME_ID || "1206125304116940810";
        const devillordId = process.env.DEVILLORD_ID || "1321015848789479429";

        // Fetch users (safe fetch) or assume images if provided
        const gametime = await client.users.fetch(gametimeId).catch(() => null);
        const devillord = await client.users.fetch(devillordId).catch(() => null);

        const gametimeName = gametime ? gametime.username : "Gametime";
        const devillordName = devillord ? devillord.username : "DevilLord";

        const mainEmbed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setAuthor({ name: `${client.user.username} Team`, iconURL: client.user.displayAvatarURL() })
            .setDescription(`> **Our Team**\nWe are a group of passionate developers dedicated to providing the best music experience on Discord.`)
            .addFields(
                { name: `${Emoji.crown || '👑'} Owner & Dev`, value: `[${gametimeName}](https://discord.com/users/${gametimeId})`, inline: true },
                { name: `${Emoji.laptop || '💻'} Co-Owner & Dev`, value: `[${devillordName}](https://discord.com/users/${devillordId})`, inline: true }
            )
            .setImage(process.env.BOT_IMAGE_BG)
            .setThumbnail(interaction.guild ? interaction.guild.iconURL({ dynamic: true }) : client.user.displayAvatarURL())
            .setFooter({ text: 'Made with ❤️ by Gametime', iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });

        const selectMenu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('team_select')
                .setPlaceholder('Select a team member to see more info')
                .addOptions([
                    {
                        label: gametimeName,
                        value: 'gametime',
                        description: "Owner & Developer",
                        emoji: Emoji.crown || '👑',
                    },
                    {
                        label: devillordName,
                        value: 'devillord',
                        description: "Co-Owner & Developer",
                        emoji: Emoji.laptop || '💻',
                    },
                ])
        );

        const resetButton = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('team_reset')
                .setLabel('Back to Team')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji(Emoji.return || '↩️')
        );

        const msg = await interaction.reply({
            embeds: [mainEmbed],
            components: [selectMenu],
            fetchReply: true
        });

        const collector = msg.createMessageComponentCollector({
            filter: (i) => i.user.id === interaction.user.id,
            time: 60000 * 5,
            idle: 30000,
        });

        collector.on("collect", async (i) => {
            if (i.customId === 'team_reset') {
                await i.update({ embeds: [mainEmbed], components: [selectMenu] });
                return;
            }

            if (i.customId === 'team_select') {
                const value = i.values[0];
                let memberEmbed = new EmbedBuilder().setColor('#2b2d31');

                if (value === 'gametime') {
                    const links = [];
                    if (process.env.GAMETIME_INSTA) links.push(`[Instagram](${process.env.GAMETIME_INSTA})`);
                    if (process.env.GAMETIME_GITHUB) links.push(`[GitHub](${process.env.GAMETIME_GITHUB})`);
                    if (process.env.GAMETIME_DISCORD) links.push(`[Discord](${process.env.GAMETIME_DISCORD})`);
                    else links.push(`[Discord](https://discord.com/users/${gametimeId})`); // Default to ID link if no custom link

                    // Support Server is always added
                    links.push(`[Support Server](${process.env.SUPPORT_SERVER || "https://discord.gg/4pHM99WGXp"})`);

                    memberEmbed
                        .setAuthor({ name: `About ${gametimeName}`, iconURL: gametime?.displayAvatarURL() || process.env.GAMETIME_PIC })
                        .setDescription(`> **Owner & Developer**\n> The creator and lead developer of ETERNALSONIC.\n> ${links.join(' | ')}`)
                        .setThumbnail(gametime?.displayAvatarURL({ dynamic: true }) || process.env.GAMETIME_PIC)
                        .setImage(process.env.GAMETIME_PIC || gametime?.displayAvatarURL({ size: 1024, extension: 'png' }));

                } else if (value === 'devillord') {
                    const links = [];
                    if (process.env.DEVILLORD_INSTA) links.push(`[Instagram](${process.env.DEVILLORD_INSTA})`);
                    if (process.env.DEVILLORD_GITHUB) links.push(`[GitHub](${process.env.DEVILLORD_GITHUB})`);
                    if (process.env.DEVILLORD_DISCORD) links.push(`[Discord](${process.env.DEVILLORD_DISCORD})`);
                    else links.push(`[Discord](https://discord.com/users/${devillordId})`);

                    links.push(`[Support Server](${process.env.SUPPORT_SERVER || "https://discord.gg/4pHM99WGXp"})`);

                    memberEmbed
                        .setAuthor({ name: `About ${devillordName}`, iconURL: devillord?.displayAvatarURL() || process.env.DEVILLORD_PIC })
                        .setDescription(`> **Co-Owner & Developer**\n> Helping build and maintain the bot infrastructure.\n> ${links.join(' | ')}`)
                        .setThumbnail(devillord?.displayAvatarURL({ dynamic: true }) || process.env.DEVILLORD_PIC)
                        .setImage(process.env.DEVILLORD_PIC || devillord?.displayAvatarURL({ size: 1024, extension: 'png' }));
                }

                await i.update({ embeds: [memberEmbed], components: [selectMenu, resetButton] });
            }
        });

        collector.on("end", () => {
            interaction.editReply({ components: [] }).catch(() => { });
        });
    },
};

