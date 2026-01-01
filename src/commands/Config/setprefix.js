const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const Guild = require('../../database/Guild');
const Emoji = require('../../utils/emoji');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setprefix')
        .setDescription('Change the bot prefix for this server')
        .addStringOption(option =>
            option.setName('prefix')
                .setDescription('The new prefix to set')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild), // Only Manage Guild users

    async execute(interaction, client) {
        if (!interaction.guild) return interaction.reply({ content: 'This command can only be used in a server!', flags: MessageFlags.Ephemeral });

        const newPrefix = interaction.options.getString('prefix');

        if (newPrefix.length > 5) {
            return interaction.reply({ content: `${Emoji.error} Prefix cannot be longer than 5 characters!`, flags: MessageFlags.Ephemeral });
        }

        let guildData = await Guild.findById(interaction.guild.id);
        if (!guildData) {
            guildData = new Guild({ _id: interaction.guild.id });
        }

        guildData.prefix = newPrefix;
        await guildData.save();

        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setTitle(`${Emoji.success} Prefix Updated`)
            .setDescription(`The bot prefix has been changed to: \`${newPrefix}\``)
            .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

        return interaction.reply({ embeds: [embed] });
    },
};
