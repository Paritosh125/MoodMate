import mongoose from "mongoose";

const diaryEntrySchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        text: {
            type: String,
            required: true,
        },
        mood: {
            type: String,
            enum: ["Happy", "Sad", "Neutral", "Angry", "Excited", "Stressed", "Tired"],
            default: "Neutral",
        },
        date: {
            type: String, // store as YYYY-MM-DD
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// 📌 Ensure one entry per user per day
diaryEntrySchema.index({ user: 1, date: 1 }, { unique: true });

const DiaryEntry = mongoose.model("DiaryEntry", diaryEntrySchema);

export default DiaryEntry;
