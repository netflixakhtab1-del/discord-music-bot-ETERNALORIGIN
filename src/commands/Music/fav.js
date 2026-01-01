// Created by Gametime
// Discord Link: https://discord.gg/4pHM99WGXp
// Made with love, bot name is Eternal Star Emoji Manager
// ADVICE: DO NOT REMOVE THIS CREDIT!

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../../database/User');
const Emoji = require('../../utils/emoji');
const consola = require('consola');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fav')
        .setDescription('Manage your favorites commands')
        .addSubcommand(sub =>
            sub.setName('play').setDescription('Play your favorites')
        )
        .addSubcommand(sub =>
            sub.setName('list').setDescription('List your favorites')
        )
        .addSubcommand(sub =>
            sub.setName('add').setDescription('Add a song to favorites')
                .addStringOption(opt => opt.setName('query').setDescription('Song name or URL').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('remove').setDescription('Remove a song from favorites')
                .addIntegerOption(opt => opt.setName('index').setDescription('Song index to remove').setRequired(true))
        ),

    async execute(interaction, client) {
        const { riffy } = client;
        if (!riffy) return interaction.reply(`${Emoji.error} Riffy not ready!`);

        await interaction.deferReply();
        const subcommand = interaction.options.getSubcommand();

        let user = await User.findById(interaction.user.id);
        if (!user) user = new User({ _id: interaction.user.id });

        try {
            if (subcommand === 'play') {
                if (!user.favorites.length) return interaction.editReply(`${Emoji.error} You have no favorites!`);

                const member = interaction.guild.members.cache.get(interaction.user.id);
                if (!member.voice.channel) return interaction.editReply(`${Emoji.error} Join a voice channel first!`);

                let player = riffy.players.get(interaction.guild.id);
                if (!player) {
                    player = riffy.createConnection({
                        guildId: interaction.guild.id,
                        voiceChannel: member.voice.channel.id,
                        textChannel: interaction.channel.id,
                        deaf: true
                    });
                }

                for (const fav of user.favorites) {
                    const result = await riffy.resolve({ query: fav.uri, requester: interaction.user });
                    if (result && result.tracks.length) player.queue.add(result.tracks[0]);
                }

                if (!player.playing) player.play();
                return interaction.editReply(`${Emoji.success} Added **${user.favorites.length}** favorites to the queue!`);
            }

            if (subcommand === 'list') {
                if (!user.favorites.length) return interaction.editReply(`${Emoji.error} You have no favorites!`);

                const list = user.favorites.map((f, i) => `**${i + 1}.** [${f.title}](${f.uri})`).join('\n');
                const embed = new EmbedBuilder()
                    .setTitle(`${Emoji.favorite} Your Favorites`)
                    .setDescription(list.substring(0, 4000))
                    .setColor('Gold')
                    .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
                    .setFooter({ text: `Total: ${user.favorites.length} songs` });

                return interaction.editReply({ embeds: [embed] });
            }

            if (subcommand === 'add') {
                const query = interaction.options.getString('query');
                const result = await riffy.resolve({ query: query, requester: interaction.user });
                if (!result || !result.tracks.length) return interaction.editReply(`${Emoji.error} No track found!`);

                const track = result.tracks[0];
                if (user.favorites.some(f => f.uri === track.info.uri)) return interaction.editReply(`${Emoji.error} Already in favorites!`);

                user.favorites.push({ title: track.info.title, uri: track.info.uri, author: track.info.author });
                await user.save();
                return interaction.editReply(`${Emoji.success} Added **${track.info.title}** to favorites!`);
            }

            if (subcommand === 'remove') {
                const index = interaction.options.getInteger('index') - 1;
                if (index < 0 || index >= user.favorites.length) return interaction.editReply(`${Emoji.error} Invalid index!`);

                const removed = user.favorites.splice(index, 1)[0];
                await user.save();
                return interaction.editReply(`${Emoji.success} Removed **${removed.title}** from favorites!`);
            }

        } catch (err) {
            consola.error('Fav Command Error:', err);
            return interaction.editReply(`${Emoji.error} An error occurred: ${err.message}`);
        }
    }
};
