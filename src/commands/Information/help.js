const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const Emoji = require('../../utils/emoji');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('List all commands'),

  async execute(interaction, client) {
    const embed = new EmbedBuilder()
      .setColor('#2b2d31')
      .setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL() })
      .setDescription(`Hey ${interaction.user}, I'm ${client.user}!\n\n- **A complete Music Bot for your server**\n- **Providing you the best quality music**`)
      .addFields({
        name: `${Emoji.link || '🔗'} **__My Commands:__**`,
        value: `
> ${Emoji.config || '⚙️'} \`:\` **Config**
> ${Emoji.information || 'ℹ️'} \`:\` **Information**
> ${Emoji.music || '🎵'} \`:\` **Music**
> ${Emoji.filterReset || '🎛️'} \`:\` **Filters**
        `,
      })
      .setImage(process.env.BOT_IMAGE_BG)
      .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
      .setFooter({
        text: `Made with ❤️ by ETERNALSONIC Team`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
      });

    const buttonRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('help_home').setEmoji(Emoji.home || '🏠').setStyle(ButtonStyle.Secondary),
    );

    const categories = ['Config', 'Information', 'Music', 'Filters'];
    const menu = new StringSelectMenuBuilder()
      .setCustomId('help_select')
      .setPlaceholder('Select a command category')
      .addOptions(categories.map(c => {
        let emoji = Emoji.folder || '📂';
        if (c === 'Music') emoji = Emoji.music || '🎵';
        if (c === 'Config') emoji = Emoji.config || '⚙️';
        if (c === 'Information') emoji = Emoji.information || 'ℹ️';
        if (c === 'Filters') emoji = Emoji.filterReset || '🎛️';

        return {
          label: c,
          value: c.toLowerCase(),
          description: `Get all ${c} commands`,
          emoji: emoji
        };
      }));

    const dropdownRow = new ActionRowBuilder().addComponents(menu);

    const msg = await interaction.reply({
      embeds: [embed],
      components: [dropdownRow, buttonRow],
      fetchReply: true
    });

    const collector = msg.createMessageComponentCollector({
      filter: (i) => i.user.id === interaction.user.id,
      time: 60000 * 5,
      idle: 30000,
    });

    collector.on("collect", async (i) => {
      if (i.customId === "help_home") {
        await i.update({ embeds: [embed], components: [dropdownRow, buttonRow] });
      } else if (i.customId === "help_select") {
        const selectedCategory = i.values[0];
        // Filter commands by category (case-insensitive check)
        const categoryCommands = client.slashCommands.map(c => c).filter(cmd => cmd.category && cmd.category.toLowerCase() === selectedCategory);

        const list = categoryCommands.map(cmd => `\`/${cmd.data.name}\``).join(', ');

        const categoryEmbed = new EmbedBuilder()
          .setColor('#2b2d31')
          .setTitle(`${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Commands`)
          .setDescription(list || "No commands found for this category.")
          .setFooter({
            text: `Total ${categoryCommands.length} commands.`,
            iconURL: client.user.displayAvatarURL({ dynamic: true }),
          });

        await i.update({ embeds: [categoryEmbed], components: [dropdownRow, buttonRow] });
      }
    });

    collector.on("end", () => {
      interaction.editReply({ components: [] }).catch(() => { });
    });
  },
};

