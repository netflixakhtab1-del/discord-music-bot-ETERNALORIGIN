// Created by Gametime
// Discord Link: https://discord.gg/4pHM99WGXp
// Made with love, bot name is Eternal Star Emoji Manager
// ADVICE: DO NOT REMOVE THIS CREDIT!

const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const Emoji = require('../../utils/emoji');
const consola = require('consola');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Show the music queue')
    .addNumberOption(option =>
      option
        .setName('page')
        .setDescription('Page number')
        .setRequired(false)
        .setMinValue(1)
    ),

  async execute(interaction, client) {
    const player = client.riffy.players.get(interaction.guild.id);
    if (!player) {
      return interaction.reply({ content: `${Emoji.error} No music playing!`, flags: MessageFlags.Ephemeral });
    }

    if (player.queue.length === 0 && !player.current) {
      return interaction.reply({ content: `${Emoji.error} Queue is empty!`, flags: MessageFlags.Ephemeral });
    }

    const pageNum = interaction.options.getNumber('page') || 1;
    const itemsPerPage = 10;
    const totalPages = Math.ceil(player.queue.length / itemsPerPage) || 1;

    if (pageNum > totalPages) {
      return interaction.reply(`${Emoji.error} Page ${pageNum} does not exist! (Total pages: ${totalPages})`);
    }

    const start = (pageNum - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const queueTracks = player.queue.slice(start, end);

    let description = '';
    if (player.current) {
      description += `**Currently Playing:**\n[${player.current.info.title}](${player.current.info.uri}) \`[${formatDuration(player.current.info.length)}]\`\n\n**Queue:**\n`;
    } else {
      description += `**Queue:**\n`;
    }

    if (queueTracks.length === 0) {
      description += 'No more songs in queue.';
    } else {
      queueTracks.forEach((track, index) => {
        const position = start + index + 1;
        const duration = formatDuration(track.info.length);
        description += `${position}. [${track.info.title}](${track.info.uri}) - \`[${duration}]\`\n`;
      });
    }

    const embed = new EmbedBuilder()
      .setColor('#2b2d31')
      .setTitle(`${Emoji.queue} Music Queue`)
      .setDescription(description)
      .setThumbnail(player.current?.info.thumbnail || client.user.displayAvatarURL())
      .setFooter({ text: `Page ${pageNum} of ${totalPages} • Total: ${player.queue.length + (player.current ? 1 : 0)} songs`, iconURL: client.user.displayAvatarURL() });

    return interaction.reply({ embeds: [embed] });
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
