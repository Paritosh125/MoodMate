// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import api from "../utils/api";

// Components
import DiaryEntryForm from "../components/DiaryEntryForm";
import RecentEntries from "../components/RecentEntries";

import Navbar from "../components/Navbar";

import Analytics from "../components/Analytics";

export default function Dashboard() {
    const [entries, setEntries] = useState([]);
    const [moodStats, setMoodStats] = useState({});
    const [streak, setStreak] = useState(0);
    const [trends, setTrends] = useState([]);
    const [heatmap, setHeatmap] = useState({});
    const [activeTab, setActiveTab] = useState("journal"); // journal | analytics
    const [editingEntry, setEditingEntry] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchEntries = async () => {
        setLoading(true);
        try {
            const [entriesRes, statsRes, streakRes, trendsRes, heatmapRes] =
                await Promise.all([
                    api.get("/diary"),
                    api.get("/diary/stats/moods"),
                    api.get("/diary/stats/streak"),
                    api.get("/diary/stats/trends")
                ]);

            const list = (entriesRes.data || []).sort(
                (a, b) => new Date(b.date) - new Date(a.date)
            );
            setEntries(list);

            setMoodStats(statsRes?.data?.counts || {});
            setStreak(streakRes?.data?.streak || 0);
            setTrends(trendsRes?.data || []);
            setHeatmap(heatmapRes?.data || {});
        } catch (err) {
            console.error("Failed to load dashboard data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEntries();
    }, []);

    const handleEditToday = (entry) => {
        setEditingEntry(entry || null);
        setActiveTab("journal");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleSaved = async () => {
        await fetchEntries();
        setEditingEntry(null); // exit edit mode after save
    };

    return (
        <div className="min-h-screen bg-[var(--color-background)] p-6">
            <div className="max-w-6xl mx-auto">
                <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

                {activeTab === "journal" && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* key forces remount when editingEntry changes so the form prefill is reliable */}
                        <DiaryEntryForm
                            key={editingEntry ? editingEntry._id : "new"}
                            existing={editingEntry}
                            onSaved={handleSaved}
                        />
                        <RecentEntries entries={entries} onEditToday={handleEditToday} />
                    </div>
                )}

                {activeTab === "analytics" && <Analytics />}

            </div>
        </div>
    );
}
