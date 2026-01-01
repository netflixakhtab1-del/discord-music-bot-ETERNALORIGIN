const { SlashCommandBuilder, EmbedBuilder, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder, StringSelectMenuBuilder } = require('discord.js');
const Guild = require('../../database/Guild');
const Emoji = require('../../utils/emoji');
const { generateCard } = require('../../utils/CardGenerator');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('musiccard')
        .setDescription('Previews and selects a music card theme.')
        .addStringOption(option =>
            option.setName('theme')
                .setDescription('Directly apply a theme (optional)')
                .setRequired(false)
                .addChoices(
                    { name: 'Classic', value: 'classic' },
                    { name: 'Spotify', value: 'spotify' },
                    { name: 'Landscape', value: 'landscape' },
                    { name: 'Neon', value: 'neon' },
                    { name: 'Cyberpunk', value: 'cyberpunk' },
                    { name: 'Retro', value: 'retro' },
                    { name: 'Light', value: 'light' },
                    { name: 'Dark', value: 'dark' },
                    { name: 'Pastel', value: 'pastel' },
                    { name: 'Ocean', value: 'ocean' },
                    { name: 'Crimson', value: 'crimson' },
                    { name: 'Midnight', value: 'midnight' },
                    { name: 'Forest', value: 'forest' },
                    { name: 'Sunset', value: 'sunset' },
                    { name: 'Blur', value: 'blur' },
                    { name: 'Anime', value: 'anime' }
                )
        ),

    async execute(interaction) {
        if (!interaction.guild) return interaction.reply({ content: 'This command can only be used in a server!', flags: MessageFlags.Ephemeral });

        const directTheme = interaction.options.getString('theme');

        if (directTheme) {
            // Apply directly
            let guildData = await Guild.findById(interaction.guild.id);
            if (!guildData) {
                guildData = new Guild({ _id: interaction.guild.id });
            }
            guildData.musicCardTheme = directTheme;
            await guildData.save();

            const embed = new EmbedBuilder()
                .setColor('#2b2d31')
                .setTitle(`${Emoji.success || '✅'} Theme Updated`)
                .setDescription(`Music card theme set to **${directTheme.charAt(0).toUpperCase() + directTheme.slice(1)}**!`);

            return interaction.reply({ embeds: [embed] });
        }

        // Handle prefix commands differently - no defer needed
        if (!interaction.isPrefix) {
            await interaction.deferReply();
        }

        const themes = [
            'classic', 'spotify', 'landscape', 'neon', 'cyberpunk',
            'retro', 'light', 'dark', 'pastel', 'ocean',
            'crimson', 'midnight', 'forest', 'sunset', 'blur', 'anime'
        ];

        let currentThemeIndex = 0;

        // Get current guild theme
        let guildData = await Guild.findById(interaction.guild.id);
        const currentGuildTheme = guildData?.musicCardTheme || 'classic';
        currentThemeIndex = themes.indexOf(currentGuildTheme);
        if (currentThemeIndex === -1) currentThemeIndex = 0;

        const generatePreviewMessage = async (index) => {
            const theme = themes[index];

            const buffer = await generateCard({
                info: {
                    title: 'Eternal Future',
                    author: 'ETERNALSONIC Demo',
                    length: 184000,
                    thumbnail: interaction.client.user.displayAvatarURL({ extension: 'png', size: 1024 }),
                    requester: interaction.user
                }
            }, theme);

            const embed = new EmbedBuilder()
                .setTitle(`${Emoji.art || '🎨'} Music Card Theme: ${theme.charAt(0).toUpperCase() + theme.slice(1)}`)
                .setDescription(`**Preview of the ${theme.charAt(0).toUpperCase() + theme.slice(1)} theme.**\nUse the buttons below to browse themes.\nClick **Apply Theme** to save.`)
                .setImage('attachment://preview.png')
                .setColor('#2b2d31')
                .setFooter({ text: `Theme ${index + 1}/${themes.length}` });

            const menuOptions = themes.map((t, i) => {
                return {
                    label: t.charAt(0).toUpperCase() + t.slice(1),
                    value: t,
                    description: `Preview ${t} theme`,
                    emoji: Emoji.art || '🎨',
                    default: index === i
                };
            });

            const flowRow = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('theme_select')
                    .setPlaceholder('Select a theme to preview')
                    .addOptions(menuOptions)
            );

            const rowButtons = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('prev')
                    .setLabel('Previous')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(index === 0),
                new ButtonBuilder()
                    .setCustomId('apply')
                    .setLabel(`${Emoji.check || '✅'} Apply Theme`)
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('next')
                    .setLabel('Next')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(index === themes.length - 1)
            );

            return { embeds: [embed], components: [flowRow, rowButtons], files: [{ attachment: buffer, name: 'preview.png' }] };
        };

        const initialMessage = await generatePreviewMessage(currentThemeIndex);
        const message = await interaction.editReply(initialMessage);

        const collector = message.createMessageComponentCollector({
            filter: i => i.user.id === interaction.user.id,
            time: 60000
        });

        collector.on('collect', async (i) => {
            if (i.customId === 'theme_select') {
                const selected = i.values[0];
                currentThemeIndex = themes.indexOf(selected);
            } else if (i.customId === 'prev') {
                currentThemeIndex--;
            } else if (i.customId === 'next') {
                currentThemeIndex++;
            } else if (i.customId === 'apply') {
                const selectedTheme = themes[currentThemeIndex];

                // Save to DB
                let guildData = await Guild.findById(interaction.guild.id);
                if (!guildData) {
                    guildData = new Guild({ _id: interaction.guild.id });
                }
                guildData.musicCardTheme = selectedTheme;
                await guildData.save();

                const embed = new EmbedBuilder()
                    .setColor('#2b2d31')
                    .setTitle(`${Emoji.success || '✅'} Theme Updated`)
                    .setDescription(`Music card theme set to **${selectedTheme.charAt(0).toUpperCase() + selectedTheme.slice(1)}**!`);

                await i.update({ embeds: [embed], components: [], files: [] });
                return collector.stop();
            }

            await i.deferUpdate();
            const response = await generatePreviewMessage(currentThemeIndex);
            await i.editReply(response);
        });

        collector.on('end', async (collected, reason) => {
            if (reason === 'time') {
                interaction.editReply({ components: [] }).catch(() => { });
            }
        });
    },
};
