import Diary from "../models/DiaryEntry.js";
import Sentiment from "sentiment";

const sentiment = new Sentiment();

// Map sentiment score → mood
function sentimentToMood(score) {
    if (score > 2) return "happy";
    if (score >= 0) return "neutral";
    return "sad";
}

// 📌 Add diary entry (one per day)
export const addDiaryEntry = async (req, res) => {
    try {
        const { text, mood, note } = req.body;
        const userId = req.user._id;

        // Get today’s date in YYYY-MM-DD format
        const today = new Date().toISOString().split("T")[0];

        // Check if entry exists for today
        const existing = await Diary.findOne({ user: userId, date: today });
        if (existing) {
            return res
                .status(400)
                .json({ message: "Entry for today already exists. Please edit it." });
        }

        // Auto-suggest mood if not provided
        let finalMood = mood;
        if (!finalMood) {
            const result = sentiment.analyze(text || "");
            finalMood = sentimentToMood(result.score);
        }

        const entry = await Diary.create({
            user: userId,
            text,
            mood: finalMood,
            note,
            date: today,
        });

        res.status(201).json(entry);
    } catch (err) {
        res.status(500).json({ message: "Error adding diary entry", error: err });
    }
};

// 📌 Get all diary entries for a user
export const getDiaryEntries = async (req, res) => {
    try {
        const entries = await Diary.find({ user: req.user._id }).sort({
            date: -1,
        });
        res.json(entries);
    } catch (err) {
        res.status(500).json({ message: "Error fetching entries", error: err });
    }
};

// 📌 Get today’s entry
export const getTodayEntry = async (req, res) => {
    try {
        const today = new Date().toISOString().split("T")[0];
        const entry = await Diary.findOne({ user: req.user._id, date: today });

        if (!entry) {
            return res.status(404).json({ message: "No entry for today" });
        }

        res.json(entry);
    } catch (err) {
        res.status(500).json({ message: "Error fetching today’s entry", error: err });
    }
};

// 📌 Update an entry (edit option)
export const updateDiaryEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const { text, mood, note } = req.body;

        const entry = await Diary.findOne({ _id: id, user: req.user._id });
        if (!entry) {
            return res.status(404).json({ message: "Entry not found" });
        }

        // Auto-suggest mood if not provided
        let finalMood = mood;
        if (!finalMood && text) {
            const result = sentiment.analyze(text);
            finalMood = sentimentToMood(result.score);
        }

        entry.text = text || entry.text;
        entry.mood = finalMood || entry.mood;
        entry.note = note || entry.note;

        const updated = await entry.save();
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: "Error updating entry", error: err });
    }
};
