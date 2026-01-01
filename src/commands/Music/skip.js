// Created by Gametime
// Discord Link: https://discord.gg/4pHM99WGXp
// Made with love, bot name is Eternal Star Emoji Manager
// ADVICE: DO NOT REMOVE THIS CREDIT!

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Emoji = require('../../utils/emoji');
const consola = require('consola');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip the current song'),

  async execute(interaction, client) {
    const player = client.riffy.players.get(interaction.guild.id);
    if (!player) return interaction.reply({ content: `${Emoji.error} No music playing!`, ephemeral: true });

    const currentOne = player.previousTrack || player.queue.current;
    player.previousTrack = player.queue.current; // Force update previous for Autoplay logic
    player.stop();

    const embed = new EmbedBuilder()
      .setColor('#2b2d31')
      .setTitle(`${Emoji.skip} Track Skipped`)
      .setDescription(`Skipped the current track.`)
      .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

    return interaction.reply({ embeds: [embed] });
  },
};
