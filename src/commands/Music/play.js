const { SlashCommandBuilder, EmbedBuilder, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Emoji = require('../../utils/emoji');
const consola = require('consola');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song or playlist')
    .addStringOption(option =>
      option
        .setName('query')
        .setDescription('Song name, URL, or artist')
        .setRequired(true)
        .setAutocomplete(true)
    ),

  async execute(interaction, client) {
    if (!client.riffy) {
      return interaction.reply(`${Emoji.error} Riffy is not connected!`);
    }

    if (!interaction.guild) return interaction.reply({ content: 'This command can only be used in a server!', flags: MessageFlags.Ephemeral });

    const query = interaction.options.getString('query');
    const member = interaction.member; // Use direct member property

    if (!member.voice.channel) {
      return interaction.reply(`${Emoji.error} You must be in a voice channel to play music!`);
    }

    await interaction.deferReply();

    try {
      const https = require('node:https'); // Not strictly needed for logic, but ensuring we detect URLs
      const isUrl = /^https?:\/\//.test(query);
      const searchNode = isUrl ? query : `ytsearch:${query}`;

      consola.info(`[Play Command] Searching for: ${searchNode}`);

      // Wait for Riffy to be ready (up to 5 seconds)
      let retries = 0;
      while ((!client.riffy.nodes || client.riffy.nodes.size === 0) && retries < 10) {
        await new Promise(r => setTimeout(r, 500));
        retries++;
      }
      if (!client.riffy.nodes || client.riffy.nodes.size === 0) {
        return interaction.editReply(`${Emoji.error} Music system is warming up. Please try again in a few seconds.`);
      }

      const resolve = await client.riffy.resolve({ query: searchNode, requester: interaction.user });
      const { loadType, tracks, playlistInfo } = resolve;

      if (loadType === 'empty') {
        return interaction.editReply(`${Emoji.error} No tracks found!`);
      }

      if (loadType === 'error') {
        return interaction.editReply(`${Emoji.error} Error loading tracks!`);
      }


      let player = client.riffy.players.get(interaction.guild.id);

      if (!player) {
        player = client.riffy.createConnection({
          guildId: interaction.guild.id,
          voiceChannel: member.voice.channel.id,
          textChannel: interaction.channel.id,
          deaf: true
        });

        // Wait for connection to establish
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const track = tracks[0];

      // Use Riffy native queue
      player.queue.add(track);

      consola.info(`[Play Command] Track added to queue. Queue length: ${player.queue.length}`);

      // logic: If not playing OR no current track loaded, we must hit play.
      if (!player.playing || !player.current) {
        consola.info(`[Play Command] Player not playing. Calling player.play()...`);

        // DEFENSIVE CODING: Force clear filters when starting new playback
        player.filters.clearFilters();
        player.setVolume(100);
        consola.info(`[Play Command] Reset filters and volume to default for new playback.`);

        // Small delay if this is the very first track to ensure voice connection is ready
        if (!player.current) await new Promise(r => setTimeout(r, 500));
        player.play();
      } else {
        consola.info(`[DEBUG] Player is already playing.`);
      }

      const embed = new EmbedBuilder()
        .setColor('#2b2d31')
        .setTitle('Track Added to Queue')
        .setDescription(`**[${track.info.title}](${track.info.uri})**`)
        .addFields(
          { name: `${Emoji.developer || '👤'} Artist`, value: track.info.author || 'Unknown', inline: true },
          { name: `${Emoji.time || '⏳'} Duration`, value: formatDuration(track.info.length), inline: true },
          { name: `${Emoji.queue || '📜'} Position`, value: `${player.queue.length}`, inline: true }
        )
        .setThumbnail(track.info.thumbnail || null)
        .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('flow_button')
          .setLabel('Flow Page')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji(Emoji.link || '🔗')
      );

      return interaction.editReply({ embeds: [embed], components: [row] });
    } catch (error) {
      consola.error('Play command error:', error);
      return interaction.editReply(`${Emoji.error} Error: ${error.message}`);
    }
  },
};

function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000) % 60;
  const minutes = Math.floor(ms / 60000) % 60;
  const hours = Math.floor(ms / 3600000);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
