const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const Emoji = require('../../utils/emoji');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('controls')
        .setDescription('Show music control panel'),

    async execute(interaction, client) {
        const player = client.riffy.players.get(interaction.guild.id);
        if (!player) return interaction.reply({ content: `${Emoji.error || '❌'} No music playing!`, ephemeral: true });

        if (!interaction.guild) return interaction.reply({ content: 'This command can only be used in a server!', flags: MessageFlags.Ephemeral });

        await interaction.deferReply();

        const generateControlEmbed = () => {
            const track = player.current;
            if (!track) return null;

            const embed = new EmbedBuilder()
                .setColor('#2b2d31')
                .setTitle(`${Emoji.music || '🎵'} Music Controls`)
                .setDescription(`**[${track.info.title}](${track.info.uri})**\n**Artist:** ${track.info.author}\n**Requested by:** ${track.info.requester}`)
                .addFields(
                    { name: 'Volume', value: `${player.volume}%`, inline: true },
                    { name: 'Status', value: player.playing ? 'Playing' : 'Paused', inline: true },
                    { name: 'Queue', value: `${player.queue.size} songs`, inline: true }
                )
                .setThumbnail(track.info.thumbnail || client.user.displayAvatarURL())
                .setFooter({ text: `Use buttons below to control music` });

            return embed;
        };

        const generateButtons = () => {
            const row1 = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('prev')
                    .setLabel('⏮️')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('play_pause')
                    .setLabel(player.playing ? '⏸️' : '▶️')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('skip')
                    .setLabel('⏭️')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('stop')
                    .setLabel('⏹️')
                    .setStyle(ButtonStyle.Danger)
            );

            const row2 = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('vol_down')
                    .setLabel('🔉')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('vol_up')
                    .setLabel('🔊')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('shuffle')
                    .setLabel('🔀')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('loop')
                    .setLabel('🔁')
                    .setStyle(ButtonStyle.Secondary)
            );

            return [row1, row2];
        };

        const embed = generateControlEmbed();
        if (!embed) return interaction.editReply(`${Emoji.error} No track playing!`);

        const components = generateButtons();
        const message = await interaction.editReply({ embeds: [embed], components });

        const collector = message.createMessageComponentCollector({
            filter: i => i.user.id === interaction.user.id,
            time: 300000 // 5 minutes
        });

        collector.on('collect', async (i) => {
            await i.deferUpdate();

            try {
                switch (i.customId) {
                    case 'prev':
                        // Restart current track
                        player.seek(0);
                        break;
                    case 'play_pause':
                        if (player.playing) {
                            player.pause();
                        } else {
                            player.resume();
                        }
                        break;
                    case 'skip':
                        player.skip();
                        break;
                    case 'stop':
                        player.destroy();
                        await i.editReply({ content: `${Emoji.success} Stopped music and cleared queue!`, embeds: [], components: [] });
                        return collector.stop();
                    case 'vol_down':
                        const newVolDown = Math.max(0, player.volume - 10);
                        player.setVolume(newVolDown);
                        break;
                    case 'vol_up':
                        const newVolUp = Math.min(100, player.volume + 10);
                        player.setVolume(newVolUp);
                        break;
                    case 'shuffle':
                        player.queue.shuffle();
                        break;
                    case 'loop':
                        // Toggle loop modes
                        const modes = ['none', 'track', 'queue'];
                        const currentMode = player.loop;
                        const nextMode = modes[(modes.indexOf(currentMode) + 1) % modes.length];
                        player.setLoop(nextMode);
                        break;
                }

                // Update embed and buttons
                const updatedEmbed = generateControlEmbed();
                const updatedComponents = generateButtons();
                await i.editReply({ embeds: [updatedEmbed], components: updatedComponents });

            } catch (error) {
                console.error(error);
                await i.followUp({ content: `${Emoji.error} An error occurred!`, ephemeral: true });
            }
        });

        collector.on('end', async (collected, reason) => {
            if (reason === 'time') {
                interaction.editReply({ components: [] }).catch(() => {});
            }
        });
    },
};