const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const Autoplay = require("../../schema/Autoplay");
const Emoji = require("../../utils/emoji");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("autoplay")
        .setDescription("Toggle music autoplay"),

    async execute(interaction, client) {
        // 1. Defer Reply
        await interaction.deferReply();

        // 2. Get Player
        const player = client.riffy.players.get(interaction.guild.id);
        if (!player) {
            return interaction.editReply({
                content: `${Emoji.error || '❌'} No active player found for this guild. Play some music first!`
            });
        }

        // 3. Toggle Logic
        const isAutoplay = player.isAutoplay || false;

        if (isAutoplay) {
            // Disable
            player.isAutoplay = false;
            try {
                await Autoplay.findOneAndUpdate(
                    { guildId: interaction.guild.id },
                    { enabled: false },
                    { upsert: true }
                );
            } catch (e) {
                console.error(`Failed to persist autoplay disable: ${e}`);
            }

            const embed = new EmbedBuilder()
                .setColor('#2b2d31') // client.color -> hardcoded or use config
                .setAuthor({
                    name: "Autoplay is now disabled",
                    iconURL: interaction.member.displayAvatarURL(),
                })
                .setDescription(`**Status**: ${Emoji.error || '❌'} Disabled`);

            return interaction.editReply({ embeds: [embed] });

        } else {
            // Enable
            player.isAutoplay = true;
            try {
                await Autoplay.findOneAndUpdate(
                    { guildId: interaction.guild.id },
                    {
                        enabled: true,
                        textChannelId: player.textChannel || null,
                        voiceChannelId: player.voiceChannel || null
                    },
                    { upsert: true },
                );
            } catch (e) {
                console.error(`Failed to persist autoplay enable: ${e}`);
            }

            const embed = new EmbedBuilder()
                .setColor('#2b2d31')
                .setAuthor({
                    name: "Autoplay is now enabled",
                    iconURL: interaction.member.displayAvatarURL(),
                })
                .setDescription(`**Status**: ${Emoji.success || '✅'} Enabled\n**Next**: Smart Random & Author Focus`);

            return interaction.editReply({ embeds: [embed] });
        }
    },
};
