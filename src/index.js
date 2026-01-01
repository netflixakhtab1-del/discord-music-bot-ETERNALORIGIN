// Created by Gametime
// Discord Link: https://discord.gg/4pHM99WGXp
// Made with love, bot name is Eternal Star Emoji Manager
// ADVICE: DO NOT REMOVE THIS CREDIT!

require('node:dns').setDefaultResultOrder('ipv4first');
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Client, GatewayIntentBits, Partials, Collection, Events, AttachmentBuilder, StringSelectMenuBuilder, MessageFlags, REST, Routes, ActivityType, ChannelType } = require('discord.js');
const { Riffy } = require('riffy');
const consola = require('consola');
const connectDB = require('./utils/db');
const Guild = require('./database/Guild');
const Autoplay = require('./schema/Autoplay'); // Persistence
const Emoji = require('./utils/emoji');
const Topgg = require('@top-gg/sdk');
const express = require('express');

// Initialize Discord Client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages,
  ],
});

// Initialize command collections
client.commands = new Collection();
client.slashCommands = new Collection();
client.prefixCommands = new Collection();
client.ownerCommands = new Collection(); // New
client.maintenance = new Map(); // New { 'command': { expiry: timestamp } }
client.blacklist = new Set(); // New
client.cooldowns = new Collection();

// Log Lavalink connection details
consola.info('[Lavalink Config]');
consola.info(`  Host: ${process.env.LAVALINK_HOST}:${process.env.LAVALINK_PORT}`);
consola.info(`  Secure: ${process.env.LAVALINK_SECURE}`);

const nodes = [{
  host: process.env.LAVALINK_HOST,
  port: parseInt(process.env.LAVALINK_PORT),
  password: process.env.LAVALINK_PASSWORD,
  secure: process.env.LAVALINK_SECURE === 'true',
}];

const { Classic } = require('musicard');
const CardGenerator = require('./utils/CardGenerator');

const riffy = new Riffy(client, nodes, {
  send: (payload) => {
    const guild = client.guilds.cache.get(payload.d.guild_id);
    if (guild) guild.shard.send(payload);
  },
  defaultSearchPlatform: 'ytmsearch',
  restVersion: 'v4',
});

client.riffy = riffy;

// Listeners
client.on('raw', (d) => {
  riffy.updateVoiceState(d);
});

riffy.on('nodeConnect', (node) => {
  consola.success(`[Riffy] ✅ Node connected: ${node.name}`);
});

riffy.on('nodeError', (node, error) => {
  consola.error(`[Riffy Error] Node: ${node.name} | Error: ${error.message || error}`);
});

riffy.on('trackError', (player, track, payload) => {
  consola.error(`[Riffy] Track error in ${player.guildId}! Track: ${track.info.title} | Error: ${payload.exception ? payload.exception.message : 'Unknown'}`);
  const channel = client.channels.cache.get(player.textChannel);
  if (channel) channel.send(`${Emoji.error} Error playing **${track.info.title}**: ${payload.exception ? payload.exception.message : 'Playback failed'}`);
});

riffy.on('trackStuck', (player, track, threshold) => {
  consola.warn(`[Riffy] Track stuck in ${player.guildId}! Track: ${track.info.title} | Threshold: ${threshold}ms`);
  const channel = client.channels.cache.get(player.textChannel);
  if (channel) channel.send(`${Emoji.error} Track stuck: **${track.info.title}**. Skipping...`);
  player.stop();
});

