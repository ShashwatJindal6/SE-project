const express = require("express");
const router = express.Router();
const Application = require("../models/Application");

router.post("/add-application", async (req, res) => {
    try {
        const newApplication = new Application(req.body);
        await newApplication.save();
        res.status(201).json(newApplication);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/get-applications", async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) {
            return res.status(400).json({ error: "Email query parameter is required" });
        }
        const applications = await Application.find({ userEmail: email });
        res.status(200).json(applications);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put("/update-application/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await Application.findByIdAndUpdate(id, req.body, { new: true });
        if (!updated) return res.status(404).json({ error: "Application not found" });
        res.status(200).json(updated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete("/delete-application/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Application.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ error: "Application not found" });
        res.status(200).json({ message: "Application deleted" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
