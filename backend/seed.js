import mongoose from "mongoose";
import dotenv from "dotenv";
import DiaryEntry from "./models/DiaryEntry.js";
import User from "./models/User.js";

dotenv.config();

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Mongo connected");

        const user = await User.findOne();
        if (!user) {
            console.log("No user found, please register via frontend first.");
            return;
        }

        const sampleEntries = [
            { mood: "Happy", text: "Had a great walk in the park!", date: new Date("2025-09-01") },
            { mood: "Sad", text: "Felt a bit down today.", date: new Date("2025-09-02") },
            { mood: "Excited", text: "Started working on a new project!", date: new Date("2025-09-03") },
            { mood: "Tired", text: "Workload drained me.", date: new Date("2025-09-04") },
            { mood: "Sad", text: "A pretty average day.", date: new Date("2025-09-05") },
            { mood: "Neutral", text: "Today i started my project.", date: new Date("2025-09-06") }
        ];

        for (let e of sampleEntries) {
            const exists = await DiaryEntry.findOne({ user: user._id, date: e.date });
            if (!exists) {
                await DiaryEntry.create({ ...e, user: user._id });
            }
        }

        console.log("Sample entries seeded ✅");
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seed();
