const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema({
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
    status: {
        type: String,
        required: true,
        default: "Applied"
    },
    date: {
        type: String,
        required: true
    },
    location: {
        type: String,
        default: "Remote"
    },
    salary: {
        type: String,
        default: ""
    },
    description: {
        type: String,
        default: ""
    },
    recruiterEmail: {
        type: String,
        default: ""
    },
    recruiterPhone: {
        type: String,
        default: ""
    },
    notes: {
        type: String,
        default: ""
    },
    url: {
        type: String,
        default: ""
    }
}, { timestamps: true });

module.exports = mongoose.model("Application", applicationSchema);
