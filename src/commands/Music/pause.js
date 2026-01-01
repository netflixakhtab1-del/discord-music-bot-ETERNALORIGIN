// Created by Gametime
// Discord Link: https://discord.gg/4pHM99WGXp
// Made with love, bot name is Eternal Star Emoji Manager
// ADVICE: DO NOT REMOVE THIS CREDIT!

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Emoji = require('../../utils/emoji');
const consola = require('consola');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pause current song'),

  async execute(interaction, client) {
    const player = client.riffy.players.get(interaction.guild.id);
    if (!player) return interaction.reply({ content: `${Emoji.error} No music playing!`, ephemeral: true });

    player.pause(!player.paused);
    const isPaused = player.paused;

    const embed = new EmbedBuilder()
      .setColor('#2b2d31')
      .setTitle(isPaused ? `${Emoji.pause} Paused` : `${Emoji.resume} Resumed`)
      .setDescription(`Playback has been ${isPaused ? 'paused' : 'resumed'}.`)
      .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

    return interaction.reply({ embeds: [embed] });
  },
};
