// src/components/DiaryEntryForm.jsx
import React, { useEffect, useState } from "react";
import api from "../utils/api";
import { analyzeMood } from "../utils/moodAnalyzer";

export default function DiaryEntryForm({ existing, onSaved }) {
    const [text, setText] = useState("");
    const [mood, setMood] = useState("");
    const [manualOverride, setManualOverride] = useState(false); // true if user chose mood from dropdown
    const [hasSavedToday, setHasSavedToday] = useState(false);
    const [loading, setLoading] = useState(false);

    // Prefill from prop 'existing' if parent passes an entry (edit from RecentEntries)
    useEffect(() => {
        if (existing) {
            const initialText = existing.text || "";
            const initialMood = existing.mood || analyzeMood(initialText);
            setText(initialText);
            setMood(initialMood);
            // let auto-suggestion run while editing, so manualOverride=false
            setManualOverride(false);
            setHasSavedToday(true);
        } else {
            // attempt to fetch today's saved entry directly (clean)
            (async () => {
                try {
                    const res = await api.get("/diary/today");
                    if (res && res.data) {
                        const saved = res.data;
                        setText(saved.text || "");
                        setMood(saved.mood || analyzeMood(saved.text || ""));
                        setManualOverride(false);
                        setHasSavedToday(true);
                    } else {
                        setText("");
                        setMood("");
                        setManualOverride(false);
                        setHasSavedToday(false);
                    }
                } catch (err) {
                    // fallback: no today endpoint or error -> treat as empty form
                    setText("");
                    setMood("");
                    setManualOverride(false);
                    setHasSavedToday(false);
                }
            })();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [existing]);

    // live auto-suggest when text changes unless user manually overrode mood
    useEffect(() => {
        if (!manualOverride) {
            if (text.trim().length > 2) {
                const suggested = analyzeMood(text);
                // update only if changed
                if (suggested !== mood) setMood(suggested);
            } else {
                // small text reset
                if (mood) setMood("");
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [text]);

    const handleTextChange = (e) => {
        setText(e.target.value);
    };

    const handleMoodChange = (e) => {
        const v = e.target.value;
        setMood(v);
        // if empty -> go back to auto suggestions
        setManualOverride(Boolean(v));
    };

    const handleRevert = async () => {
        // reload saved version from server so we revert to DB copy
        try {
            const res = await api.get("/diary/today");
            if (res && res.data) {
                setText(res.data.text || "");
                setMood(res.data.mood || analyzeMood(res.data.text || ""));
                setManualOverride(false);
                setHasSavedToday(true);
            }
        } catch (err) {
            console.error("Failed to revert to saved:", err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!text.trim()) return;
        setLoading(true);

        const finalMood = mood || analyzeMood(text);

        try {
            let res;
            if (hasSavedToday) {
                res = await api.put("/diary/today", { text, mood: finalMood });
            } else {
                res = await api.post("/diary", { text, mood: finalMood });
            }

            // if backend returns updated/created entry, re-sync to it
            if (res && res.data) {
                const saved = res.data;
                setText(saved.text || "");
                setMood(saved.mood || analyzeMood(saved.text || ""));
                setManualOverride(false);
                setHasSavedToday(true);
            }

            if (typeof onSaved === "function") onSaved();
        } catch (err) {
            console.error("Save/update failed:", err);
            // optional: show user-visible error/toast
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-[var(--color-accent)]">
                    {hasSavedToday ? "✏️ Edit Today's Entry" : "📝 Today's Journal"}
                </h2>
                <span className="text-xs px-2 py-1 rounded-full bg-[var(--color-background)] text-[var(--color-accent)]">
                    {new Date().toLocaleDateString()}
                </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <textarea
                    value={text}
                    onChange={handleTextChange}
                    placeholder="Write about your day..."
                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-[var(--color-secondary)]"
                    rows={5}
                    required
                />

                <div className="flex items-center gap-3">
                    <select
                        value={mood}
                        onChange={handleMoodChange}
                        className="p-2 border rounded-xl"
                    >
                        <option value="">Auto-suggest mood</option>
                        <option value="Happy">😊 Happy</option>
                        <option value="Sad">😢 Sad</option>
                        <option value="Angry">😠 Angry</option>
                        <option value="Excited">🤩 Excited</option>
                        <option value="Neutral">😐 Neutral</option>
                        <option value="Stressed">😰 Stressed</option>
                        <option value="Tired">🥱 Tired</option>
                    </select>

                    {!manualOverride && mood && (
                        <span className="text-sm text-gray-500">
                            Suggested: <strong>{mood}</strong>
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-[var(--color-secondary)] hover:bg-[var(--color-primary)] text-white px-4 py-2 rounded-xl font-medium"
                    >
                        {loading ? (hasSavedToday ? "Updating..." : "Saving...") : hasSavedToday ? "Update Entry" : "Save Entry"}
                    </button>

                    {hasSavedToday && (
                        <button
                            type="button"
                            onClick={handleRevert}
                            className="px-3 py-2 rounded-xl border text-[var(--color-accent)]"
                        >
                            Revert
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}
