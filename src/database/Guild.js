// Created by Gametime
// Discord Link: https://discord.gg/4pHM99WGXp
// Made with love, bot name is Eternal Star Emoji Manager
// ADVICE: DO NOT REMOVE THIS CREDIT!

const mongoose = require('mongoose');

const GuildSchema = new mongoose.Schema({
    _id: { type: String, required: true }, // Guild ID
    prefix: { type: String, default: '!' },
    is247: { type: Boolean, default: false },
    autoplay: { type: Boolean, default: false },
    musicCardTheme: { type: String, default: 'spotify' } // 'classic', 'spotify', 'neon', 'landscape'
});

module.exports = mongoose.model('Guild', GuildSchema);