riffy.on('trackStart', async (player, track) => {
  player.previousTrack = track;

  // Load Autoplay Persistence if not set
  if (player.isAutoplay === undefined) {
    try {
      const data = await Autoplay.findOne({ guildId: player.guildId });
      if (data && data.enabled) {
        player.isAutoplay = true;
        consola.info(`[Persistence] Loaded Autoplay: ENABLED for ${player.guildId}`);
      } else {
        player.isAutoplay = false;
      }
    } catch (e) {
      player.isAutoplay = false;
      consola.error(`[Persistence] Failed to load autoplay: ${e}`);
    }
  }

  // Track History for Autoplay Loop Prevention
  if (!player.playedTracks) player.playedTracks = [];
  player.playedTracks.push(track.info.identifier);
  if (player.playedTracks.length > 20) player.playedTracks.shift(); // Keep last 20 for strict no-repeat

  consola.info(`[Riffy] Track started in ${player.guildId}: ${track.info.title}`);

  const channel = client.channels.cache.get(player.textChannel);
  if (!channel) return;

  try {
    // Generate Music Card
    let theme = 'classic';
    const guildData = await Guild.findById(player.guildId);
    if (guildData && guildData.musicCardTheme) theme = guildData.musicCardTheme;

    const buffer = await CardGenerator.generateCard(track, theme);

    const attachment = new AttachmentBuilder(buffer, { name: 'musicard.png' });

    // Buttons
    const buttonRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('music_pause').setLabel('Pause').setEmoji(Emoji.pause).setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('music_skip').setLabel('Skip').setEmoji(Emoji.skip).setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('music_stop').setLabel('Stop').setEmoji(Emoji.stop).setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('music_loop').setLabel('Loop').setEmoji(Emoji.loop).setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('music_shuffle').setLabel('Shuffle').setEmoji(Emoji.shuffle).setStyle(ButtonStyle.Secondary),
    );

    // Fav Button
    const favRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('fav_add').setLabel('Add to Favorites').setEmoji(Emoji.favorite).setStyle(ButtonStyle.Success)
    );

    // Filters Select Menu
    const filterRow = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('music_filter')
        .setPlaceholder('Select Filters')
        .addOptions([
          { label: 'Reset Filters', value: 'clear', emoji: Emoji.filterReset },
          { label: 'Pitch', value: 'pitch', emoji: Emoji.filterPitch },
          { label: 'Lofi', value: 'lofi', emoji: Emoji.filterLofi },
          { label: 'Distort', value: 'distort', emoji: Emoji.filterDistort },
          { label: 'Speed', value: 'speed', emoji: Emoji.filterSpeed },
          { label: 'Vaporwave', value: 'vaporwave', emoji: Emoji.filterVaporwave },
        ])
    );

    // Create Embed
    const embed = new EmbedBuilder()
      .setColor('#2b2d31') // Dark/Premium color
      .setAuthor({ name: 'Now Playing', iconURL: client.user.displayAvatarURL() })
      .setDescription(`**[${track.info.title}](${track.info.uri})**\nby **${track.info.author}**`)
      .setImage('attachment://musicard.png')
      .setFooter({ text: `Requested by ${track.info.requester?.globalName || track.info.requester?.username || 'User'}`, iconURL: track.info.requester?.displayAvatarURL ? track.info.requester.displayAvatarURL() : client.user.displayAvatarURL() });

    const msg = await channel.send({
      embeds: [embed],
      files: [attachment],
      components: [filterRow, buttonRow, favRow]
    });

    player.nowPlayingMessageId = msg.id;
    consola.info(`[Riffy] [DEBUG] Now Playing message sent: ${msg.id}`);

  } catch (e) {
    consola.error(`[Riffy] [DEBUG] Error generating Now Playing card: ${e.message}`);
    // Fallback if card generation fails
    channel.send(`🎶 Now Playing: **${track.info.title}** \n(Card generation failed: ${e.message})`);
  }
});

riffy.on('trackEnd', async (player, track, payload) => {
  consola.info(`[Riffy] Track ended in ${player.guildId}. Reason: ${payload.reason}`);
  // If track Exception occurred, it might show here as well
  if (payload.reason === 'LOAD_FAILED' || payload.reason === 'CLEANUP') {
    consola.warn(`[Riffy] Track ended abnormally: ${payload.reason}`);
  }
});

