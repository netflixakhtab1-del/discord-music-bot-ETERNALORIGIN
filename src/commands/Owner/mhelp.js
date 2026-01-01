const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Emoji = require('../../utils/emoji');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mhelp')
        .setDescription('Master Help (Owner Only)'),

    async execute(interaction, client) {
        const embed = new EmbedBuilder()
            .setColor('#ff0000') // Red for owner
            .setTitle(`${Emoji.shield || '🛡️'} Master Commands`)
            .setDescription('Bot Owner.')
            .addFields(
                { name: '!maintenance <cmd> [time]', value: 'Lock a command for a duration (Default 24h).', inline: false },
                { name: '!leaveserver [id]', value: 'Leave the current or specified server.', inline: false },
                { name: '!serverlist', value: 'List all servers the bot is in.', inline: false },
                { name: '!blacklist <user_id>', value: 'Ban a user from using the bot.', inline: false },
                { name: '!restart', value: 'Restart the bot process.', inline: false },
                { name: '!reload', value: 'Reload all commands.', inline: false },
            );
        return interaction.reply({ embeds: [embed] });
    },
};
