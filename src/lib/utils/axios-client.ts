import axios, { type AxiosInstance } from 'axios';

const api: AxiosInstance = axios.create({});

// Response interceptor (optional: global error handling)
api.interceptors.response.use(
	(response) => response.data,
	(error) => {
		console.error('API error:', error);
		return Promise.reject(error);
	}
);

export default api;
