// Created by Gametime
// Discord Link: https://discord.gg/4pHM99WGXp
// Made with love, bot name is Eternal Star Emoji Manager
// ADVICE: DO NOT REMOVE THIS CREDIT!

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Emoji = require('../../utils/emoji');
const consola = require('consola');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop music and clear queue'),

  async execute(interaction, client) {
    const player = client.riffy.players.get(interaction.guild.id);
    if (!player) return interaction.reply({ content: `${Emoji.error} No music playing!`, ephemeral: true });

    player.destroy();

    const embed = new EmbedBuilder()
      .setColor('#2b2d31')
      .setTitle(`${Emoji.stop} Player Stopped`)
      .setDescription(`Destroyed the player and cleared the queue.`)
      .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

    return interaction.reply({ embeds: [embed] });
  },
};
