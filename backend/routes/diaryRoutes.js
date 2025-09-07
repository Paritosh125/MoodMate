import express from "express";
import DiaryEntry from "../models/DiaryEntry.js";
import { protect } from "../middleware/authMiddleware.js";
import Sentiment from "sentiment";

const router = express.Router();
const sentiment = new Sentiment();

/** Utility: convert Date -> YYYY-MM-DD */
const getDateKey = (date) => {
    const d = new Date(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
};

const moodFromSentiment = (text) => {
    const score = sentiment.analyze(text).score;
    if (score > 2) return "Happy";
    if (score > 0) return "Excited";
    if (score === 0) return "Neutral";
    if (score < -2) return "Sad";
    return "Stressed";
};

const moodToEmoji = (mood) => {
    const map = {
        Happy: "😀",
        Sad: "😢",
        Stressed: "😰",
        Angry: "😡",
        Neutral: "😐",
        Excited: "🤩",
        Tired: "😴",
    };
    return map[mood] || "🙂";
};

/** 
 * POST /api/diary 
 * Add new entry (1 per day per user) 
 */
router.post("/", protect, async (req, res) => {
    try {
        let { mood, text, date } = req.body;
        const entryDate = date ? new Date(date) : new Date();

        // Check duplicate entry for the same day
        const existing = await DiaryEntry.findOne({
            user: req.user._id,
            date: {
                $gte: new Date(entryDate.setHours(0, 0, 0, 0)),
                $lt: new Date(entryDate.setHours(23, 59, 59, 999)),
            },
        });

        if (existing) {
            return res
                .status(400)
                .json({ message: "You already have an entry for today. Please edit it." });
        }

        if (!mood && text) mood = moodFromSentiment(text);
        if (!mood) mood = "Neutral";

        const emoji = moodToEmoji(mood);

        const newEntry = new DiaryEntry({
            user: req.user._id,
            mood,
            emoji,
            text,
            date: new Date(), // always today
        });

        await newEntry.save();
        res.status(201).json(newEntry);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to add entry" });
    }
});

/** 
 * PUT /api/diary/today 
 * Update today’s entry 
 */
router.put("/today", protect, async (req, res) => {
    try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        let entry = await DiaryEntry.findOne({
            user: req.user._id,
            date: { $gte: todayStart, $lte: todayEnd },
        });

        if (!entry) return res.status(404).json({ message: "No entry for today" });

        const updatedText = req.body.text || entry.text;
        let updatedMood = req.body.mood;

        if (!updatedMood && req.body.text) {
            updatedMood = moodFromSentiment(updatedText);
        }

        entry.text = updatedText;
        entry.mood = updatedMood || entry.mood;
        entry.emoji = moodToEmoji(entry.mood);

        const updated = await entry.save();
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: "Failed to update today’s entry" });
    }
});

/** 
 * GET /api/diary/today 
 */
router.get("/today", protect, async (req, res) => {
    try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const entry = await DiaryEntry.findOne({
            user: req.user._id,
            date: { $gte: todayStart, $lte: todayEnd },
        });

        if (!entry) return res.json(null);
        res.json(entry);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch today’s entry" });
    }
});

/** 
 * GET /api/diary 
 * Fetch all entries 
 */
router.get("/", protect, async (req, res) => {
    try {
        const entries = await DiaryEntry.find({ user: req.user._id }).sort({ date: -1 });
        res.json(entries);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch entries" });
    }
});

/** 
 * GET /api/diary/stats/moods 
 * Mood counts in last N days (default 30) 
 */
router.get("/stats/moods", protect, async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const sinceDate = new Date();
        sinceDate.setDate(sinceDate.getDate() - days);

        const entries = await DiaryEntry.find({
            user: req.user.id, // ensure filtering by user
            createdAt: { $gte: sinceDate }
        });

        // Count moods
        const counts = {};
        entries.forEach(entry => {
            if (entry.mood) {
                counts[entry.mood] = (counts[entry.mood] || 0) + 1;
            }
        });

        res.json({ days, counts });
    } catch (err) {
        console.error("Error in /stats/moods:", err);
        res.status(500).json({ error: "Server error" });
    }
});


// ---- 2. Streak Stats ----
router.get("/stats/streak", protect, async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const sinceDate = new Date();
        sinceDate.setDate(sinceDate.getDate() - days);

        const entries = await DiaryEntry.find({
            user: req.user.id,
            createdAt: { $gte: sinceDate }
        }).sort({ createdAt: 1 });

        let longestStreak = 0;
        let currentStreak = 0;
        let prevDate = null;

        entries.forEach(entry => {
            const entryDate = new Date(entry.createdAt).toDateString();
            if (prevDate) {
                const diff = (new Date(entryDate) - new Date(prevDate)) / (1000 * 60 * 60 * 24);
                if (diff === 1) {
                    currentStreak++;
                } else if (diff > 1) {
                    currentStreak = 1;
                }
            } else {
                currentStreak = 1;
            }
            prevDate = entryDate;
            if (currentStreak > longestStreak) longestStreak = currentStreak;
        });

        res.json({ days, currentStreak, longestStreak });
    } catch (err) {
        console.error("Error in /stats/streak:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// ---- 3. Mood Trends (daily moods) ----
router.get("/stats/trends", protect, async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;
        const sinceDate = new Date();
        sinceDate.setDate(sinceDate.getDate() - days);

        const entries = await DiaryEntry.find({
            user: req.user.id,
            createdAt: { $gte: sinceDate }
        }).sort({ createdAt: 1 });

        // Map each entry to { date, mood }
        const trendData = entries.map(e => ({
            date: e.createdAt,
            mood: e.mood
        }));

        res.json(trendData);
    } catch (err) {
        console.error("Error in /stats/trends:", err);
        res.status(500).json({ error: "Server error" });
    }
});

export default router;
