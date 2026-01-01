// Created by Gametime
// Discord Link: https://discord.gg/4pHM99WGXp
// Made with love, bot name is Eternal Star Emoji Manager
// ADVICE: DO NOT REMOVE THIS CREDIT!

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder, MessageFlags } = require('discord.js');
const Emoji = require('../../utils/emoji');
const Guild = require('../../database/Guild');
const consola = require('consola');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Show current song'),

  async execute(interaction, client) {
    const player = client.riffy.players.get(interaction.guild.id);
    if (!player) return interaction.reply({ content: `${Emoji.error || '❌'} No music playing!`, flags: MessageFlags.Ephemeral });

    if (!player.current) return interaction.reply({ content: `${Emoji.error || '❌'} No track playing!`, flags: MessageFlags.Ephemeral });

    await interaction.deferReply();

    // Get guild theme
    let guildData = await Guild.findById(interaction.guild.id);
    const theme = guildData?.musicCardTheme || 'classic';

    try {
      const CardGenerator = require('../../utils/CardGenerator');

      const buffer = await CardGenerator.generateCard(player.current, theme);
      const attachment = new AttachmentBuilder(buffer, { name: 'nowplaying.png' });

      const embed = new EmbedBuilder()
        .setColor('#2b2d31')
        .setAuthor({ name: 'Now Playing', iconURL: client.user.displayAvatarURL() })
        .setDescription(`**[${player.current.info.title}](${player.current.info.uri})**`)
        .addFields(
          { name: 'Artist', value: player.current.info.author || 'Unknown', inline: false },
          { name: 'Requested By', value: `${player.current.info.requester}`, inline: false },
          { name: 'Duration', value: `<t:${Math.floor((Date.now() + (player.current.info.length - player.position)) / 1000)}:R>`, inline: false }
        )
        .setImage('attachment://nowplaying.png')
        .setFooter({ text: `Theme: ${theme} | Volume: ${player.volume}%` });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('restart')
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
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('vol_down')
          .setLabel('🔉')
          .setStyle(ButtonStyle.Secondary)
      );

      const message = await interaction.editReply({ embeds: [embed], files: [attachment], components: [row] });

      const collector = message.createMessageComponentCollector({
        filter: i => i.user.id === interaction.user.id,
        time: 300000
      });

      collector.on('collect', async (i) => {
        await i.deferUpdate();

        try {
          switch (i.customId) {
            case 'restart':
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
              await i.editReply({ content: `${Emoji.success} Stopped music and cleared queue!`, embeds: [], components: [], files: [] });
              return collector.stop();
            case 'vol_down':
              const newVol = Math.max(0, player.volume - 10);
              player.setVolume(newVol);
              break;
          }

          // Update embed
          const updatedBuffer = await CardGenerator.generateCard(player.current, theme);
          const updatedAttachment = new AttachmentBuilder(updatedBuffer, { name: 'nowplaying.png' });
          const updatedEmbed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setAuthor({ name: 'Now Playing', iconURL: client.user.displayAvatarURL() })
            .setDescription(`**[${player.current.info.title}](${player.current.info.uri})**`)
            .addFields(
              { name: 'Artist', value: player.current.info.author || 'Unknown', inline: false },
              { name: 'Requested By', value: `${player.current.info.requester}`, inline: false },
              { name: 'Duration', value: `<t:${Math.floor((Date.now() + (player.current.info.length - player.position)) / 1000)}:R>`, inline: false }
            )
            .setImage('attachment://nowplaying.png')
            .setFooter({ text: `Theme: ${theme} | Volume: ${player.volume}%` });

          const updatedRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('restart')
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
              .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
              .setCustomId('vol_down')
              .setLabel('🔉')
              .setStyle(ButtonStyle.Secondary)
          );

          await i.editReply({ embeds: [updatedEmbed], files: [updatedAttachment], components: [updatedRow] });

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

    } catch (err) {
      consola.error('NowPlaying Command Error:', err);
      return interaction.editReply(`${Emoji.error} An error occurred: ${err.message}`);
    }
  }
};

function createProgressBar(current, total, size = 15) {
  const progress = Math.round((size * current) / total);
  const emptyProgress = size - progress;

  const progressText = '▬'.repeat(progress);
  const emptyProgressText = '▬'.repeat(emptyProgress);

  return `${progressText}${Emoji.radio || '🔘'}${emptyProgressText}`;
}

function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000) % 60;
  const minutes = Math.floor(ms / 60000) % 60;
  const hours = Math.floor(ms / 3600000);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
