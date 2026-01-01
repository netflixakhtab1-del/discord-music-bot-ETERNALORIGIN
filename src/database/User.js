// Created by Gametime
// Discord Link: https://discord.gg/4pHM99WGXp
// Made with love, bot name is Eternal Star Emoji Manager
// ADVICE: DO NOT REMOVE THIS CREDIT!

const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    _id: { type: String, required: true }, // Discord User ID
    favorites: [{
        title: String,
        uri: String,
        author: String,
        duration: Number,
        addedAt: { type: Date, default: Date.now }
    }]
});

module.exports = mongoose.model('User', UserSchema);
