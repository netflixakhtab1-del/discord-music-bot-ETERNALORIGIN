const mongoose = require('mongoose');

const AutoplaySchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    enabled: { type: Boolean, default: false },
    textChannelId: { type: String, default: null },
    voiceChannelId: { type: String, default: null }
});

module.exports = mongoose.model('Autoplay', AutoplaySchema);
