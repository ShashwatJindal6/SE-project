const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema({
    userEmail: {
        type: String,
        required: true
    },
    company: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true
    },
    round: {
        type: String,
        default: "Technical"
    },
    date: {
        type: String,
        required: true
    },
    difficulty: {
        type: String,
        default: "Medium"
    },
    status: {
        type: String,
        default: "Waiting"
    },
    skills: {
        type: [String],
        default: []
    },
    notes: {
        type: String,
        default: ""
    },
    questions: {
        type: String,
        default: ""
    },
    tips: {
        type: String,
        default: ""
    },
    mistakes: {
        type: String,
        default: ""
    },
    starred: {
        type: Boolean,
        default: false
    },
    confidence: {
        type: Number,
        default: 3
    },
    views: {
        type: Number,
        default: 0
    },
    helpful: {
        type: Number,
        default: 0
    },
    voiceNote: {
        duration: String,
        transcription: String
    },
    attachments: [
        {
            name: String,
            url: String
        }
    ]
}, { timestamps: true });

module.exports = mongoose.model("Note", noteSchema);
