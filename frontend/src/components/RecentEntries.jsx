// src/components/RecentEntries.jsx
import React, { useState } from "react";

const moodEmoji = {
    Happy: "😊",
    Sad: "😢",
    Neutral: "😐",
    Excited: "🤩",
    Tired: "🥱",
    Stressed: "😰",
    Angry: "😠",
};

export default function RecentEntries({ entries = [], onEditToday }) {
    const [selected, setSelected] = useState(null);

    const sorted = [...(entries || [])].sort((a, b) => new Date(b.date) - new Date(a.date));

    const recent = sorted.slice(0, 7);

    const isToday = (d) => {
        const date = new Date(d);
        const now = new Date();
        return date.getFullYear() === now.getFullYear() &&
            date.getMonth() === now.getMonth() &&
            date.getDate() === now.getDate();
    };

    return (
        <div className="bg-white rounded-2xl shadow p-4">
            <h3 className="text-lg font-semibold mb-3 text-[var(--color-accent)]">Recent Week</h3>

            {recent.length === 0 ? (
                <p className="text-sm text-gray-500">No entries yet</p>
            ) : (
                <ul className="space-y-2">
                    {recent.map((e) => (
                        <li
                            key={e._id}
                            onClick={() => setSelected(e)}
                            className="cursor-pointer hover:bg-slate-50 rounded p-2 flex justify-between items-center"
                        >
                            <div>
                                <div className="text-sm text-gray-600">{new Date(e.date).toLocaleDateString()}</div>
                                <div className="font-medium text-[var(--color-accent)]">{e.mood}</div>
                            </div>
                            <div className="text-2xl">{moodEmoji[e.mood] || "📝"}</div>
                        </li>
                    ))}
                </ul>
            )}

            {/* Modal */}
            {selected && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-2xl max-w-lg w-full shadow-lg">
                        <h3 className="text-xl font-semibold mb-2">{new Date(selected.date).toLocaleDateString()}</h3>
                        <p className="mb-2 text-gray-600">Mood: <strong>{selected.emoji || ""} {selected.mood}</strong></p>
                        <div className="text-gray-800 whitespace-pre-wrap">{selected.text}</div>

                        <div className="mt-4 flex gap-3 justify-end">
                            {isToday(selected.date) && (
                                <button
                                    onClick={() => {
                                        setSelected(null);
                                        if (onEditToday) onEditToday(selected);
                                    }}
                                    className="px-4 py-2 bg-[var(--color-secondary)] text-white rounded-lg"
                                >
                                    Edit Today’s Entry
                                </button>
                            )}

                            <button onClick={() => setSelected(null)} className="px-4 py-2 bg-gray-200 rounded-lg">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
