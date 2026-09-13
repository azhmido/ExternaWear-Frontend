import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ew_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor untuk menangani Cold Start (Server tertidur)
// Otomatis mengulang (retry) request yang gagal maksimal 3 kali dengan jeda waktu.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    
    // Jangan retry jika error berasal dari client (400, 401, 403, 404, dll), HANYA retry 5xx atau Network Error
    if (error.response && error.response.status < 500) {
      return Promise.reject(error);
    }
    
    // Jika tidak ada config atau retry sudah melebihi 3 kali, tolak (reject)
    if (!config || (config._retryCount && config._retryCount >= 3)) {
      return Promise.reject(error);
    }
    
    // Tambah hitungan retry
    config._retryCount = (config._retryCount || 0) + 1;
    
    // Berikan jeda waktu (backoff): 1 detik, 2 detik, 3 detik agar server sempat bangun
    const backoff = new Promise((resolve) => {
      setTimeout(() => resolve(), config._retryCount * 1000);
    });
    
    await backoff;
    return api(config);
  }
);

export default api;