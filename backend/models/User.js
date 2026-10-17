const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: ""
    },
    location: {
        type: String,
        default: ""
    },
    education: {
        type: String,
        default: ""
    },
    avatar: {
        type: String,
        default: ""
    },
    skills: {
        type: [String],
        default: []
    },
    resume: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    }
});
module.exports = mongoose.model("User", userSchema);