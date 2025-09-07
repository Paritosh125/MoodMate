import React from "react";
import { useNavigate } from "react-router-dom";

export default function Navbar({ activeTab, setActiveTab }) {
    const navigate = useNavigate();

    const logout = () => {
        localStorage.removeItem("moodmate_token");
        localStorage.removeItem("moodmate_user");
        navigate("/login");
    };

    return (
        <header className="flex items-center justify-between mb-6 bg-white rounded-xl shadow px-4 py-3">
            {/* Logo */}
            <h1 className="text-2xl font-bold text-[var(--color-accent)]">📓 MoodMate</h1>

            {/* Tab toggle */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => setActiveTab("journal")}
                    className={`px-4 py-2 rounded-lg font-medium transition ${activeTab === "journal"
                            ? "bg-[var(--color-primary)] text-[var(--color-accent)] shadow"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                >
                    Journal
                </button>
                <button
                    onClick={() => setActiveTab("analytics")}
                    className={`px-4 py-2 rounded-lg font-medium transition ${activeTab === "analytics"
                            ? "bg-[var(--color-primary)] text-[var(--color-accent)] shadow"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                >
                    Analytics
                </button>
            </div>

            {/* Logout */}
            <button
                onClick={logout}
                className="bg-[var(--color-secondary)] hover:bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg font-medium shadow transition"
            >
                Logout
            </button>
        </header>
    );
}
