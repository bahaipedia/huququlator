import axios from 'axios';

const instance = axios.create({
    baseURL: 'http://localhost:5000/api',
    withCredentials: true // This is crucial for sending/receiving cookies
});

export default instance;