riffy.on('queueEnd', async (player) => {
  const channel = client.channels.cache.get(player.textChannel);

  // Autoplay Logic
  try {
    const isAutoplay = player.isAutoplay === true; // Strict boolean check
    consola.info(`[Autoplay DEBUG] Queue ended for ${player.guildId}. Enabled: ${isAutoplay} (Raw: ${player.isAutoplay})`);

    if (isAutoplay) {
      const previous = player.previousTrack;
      consola.info(`[Autoplay Check] Previous Track: ${previous ? previous.info.title : 'None'}`);
      // player.autoplay = false; // logic removed to keep autoplay enabled
      if (previous) {
        consola.info(`[Autoplay] Queue ended. Searching for similar tracks to: ${previous.info.title}`);

        // Strategy 1: Prioritize Artist/Album (User Request: "play song owner albumb")
        let query = `${previous.info.author} official songs`;
        let resolve = await riffy.resolve({ query: query, source: 'ytmsearch', requester: previous.info.requester });

        // Strategy 2: Fallback to Related/Language (User Request: "shift to other owner song same as launage")
        if (!resolve || resolve.tracks.length === 0) {
          consola.info(`[Autoplay] Strategy 1 (Artist) failed. Trying Strategy 2: Related.`);
          query = `related ${previous.info.title} ${previous.info.author}`;
          resolve = await riffy.resolve({ query: query, source: 'ytmsearch', requester: previous.info.requester });
        }

        if (resolve && resolve.tracks.length > 0) {
          // 1. Filter out exact previous song (ID Check)
          const uniqueTracks = resolve.tracks.filter(t => t.info.identifier !== previous.info.identifier);

          // 2. Filter out History (Last 20 songs)
          const historyFiltered = uniqueTracks.filter(t => !player.playedTracks.includes(t.info.identifier));

          // 3. STRICT Title Check (Prevent "Another Love" -> "Another Love" if IDs differ)
          const prevTitle = previous.info.title.trim().toLowerCase();
          const titleFiltered = historyFiltered.filter(t => {
            const tTitle = t.info.title.toLowerCase();
            return tTitle !== prevTitle && !tTitle.includes(prevTitle) && !prevTitle.includes(tTitle); // Aggressive repeat block
          });

          // 4. Quality Filter (No Speed Up/Slowed)
          const badKeywords = ['slowed', 'reverb', 'speed up', 'nightcore', 'daycore', 'remix', 'mashup', 'lofi'];
          const qualityFiltered = titleFiltered.filter(t => {
            const title = t.info.title.toLowerCase();
            for (const kw of badKeywords) {
              if (title.includes(kw) && !prevTitle.includes(kw)) return false;
            }
            return true;
          });

          // Selection Pool
          const pool = qualityFiltered.length > 0 ? qualityFiltered : (titleFiltered.length > 0 ? titleFiltered : historyFiltered);
          const candidates = pool.slice(0, 10); // Check top 10

          let nextTrack = candidates.length > 0
            ? candidates[Math.floor(Math.random() * candidates.length)]
            : null;

          // Last resort: Pick ANYTHING random from the result that isn't the EXACT same ID
          if (!nextTrack && resolve.tracks.length > 0) {
            const desperateOption = resolve.tracks.filter(t => t.info.identifier !== previous.info.identifier);
            if (desperateOption.length > 0) nextTrack = desperateOption[Math.floor(Math.random() * desperateOption.length)];
          }

          if (nextTrack) {
            player.queue.add(nextTrack);
            player.play();
            consola.info(`[Autoplay] Track added and player.play() called for: ${nextTrack.info.title}`);
            return;
          }
        } else {
          consola.warn(`[Autoplay] No tracks found for query: ${query}`);
        }
      }
    }
  } catch (e) {
    consola.error(`Autoplay error: ${e}`);
  }

  consola.info(`[Riffy] Queue ended for guild ${player.guildId}`);

  if (channel) {
    const embed = new EmbedBuilder()
      .setColor('#2b2d31')
      .setDescription(`
            **24/7 Mode:** ${player.is247 ? Emoji.success || '✅' : Emoji.error || '❌'}
            The queue has finished playing.
            Thanks for listening!
            [Need help? Join the support server](${process.env.SUPPORT_SERVER || 'https://discord.gg/4pHM99WGXp'})
        `);
    channel.send({ embeds: [embed] });
  }

  if (player.is247) return;

  player.destroy();
});

function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000) % 60;
  const minutes = Math.floor(ms / 60000) % 60;
  const hours = Math.floor(ms / 3600000);
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}


// Top.gg init moved to ClientReady to ensure client.user and guilds are available
if (process.env.TOPGG_WEBHOOK_AUTH) {
  // ... webhook logic can stay here as it's an express server
  const app = express();
  const webhook = new Topgg.Webhook(process.env.TOPGG_WEBHOOK_AUTH);
  // ... existing webhook code ...
  app.post('/dblwebhook', webhook.listener(vote => {
    // ...
    // ...
  }));
  app.listen(process.env.PORT || 3000, () => {
    consola.success('[Top.gg] Webhook server listening on port ' + (process.env.PORT || 3000));
  });
}

