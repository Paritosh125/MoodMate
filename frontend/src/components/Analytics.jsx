// src/components/Analytics.jsx
import React, { useEffect, useState } from "react";
import api from "../utils/api";
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Legend,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "./UI/Card";
import QuoteCard from "./QuoteCard";
import { saveAs } from "file-saver";  // for CSV export

export default function Analytics() {
    const [moodStats, setMoodStats] = useState({});
    const [trendData, setTrendData] = useState([]);
    const [streakData, setStreakData] = useState({ currentStreak: 0, longestStreak: 0 });
    const [loading, setLoading] = useState(true);

    const COLORS = ["#22c55e", "#3b82f6", "#eab308", "#f97316", "#ef4444", "#a855f7"];
    const moodColors = {
        Happy: "#22c55e",
        Sad: "#ef4444",
        Neutral: "#a1a1aa",
        Excited: "#3b82f6",
        Angry: "#f97316",
        Calm: "#a855f7",
    };
    const moodToScore = { Happy: 2, Excited: 1, Neutral: 0, Calm: 1, Angry: -1, Sad: -2 };

    useEffect(() => {
        async function fetchData() {
            try {
                const [moodsRes, trendsRes] = await Promise.all([
                    api.get("/diary/stats/moods?days=30"),
                    api.get("/diary/stats/trends?days=30"),
                ]);
                setMoodStats(moodsRes.data.counts || {});

                // Transform and sort trend data
                const transformed = (trendsRes.data || [])
                    .map((e) => {
                        const d = new Date(e.date);
                        return {
                            date: d.toISOString().split("T")[0], // YYYY-MM-DD
                            rawDate: d,
                            score: moodToScore[e.mood] ?? 0,
                            mood: e.mood,
                        };
                    })
                // .sort((a, b) => a.rawDate - b.rawDate);

                setTrendData(transformed);

                // --- Calculate streaks client-side ---
                const streaks = calcStreaks(transformed);
                setStreakData(streaks);
            } catch (err) {
                console.error("Analytics fetch failed:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    if (loading) return <p className="text-gray-500">Loading analytics...</p>;

    // --- Pie chart data ---
    const pieData = Object.keys(moodStats).map((mood) => ({
        name: mood,
        value: moodStats[mood],
    }));

    // --- CSV Export ---
    const handleExportCSV = () => {
        const headers = ["Date", "Mood", "Score"];
        const rows = trendData.map((d) => [d.date, d.mood, d.score]);
        const csvContent = [headers, ...rows].map((r) => r.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        saveAs(blob, "mood_analytics.csv");
    };

    return (
        <div className="space-y-6">
            {/* Summary / Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent>
                        <p className="text-gray-500">Current Streak</p>
                        <h2 className="text-2xl font-bold">{streakData.currentStreak}</h2>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent>
                        <p className="text-gray-500">Longest Streak</p>
                        <h2 className="text-2xl font-bold">{streakData.longestStreak}</h2>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent>
                        <p className="text-gray-500">Total Moods Recorded</p>
                        <h2 className="text-2xl font-bold">
                            {Object.values(moodStats).reduce((a, b) => a + b, 0)}
                        </h2>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent>
                        <p className="text-gray-500">Unique Moods</p>
                        <h2 className="text-2xl font-bold">{Object.keys(moodStats).length}</h2>
                    </CardContent>
                </Card>
            </div>

            {/* Export Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleExportCSV}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600"
                >
                    Export CSV
                </button>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Line Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Mood Trends (Last 30 Days)</CardTitle>
                    </CardHeader>
                    <CardContent className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis domain={[-2, 2]} ticks={[-2, -1, 0, 1, 2]} />
                                <Tooltip formatter={(value, name, props) => [`${props.payload.mood}`, "Mood"]} />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="score"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    dot={(props) => {
                                        const { cx, cy, payload } = props;
                                        return (
                                            <circle
                                                cx={cx}
                                                cy={cy}
                                                r={5}
                                                fill={moodColors[payload.mood] || "#888"}
                                            />
                                        );
                                    }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Pie Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Mood Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="h-64">
                        {pieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={80} label>
                                        {pieData.map((entry, index) => (
                                            <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-gray-500">No data available</p>
                        )}
                    </CardContent>
                </Card>
            </div>
            <QuoteCard />
        </div>
    );
}

// --- Helper function to calculate streaks ---
function calcStreaks(data) {
    if (!data.length) return { currentStreak: 0, longestStreak: 0 };

    let current = 1;
    let longest = 1;

    for (let i = 1; i < data.length; i++) {
        const prev = data[i - 1].rawDate;
        const curr = data[i].rawDate;
        const diffDays = (curr - prev) / (1000 * 60 * 60 * 24);

        if (diffDays === 1) {
            current++;
            longest = Math.max(longest, current);
        } else {
            current = 1;
        }
    }

    return { currentStreak: current, longestStreak: longest };
}
