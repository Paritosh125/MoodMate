import axios from "axios";

const api = axios.create({
    baseURL: "https://moodmate-05sf.onrender.com/api",
});

// Attach token if available
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
