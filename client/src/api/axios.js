import axios from 'axios';

const instance = axios.create({
    // Use relative path in production (https://huququlator.com/api), but keep localhost for local dev
    baseURL: import.meta.env.MODE === 'production' ? '/api' : 'http://localhost:3000/api',
    withCredentials: true // This is crucial for sending/receiving cookies
});

export default instance;
