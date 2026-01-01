// Created by Gametime
// Discord Link: https://discord.gg/4pHM99WGXp
// Made with love, bot name is Eternal Star Emoji Manager
// ADVICE: DO NOT REMOVE THIS CREDIT!

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Emoji = require('../../utils/emoji');
const consola = require('consola');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Set music volume')
    .addIntegerOption(opt => opt.setName('amount').setDescription('Volume (0-200)').setMinValue(0).setMaxValue(200).setRequired(true)),

  async execute(interaction, client) {
    const player = client.riffy.players.get(interaction.guild.id);
    if (!player) return interaction.reply({ content: `${Emoji.error || '❌'} No music playing!`, ephemeral: true });

    let amount = interaction.options.getInteger('amount');

    // Strict Prefix Validation
    if (interaction.isPrefix) {
      // Get raw input to check for "100a" etc.
      // The mock implementation joins args for getString, so we can check that.
      const rawInput = interaction.options.getString('amount');

      if (!/^\d+$/.test(rawInput)) {
        return interaction.reply({
          content: `${Emoji.error || '❌'} Please enter a valid number (0-200)!`,
          ephemeral: true
        });
      }

      // Delete user message
      try {
        if (interaction.message && interaction.message.deletable) {
          await interaction.message.delete();
        }
      } catch (e) {
        consola.warn('Failed to delete user volume message:', e);
      }
    }

    if (amount === null) return interaction.reply({ content: `${Emoji.error || '❌'} Invalid number!`, ephemeral: true });

    if (amount < 0) amount = 0;
    if (amount > 200) amount = 200;

    player.setVolume(amount);

    const embed = new EmbedBuilder()
      .setColor('#2b2d31')
      .setDescription(`${Emoji.volume || '🔊'} Volume set to **${amount}%**`)
      .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

    return interaction.reply({ embeds: [embed] });
  },
};