client.once(Events.ClientReady, async (client) => {
  // ASCII Banner
  console.log(`
  ███████╗████████╗███████╗██████╗ ███╗   ██╗ █████╗ ██╗     
  ██╔════╝╚══██╔══╝██╔════╝██╔══██╗████╗  ██║██╔══██╗██║     
  █████╗     ██║   █████╗  ██████╔╝██╔██╗ ██║███████║██║     
  ██╔══╝     ██║   ██╔══╝  ██╔══██╗██║╚██╗██║██╔══██║██║     
  ███████╗   ██║   ███████╗██║  ██║██║ ╚████║██║  ██║███████╗
  ╚══════╝   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝╚══════╝
                                         Origin Codebase v1.0
  `);

  consola.success(`Logged in as ${client.user.tag}`);
  await connectDB();

  // Auto-Deploy Commands (Ensure updates propagate)
  if (client.user.id) {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    try {
      // consola.start(`[Auto-Deploy] Refreshing ${commands.length} application (/) commands...`);
      await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commands },
      );
      consola.success(`[System] Reloaded ${commands.length} commands.`);
    } catch (error) {
      consola.error(`[Auto-Deploy Error]`, error);
    }
  }

  // Initialize Riffy
  riffy.init(client.user.id);
  consola.info(`[System] Riffy Initiated`);

  // Status Rotation
  const statusType = ActivityType.Listening; // Defaulting to Listening for music bots

  let statusIndex = 0;

  const updateStatus = () => {
    // Dynamic Status Logic from .env
    const rawStatusList = process.env.STATUS_LIST || '["🎵 /play | !play"]';
    let statuses = [];
    try {
      // Try parsing as JSON array first (supports [ "status1", "status2" ])
      const parsed = JSON.parse(rawStatusList);
      if (Array.isArray(parsed)) {
        statuses = parsed;
      } else {
        // Fallback if JSON is valid but not an array
        statuses = [rawStatusList];
      }
    } catch (e) {
      // Fallback to semicolon separation (legacy support)
      statuses = rawStatusList.split(';').map(s => s.trim());
    }

    const statusTemplate = statuses[statusIndex] || '🎵 /play | !play';

    // Replace placeholders with safe Numbers
    const serverCount = client.guilds.cache.size || 0;
    const userCount = client.guilds.cache.reduce((acc, guild) => acc + (guild.memberCount || 0), 0) || 0;

    const currentStatus = statusTemplate
      .replace(/{servers}/g, serverCount)
      .replace(/{users}/g, userCount);

    // Get status from env (online, idle, dnd, invisible)
    const presenceStatus = process.env.BOT_PRESENCE_STATUS || 'online';

    client.user.setPresence({
      activities: [{ name: currentStatus, type: statusType }],
      status: presenceStatus,
    });
    statusIndex = (statusIndex + 1) % statuses.length;
  };

  // Initial set
  updateStatus();

  // Rotate every 30 seconds
  setInterval(() => {
    updateStatus();

    // Post stats to Top.gg manually if token exists
    // Post stats to Top.gg manually if token exists and stats are valid
    if (process.env.TOPGG_TOKEN && client.guilds.cache.size > 0) {
      const serverCount = Number(client.guilds.cache.size);
      const shardCount = client.shard ? Number(client.shard.count) : 1;

      new Topgg.Api(process.env.TOPGG_TOKEN).postStats({
        serverCount: serverCount,
        shardCount: shardCount
      }).then(() => {
        // consola.success(`[Top.gg] Posted stats: ${serverCount} servers`);
      }).catch(err => {
        consola.warn(`[Top.gg] Failed to post stats: ${err.message}`);
      });
    }
  }, 30000);
});

// Load slash commands
// Load slash commands
const commandsPath = path.join(__dirname, 'commands');
const commands = [];

