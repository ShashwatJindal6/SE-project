const express = require("express");
const router = express.Router();
const User = require("../models/User");

// Register a new user
router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "User already exists with this email" });
        }

        const newUser = new User({ name, email, password });
        await newUser.save();
        
        res.status(201).json({ message: "Registration successful", user: { id: newUser._id, name: newUser.name, email: newUser.email } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Login user
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: "Invalid email or password" });
        }
        
        if (user.password !== password) {
            return res.status(400).json({ error: "Invalid email or password" });
        }
        
        res.status(200).json({ message: "Login successful", user: { id: user._id, name: user.name, email: user.email } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Google Login / Registration
router.post("/google-login", async (req, res) => {
    try {
        const { email, name, avatar } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: "Email is required" });
        }

        let user = await User.findOne({ email });
        let isNewSignUp = false;

        if (!user) {
            isNewSignUp = true;
            // Generate a random password since it is required in the schema
            const randomPassword = "google_" + Math.random().toString(36).substring(2, 15);
            user = new User({
                name: name || email.split("@")[0],
                email,
                password: randomPassword,
                avatar: avatar || ""
            });
            await user.save();
        }

        res.status(200).json({
            message: isNewSignUp ? "Registration successful" : "Login successful",
            isNewSignUp,
            user: { id: user._id, name: user.name, email: user.email }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


router.post("/add-user", async (req, res) => {
    try {
        const newUser = new User(req.body);
        await newUser.save();
        res.status(201).json("User Added");
    } catch (error) {
        res.status(500).json(error);
    }
});

router.get("/users", async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json(error);
    }
});

// Get user profile details
router.get("/profile", async (req, res) => {
    try {
        const { email } = req.query;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.status(200).json({
            name: user.name,
            email: user.email,
            role: user.role || "",
            location: user.location || "",
            education: user.education || "",
            avatar: user.avatar || "",
            skills: user.skills || [],
            resume: user.resume || null
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update user profile details
router.put("/profile", async (req, res) => {
    try {
        const { email, name, role, location, education, avatar, skills, resume } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (name !== undefined) user.name = name;
        if (role !== undefined) user.role = role;
        if (location !== undefined) user.location = location;
        if (education !== undefined) user.education = education;
        if (avatar !== undefined) user.avatar = avatar;
        if (skills !== undefined) user.skills = skills;
        if (resume !== undefined) user.resume = resume;

        await user.save();

        res.status(200).json({
            message: "Profile updated successfully",
            user: {
                name: user.name,
                email: user.email,
                role: user.role,
                location: user.location,
                education: user.education,
                avatar: user.avatar,
                skills: user.skills,
                resume: user.resume
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Change password
router.post("/change-password", async (req, res) => {
    try {
        const { email, currentPassword, newPassword } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        if (user.password !== currentPassword) {
            return res.status(400).json({ error: "Incorrect current password" });
        }
        user.password = newPassword;
        await user.save();
        res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete account and all associated data
router.delete("/delete-account", async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: "Email is required" });

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: "User not found" });

        // Delete all applications and notes belonging to this user
        const Application = require("../models/Application");
        const Note = require("../models/Note");
        await Application.deleteMany({ userEmail: email });
        await Note.deleteMany({ userEmail: email });
        await User.deleteOne({ email });

        res.status(200).json({ message: "Account deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;