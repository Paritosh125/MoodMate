// src/components/UI/Card.jsx
import React from "react";

export function Card({ children, className = "" }) {
    return (
        <div className={`bg-white dark:bg-gray-800 rounded-xl shadow p-4 ${className}`}>
            {children}
        </div>
    );
}

export function CardHeader({ children }) {
    return <div className="mb-3">{children}</div>;
}

export function CardTitle({ children }) {
    return <h2 className="text-lg font-semibold">{children}</h2>;
}

export function CardContent({ children, className = "" }) {
    return <div className={className}>{children}</div>;
}