function loadCommands(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      loadCommands(filePath);
    } else if (file.endsWith('.js')) {
      const command = require(filePath);
      if (command.data && command.data.name) {
        // Add Category property if not present based on folder name
        const category = path.basename(path.dirname(filePath));
        if (category !== 'commands') command.category = category;

        if (category === 'Owner') {
          client.ownerCommands.set(command.data.name, command);
          consola.success(`[Commands] Loaded OWNER command: ${command.data.name}`);
        } else {
          client.slashCommands.set(command.data.name, command);
          client.prefixCommands.set(command.data.name, command); // Support for prefix access
          commands.push(command.data.toJSON());
          consola.success(`[Commands] Loaded Slash & Prefix command: ${command.data.name} (${category})`);
        }
      } else if (command.name) {
        // Support for "Legacy/User" style export used in about.js/help.js fixes
        // We will refactor those files, but this helps catch them if they have a different structure
        // For now, we prefer the 'data' builder, so we will skip or adapt
        // But wait, the user's "bad" code exports { name: ... }, we need to fix the files first.
        // This loader expects standard SlashCommandBuilder.
        console.warn(`[Commands] Skipping non-standard command structure in ${file}. Will need refactoring.`);
      }
    }
  }
}

if (fs.existsSync(commandsPath)) {
  loadCommands(commandsPath);
}

// Deploy Commands if arg present
if (process.argv.includes('--deploy')) {
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  (async () => {
    try {
      consola.start(`Started refreshing ${commands.length} application (/) commands.`);
      await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commands },
      );
      consola.success(`Successfully reloaded ${commands.length} application (/) commands.`);
      process.exit(0);
    } catch (error) {
      consola.error(error);
      process.exit(1);
    }
  })();
}

// Duplicate raw listener removed

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;

  // Duplicate bot check removed

  // Dynamic Prefix Logic
  let guildData = await Guild.findById(message.guildId);
  if (!guildData) {
    guildData = new Guild({ _id: message.guildId });
    await guildData.save();
  }
  // ... inside messageCreate
  const prefix = guildData.prefix || process.env.PREFIX || '!';

  // Allow Mention as Prefix (Show Dashboard)
  const mentionRegex = new RegExp(`^<@!?${client.user.id}>( |)$`);
  if (message.content.match(mentionRegex)) {
    const embed = new EmbedBuilder()
      .setColor('#2b2d31')
      .setAuthor({ name: `Hey ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
      .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
      .setDescription(`- **Prefix For This Server: \`${prefix}\`**\n\n- *Type \`/help\` for more information.*`)
      .setImage(process.env.BOT_IMAGE_BG || 'https://cdn.discordapp.com/attachments/1064883584852336690/1083049581895520266/f9e9d6d4e8c15a6b.jpg')
      .setFooter({ text: `Love From ${client.user.username}'s Team`, iconURL: client.user.displayAvatarURL() });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('bot_system').setLabel('System').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('bot_devs').setLabel('About Devs').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('bot_links').setLabel('Links').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('bot_delete').setEmoji(Emoji.home || '🏠').setStyle(ButtonStyle.Secondary)
    );

    return message.reply({ embeds: [embed], components: [row] });
  }

  const isMentionPrompt = message.content.startsWith(`<@${client.user.id}>`) || message.content.startsWith(`<@!${client.user.id}>`);
  let usedPrefix = null;

  if (message.content.startsWith(prefix)) usedPrefix = prefix;
  else if (isMentionPrompt) usedPrefix = isMentionPrompt ? message.content.match(/^<@!?\d+>/)[0] + ' ' : null;

  if (!usedPrefix) {
    return;
  }

  const args = message.content.slice(usedPrefix.length).trim().split(/ +/);
  const rawCommandName = args.shift().toLowerCase();

  if (!rawCommandName) return;

  // Blacklist Check
  if (client.blacklist && client.blacklist.has(message.author.id)) {
    return message.reply("⛔ You are blacklisted from using this bot.");
  }

  consola.info(`[Prefix Debug] Received: ${rawCommandName} from ${message.author.tag}`);

  const aliases = {
    'p': 'play',
    's': 'skip',
    'stop': 'stop',
    'resume': 'pause',
    'ap': 'autoplay',
    'vol': 'volume',
    'q': 'queue',
    'np': 'nowplaying',
    'j': 'join',
    'dc': 'leave',
    'leave': 'leave',
    'h': 'help',
    'mc': 'musiccard',
    'setprefix': 'setprefix',
    'prefix': 'setprefix'
  };

  const commandName = aliases[rawCommandName] || rawCommandName;

  const command = client.slashCommands.get(commandName) || client.ownerCommands.get(commandName);
  if (!command) {
    return;
  }

  // Owner Check
  if (client.ownerCommands.has(commandName)) {
    if (message.author.id !== process.env.OWNER_ID) {
      // Hidden command, so maybe don't reply? Or reply generic error? 
      // User said "hidden", so return.
      return;
    }
  }

  // Maintenance Check
  if (client.maintenance && client.maintenance.has(commandName)) {
    const maintenanceData = client.maintenance.get(commandName);
    if (maintenanceData.expiry > Date.now()) {
      // User 1206125304116940810 is owner, maybe exclude them? usually owners bypass.
      if (message.author.id !== process.env.OWNER_ID) {
        return message.reply(`⚠️ Command **${commandName}** is under maintenance. Please wait until <t:${Math.floor(maintenanceData.expiry / 1000)}:R>.`);
      }
    } else {
      // Expired
      client.maintenance.delete(commandName);
    }
  }

  // Mock Interaction
  const interaction = {
    user: message.author,
    guild: message.guild,
    channel: message.channel,
    member: message.member,
    client: client,
    createdTimestamp: message.createdTimestamp,
    options: {
      getString: (name) => {
        if (args.length === 0) return null;
        // Special case for play command usually needing all args
        if (name === 'query') return args.join(' ');
        // Default relative to args[0], but for setprefix it's fine
        return args.join(' ');
      },
      getInteger: (name) => {
        if (args.length === 0) return null;
        return parseInt(args[0]);
      },
      getNumber: (name) => {
        if (args.length === 0) return null;
        return parseFloat(args[0]);
      },
      getUser: () => message.mentions.users.first(),
      getMember: () => message.mentions.members.first(),
    },
    deferReply: async () => Promise.resolve(), // No-op for defer
    reply: async (msg) => message.reply(typeof msg === 'string' ? { content: msg } : msg),
    editReply: async (msg) => message.channel.send(typeof msg === 'string' ? { content: msg } : msg),
    followUp: async (msg) => message.reply(typeof msg === 'string' ? { content: msg } : msg),
    isStringSelectMenu: () => false,
    isCommand: () => true,
    isPrefix: true, // Tag for identifying prefix commands
    message: message, // Pass original message for actions like delete
    replied: false,
    deferred: false
  };

  try {
    await command.execute(interaction, client);
  } catch (error) {
    consola.error(error);
    message.reply('There was an error executing that command!');
  }
});

