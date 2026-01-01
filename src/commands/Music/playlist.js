const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Playlist = require('../../database/Playlist');
const Emoji = require('../../utils/emoji');
const consola = require('consola');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('playlist')
        .setDescription('Manage your playlists')
        .addSubcommand(sub =>
            sub.setName('create').setDescription('Create a new playlist')
                .addStringOption(opt => opt.setName('name').setDescription('Playlist name').setRequired(true))
                .addBooleanOption(opt => opt.setName('private').setDescription('Is private?').setRequired(false))
        )
        .addSubcommand(sub =>
            sub.setName('delete').setDescription('Delete a playlist')
                .addStringOption(opt => opt.setName('name').setDescription('Playlist name').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('add').setDescription('Add song to playlist')
                .addStringOption(opt => opt.setName('name').setDescription('Playlist name').setRequired(true))
                .addStringOption(opt => opt.setName('query').setDescription('Song URL/Name').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('remove').setDescription('Remove song from playlist')
                .addStringOption(opt => opt.setName('name').setDescription('Playlist name').setRequired(true))
                .addIntegerOption(opt => opt.setName('index').setDescription('Song index').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('list').setDescription('List playlists or songs in a playlist')
                .addStringOption(opt => opt.setName('name').setDescription('Playlist name (optional)').setRequired(false))
        )
        .addSubcommand(sub =>
            sub.setName('play').setDescription('Play a playlist')
                .addStringOption(opt => opt.setName('name').setDescription('Playlist name').setRequired(true))
        ),

    async execute(interaction, client) {
        const { riffy } = client;
        if (!riffy) return interaction.reply(`${Emoji.error} Riffy not ready!`);

        await interaction.deferReply();
        const subcommand = interaction.options.getSubcommand();
        const name = interaction.options.getString('name');

        try {
            if (subcommand === 'create') {
                const isPrivate = interaction.options.getBoolean('private') || false;
                const exists = await Playlist.findOne({ ownerId: interaction.user.id, name: name });
                if (exists) return interaction.editReply(`${Emoji.error} Playlist **${name}** already exists!`);

                await Playlist.create({
                    ownerId: interaction.user.id,
                    name: name,
                    private: isPrivate,
                    songs: []
                });

                return interaction.editReply(`${Emoji.success} Created playlist **${name}**!`);
            }

            if (subcommand === 'delete') {
                const playlist = await Playlist.findOne({ ownerId: interaction.user.id, name: name });
                if (!playlist) return interaction.editReply(`${Emoji.error} Playlist not found!`);

                await Playlist.deleteOne({ _id: playlist._id });
                return interaction.editReply(`${Emoji.success} Deleted playlist **${name}**!`);
            }

            if (subcommand === 'add') {
                const playlist = await Playlist.findOne({ ownerId: interaction.user.id, name: name });
                if (!playlist) return interaction.editReply(`${Emoji.error} Playlist not found!`);

                const query = interaction.options.getString('query');
                const result = await riffy.resolve({ query: query, requester: interaction.user });
                if (!result || !result.tracks.length) return interaction.editReply(`${Emoji.error} No track found!`);

                const track = result.tracks[0];
                playlist.songs.push({ title: track.info.title, uri: track.info.uri, author: track.info.author });
                await playlist.save();

                return interaction.editReply(`${Emoji.success} Added **${track.info.title}** to **${name}**!`);
            }

            if (subcommand === 'play') {
                const playlist = await Playlist.findOne({ ownerId: interaction.user.id, name: name });
                if (!playlist) return interaction.editReply(`${Emoji.error} Playlist not found!`);

                if (!playlist.songs.length) return interaction.editReply(`${Emoji.error} Playlist is empty!`);

                const member = interaction.guild.members.cache.get(interaction.user.id);
                if (!member.voice.channel) return interaction.editReply(`${Emoji.error} Join voice channel!`);

                let player = riffy.players.get(interaction.guild.id);
                if (!player) {
                    player = riffy.createConnection({
                        guildId: interaction.guild.id,
                        voiceChannel: member.voice.channel.id,
                        textChannel: interaction.channel.id,
                        deaf: true
                    });
                }

                interaction.editReply(`${Emoji.loading} Loading ${playlist.songs.length} songs...`);

                let count = 0;
                for (const s of playlist.songs) {
                    const res = await riffy.resolve({ query: s.uri, requester: interaction.user });
                    if (res && res.tracks.length) {
                        player.queue.add(res.tracks[0]);
                        count++;
                    }
                }

                if (!player.playing) player.play();
                return interaction.editReply(`${Emoji.success} Queued **${count}** songs from **${name}**!`);
            }

            if (subcommand === 'list') {
                if (name) {
                    const playlist = await Playlist.findOne({ ownerId: interaction.user.id, name: name });
                    if (!playlist) return interaction.editReply(`${Emoji.error} Playlist not found!`);

                    if (!playlist.songs.length) return interaction.editReply(`${Emoji.error} Playlist is empty!`);
                    const list = playlist.songs.map((s, i) => `${i + 1}. [${s.title}](${s.uri})`).join('\n').substring(0, 4000);

                    const embed = new EmbedBuilder()
                        .setTitle(`${Emoji.playlist || '📜'} Playlist: ${name}`)
                        .setDescription(list)
                        .setColor('Orange');
                    return interaction.editReply({ embeds: [embed] });
                } else {
                    const playlists = await Playlist.find({ ownerId: interaction.user.id });
                    if (!playlists.length) return interaction.editReply(`${Emoji.error} You have no playlists!`);

                    const list = playlists.map(p => `- **${p.name}** (${p.songs.length} songs) [${p.private ? 'Private' : 'Public'}]`).join('\n');
                    const embed = new EmbedBuilder()
                        .setTitle(`${Emoji.playlist || '📜'} Your Playlists`)
                        .setDescription(list)
                        .setColor('Orange');
                    return interaction.editReply({ embeds: [embed] });
                }
            }

        } catch (err) {
            consola.error('Playlist Command Error:', err);
            return interaction.editReply(`${Emoji.error} Error: ${err.message}`);
        }
    }
};
