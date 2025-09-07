// src/utils/moodAnalyzer.js
import Sentiment from "sentiment";
const sentiment = new Sentiment();

/**
 * analyzeMood(text) -> returns one of:
 * "Excited", "Happy", "Neutral", "Sad", "Angry"
 */
export function analyzeMood(text) {
    if (!text || text.trim().length < 3) return "Neutral";

    const { score } = sentiment.analyze(text);

    // Tuned thresholds — adjust if you want more/less sensitivity
    if (score >= 4) return "Excited";
    if (score >= 2) return "Happy";
    if (score === 0) return "Neutral";
    if (score <= -4) return "Angry";
    if (score <= -1) return "Sad";
    return "Neutral";
}