client.on('interactionCreate', async (interaction) => {
  // Handle Autocomplete
  if (interaction.isAutocomplete()) {
    const command = client.slashCommands.get(interaction.commandName);
    if (!command) return;

    try {
      if (interaction.commandName === 'play') {
        const focusedValue = interaction.options.getFocused();
        if (!focusedValue) return;

        // Check if already responded (unlikely but safe)
        if (interaction.responded) return;

        await interaction.respond([
          { name: `Search for: ${focusedValue}`, value: focusedValue }
        ]).catch(() => { }); // Catch specific respond errors silently
      }
    } catch (error) {
      if (error.code !== 10062) { // Ignore 'Unknown Interaction' which is common in autocomplete
        consola.error('Autocomplete Error:', error);
      }
    }
    return;
  }

  // Handle Filter Selection
  if (interaction.isStringSelectMenu() && interaction.customId === 'music_filter') {
    const player = client.riffy.players.get(interaction.guildId);
    if (!player) return interaction.reply({ content: `${Emoji.error} No player found!`, flags: MessageFlags.Ephemeral });

    const value = interaction.values[0];

    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      // Reset before applying new filter
      await player.filters.clearFilters();

      switch (value) {
        case 'clear':
          player.filters.setTimescale(false);
          player.filters.setLowPass(false);
          player.filters.setDistortion(false);
          player.filters.setVaporwave(false);
          player.filters.setRotation(false);
          player.filters.setBassboost(false);
          player.filters.setNightcore(false);
          player.filters.setKaraoke(false);
          player.filters.clearFilters();
          player.setVolume(100);
          break;
        case 'pitch':
          player.filters.setTimescale(true, { pitch: 1.2 });
          break;
        case 'lofi':
          player.filters.setLowPass(true, { smoothing: 20 });
          break;
        case 'distort':
          player.filters.setDistortion(true, {
            sinOffset: 0, sinScale: 1, cosOffset: 0, cosScale: 1, tanOffset: 0, tanScale: 1, offset: 0, scale: 1
          });
          break;
        case 'speed':
          player.filters.setTimescale(true, { speed: 1.25 });
          break;
        case 'vaporwave':
          player.filters.setVaporwave(true, { pitch: 0.5 });
          break;
      }
      await interaction.editReply(`${Emoji.success} Filter set to **${value}**`);
    } catch (e) {
      if (e.code !== 10062) console.error("Filter Interaction Error:", e);
    }
    return;
  }

  // Handle Music Buttons
  if (interaction.isButton()) {
    if (interaction.customId.startsWith('music_')) {
      const player = client.riffy.players.get(interaction.guildId);
      if (!player) return interaction.reply({ content: `${Emoji.error} No player found!`, flags: MessageFlags.Ephemeral });

      const member = interaction.guild.members.cache.get(interaction.user.id);
      if (!member.voice.channel || member.voice.channel.id !== player.voiceChannel) {
        return interaction.reply({ content: `${Emoji.error} You must be in my voice channel!`, flags: MessageFlags.Ephemeral });
      }

      switch (interaction.customId) {
        case 'music_pause':
          player.pause(!player.paused);
          await safeReply(interaction, `${player.paused ? Emoji.pause : Emoji.resume} ${player.paused ? 'Paused' : 'Resumed'}!`);
          break;
        case 'music_skip':
          player.stop();
          await safeReply(interaction, `${Emoji.skip} Skipped!`);
          break;
        case 'music_stop':
          player.destroy();
          await safeReply(interaction, `${Emoji.stop} Stopped!`);
          break;
        case 'music_loop':
          const loopMode = player.loop === 'track' ? 'none' : 'track';
          player.setLoop(loopMode);
          await safeReply(interaction, `${Emoji.loop} Loop set to **${loopMode}**!`);
          break;
        case 'music_shuffle':
          if (player.queue.length > 0) {
            for (let i = player.queue.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [player.queue[i], player.queue[j]] = [player.queue[j], player.queue[i]];
            }
            await safeReply(interaction, `${Emoji.shuffle} Shuffled queue!`);
          } else {
            await safeReply(interaction, `${Emoji.error} Queue is empty!`);
          }
          break;
      }
      return;
    }

    // Handle Bot Mention Buttons
    if (interaction.customId === 'bot_system') {
      const stats = require('./commands/Information/stats');
      // We can reuse the execute command or replicate logic. 
      // Replicating logic for safety and speed to match 'stats' output exactly
      const duration1 = Math.round((Date.now() - client.uptime) / 1000);
      const embed = new EmbedBuilder()
        .setColor('#2b2d31')
        .setAuthor({ name: `${client.user.username} System`, iconURL: client.user.displayAvatarURL() })
        .setDescription(`>>> . **Ping**: ${client.ws.ping}ms\n. **Uptime**: <t:${duration1}:R>\n. **Servers**: ${client.guilds.cache.size}\n. **Users**: ${client.users.cache.size}`)
        .setFooter({ text: 'System Info', iconURL: interaction.user.displayAvatarURL() });
      return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }

    if (interaction.customId === 'bot_devs') {
      const embed = new EmbedBuilder()
        .setColor('#2b2d31')
        .setTitle('Developers')
        .setDescription('**Gametime** - Main Developer\n*Made with ❤️ for the community*')
        .setThumbnail(client.user.displayAvatarURL());
      return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }

    if (interaction.customId === 'bot_links') {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel('Support Server').setStyle(ButtonStyle.Link).setURL(process.env.SUPPORT_SERVER || 'https://discord.gg/4pHM99WGXp'),
        new ButtonBuilder().setLabel('Invite Bot').setStyle(ButtonStyle.Link).setURL(`https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`)
      );
      return interaction.reply({ content: 'Here are my links:', components: [row], flags: MessageFlags.Ephemeral });
    }

    if (interaction.customId === 'bot_delete') {
      return interaction.message.delete().catch(() => { });
    }

    // Helper for safe replles
    async function safeReply(interaction, content) {
      try {
        if (!interaction.deferred && !interaction.replied) {
          await interaction.reply({ content, flags: MessageFlags.Ephemeral });
        } else {
          await interaction.followUp({ content, flags: MessageFlags.Ephemeral });
        }
      } catch (e) {
        if (e.code !== 10062 && e.code !== 40060) console.error("SafeReply Error:", e);
      }
    }

    if (interaction.customId === 'flow_button') {
      const player = client.riffy.players.get(interaction.guildId);
      if (!player || !player.nowPlayingMessageId) {
        return interaction.reply({ content: `${Emoji.error || '❌'} No music is currently playing!`, flags: MessageFlags.Ephemeral });
      }

      const messageLink = `https://discord.com/channels/${interaction.guildId}/${player.textChannel}/${player.nowPlayingMessageId}`;
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel('Go to Music Card').setStyle(ButtonStyle.Link).setURL(messageLink)
      );

      return interaction.reply({ content: 'Click below to jump to the music controller:', components: [row], flags: MessageFlags.Ephemeral });
    }

    if (interaction.customId === 'fav_add') {
      try {
        const player = client.riffy.players.get(interaction.guildId);
        let title, uri;

        if (player && player.current) {
          title = player.current.info.title;
          uri = player.current.info.uri;
        } else {
          // Fallback for embed-based messages
          const embed = interaction.message.embeds[0];
          if (embed && embed.description) {
            const match = embed.description.match(/\[(.*?)\]\((.*?)\)/);
            if (match) {
              [_, title, uri] = match;
            }
          }
        }

        if (!title || !uri) return interaction.reply({ content: `${Emoji.error} Could not find song info to favorite!`, flags: MessageFlags.Ephemeral });

        const User = require('./database/User');
        let user = await User.findById(interaction.user.id);
        if (!user) {
          user = new User({ _id: interaction.user.id });
        }

        if (user.favorites.some(fav => fav.uri === uri)) {
          return interaction.reply({ content: `${Emoji.error} This song is already in your favorites!`, flags: MessageFlags.Ephemeral });
        }

        user.favorites.push({ title, uri });
        await user.save();

        return interaction.reply({ content: `${Emoji.success} Added **${title}** to your favorites!`, flags: MessageFlags.Ephemeral });

      } catch (err) {
        consola.error('Fav Button Error:', err);
        return interaction.reply({ content: `${Emoji.error} Error saving favorite!`, flags: MessageFlags.Ephemeral });
      }
    }

    if (interaction.customId === 'flow_button') {
      const player = client.riffy.players.get(interaction.guildId);
      if (!player || !player.nowPlayingMessageId) {
        return interaction.reply({ content: `${Emoji.error || '❌'} No active music card found!`, flags: MessageFlags.Ephemeral });
      }

      // Construct Link
      const msgLink = `https://discord.com/channels/${interaction.guildId}/${player.textChannel}/${player.nowPlayingMessageId}`;

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('Go to Music Card')
          .setStyle(ButtonStyle.Link)
          .setURL(msgLink)
      );

      return interaction.reply({ content: `🎵 **Click below to jump to the music card:**`, components: [row], flags: MessageFlags.Ephemeral });
    }

    return;
  }

  if (!interaction.isChatInputCommand()) return;

  const command = client.slashCommands.get(interaction.commandName);
  if (!command) {
    await interaction.reply({
      content: `${Emoji.error} Command not found!`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  try {
    await command.execute(interaction, client);
  } catch (error) {
    // Check if interaction was already handled or timed out
    if (error.code === 10062 || error.code === 40060) return;

    console.error('Error executing command:', error);

    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: '❌ There was an error executing this command!',
          flags: MessageFlags.Ephemeral,
        });
      } else {
        await interaction.reply({
          content: '❌ There was an error executing this command!',
          flags: MessageFlags.Ephemeral,
        });
      }
    } catch (e) { /* Ignore follow-up errors */ }
  }
});

// Duplicate messageCreate listener removed

client.on('voiceStateUpdate', (oldState, newState) => {
  if (!client.riffy) return;

  // Bot left the voice channel
  if (oldState.id === client.user.id && !newState.channelId) {
    const player = client.riffy.players.get(oldState.guild.id);
    if (player) {
      player.destroy();
    }
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Unhandled Rejection]', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('[Uncaught Exception]', error);
});

// Handle Bot Mention


// Login to Discord
client.login(process.env.DISCORD_TOKEN);

module.exports = client;
