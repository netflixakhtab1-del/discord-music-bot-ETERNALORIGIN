// Created by Gametime
// Discord Link: https://discord.gg/4pHM99WGXp
// Made with love, bot name is Eternal Star Emoji Manager
// ADVICE: DO NOT REMOVE THIS CREDIT!

const mongoose = require('mongoose');
const consola = require('consola');

async function connectDB() {
    try {
        // Check if MONGO_URI is defined, if not, warn or use a default (or fail)
        if (!process.env.MONGO_URI) {
            consola.warn('[Database] MONGO_URI is not defined in .env! Database features will not work.');
            return;
        }

        await mongoose.connect(process.env.MONGO_URI);
        consola.success('[Database] Connected to MongoDB!');
    } catch (error) {
        consola.error('[Database] Connection Error:', error);
    }
}

module.exports = connectDB;
