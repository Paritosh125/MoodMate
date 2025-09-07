// src/components/QuoteCard.jsx
import React, { useEffect, useState } from "react";

const quotes = [
    "Happiness depends upon ourselves.",
    "Every day may not be good, but there's something good in every day.",
    "Keep going, you’re doing great!",
    "Your future self will thank you for this.",
];

export default function QuoteCard() {
    const [quote, setQuote] = useState("");

    useEffect(() => {
        const random = quotes[Math.floor(Math.random() * quotes.length)];
        setQuote(random);
    }, []);

    return (
        <div className="bg-[#FFD93D] rounded-2xl shadow p-6 text-center">
            <p className="text-lg font-medium text-[#4F200D]">"{quote}"</p>
        </div>
    );
}
