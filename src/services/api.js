import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

console.log('%c🔗 API SERVICE INITIALIZED', 'color: #00e5ff; font-weight: bold; font-size: 14px');
console.log(`   Base URL: ${API_BASE_URL}`);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log('%c📤 API REQUEST', 'color: #4caf50; font-weight: bold');
    console.log(`   Method: ${config.method?.toUpperCase()}`);
    console.log(`   URL: ${config.url}`);
    console.log(`   Full URL: ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('%c❌ REQUEST ERROR', 'color: #ff1744; font-weight: bold');
    console.error(error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('%c✅ API RESPONSE', 'color: #4caf50; font-weight: bold');
    console.log(`   Status: ${response.status}`);
    console.log(`   URL: ${response.config.url}`);
    console.log('   Data:', response.data);
    return response;
  },
  (error) => {
    console.error('%c❌ RESPONSE ERROR', 'color: #ff1744; font-weight: bold');
    console.error(`   Status: ${error.response?.status}`);
    console.error(`   URL: ${error.config?.url}`);
    console.error('   Error:', error.response?.data);
    return Promise.reject(error);
  }
);

export const uploadStaticData = async (file) => {
  console.log('%c📁 UPLOADING STATIC FILE', 'color: #ff9800; font-weight: bold');
  console.log(`   File: ${file.name}`);
  
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000,
    });
    
    console.log('%c✅ UPLOAD SUCCESS', 'color: #4caf50; font-weight: bold');
    
    let data = response.data;
    
    // Parse string to JSON if needed
    if (typeof data === 'string') {
      console.log('⚠️ Response is a string, parsing to JSON...');
      
      // ===== FIX: Replace NaN, Infinity with null before parsing =====
      const cleanedString = data
        .replace(/:\s*NaN\s*,/g, ': null,')           // NaN in middle
        .replace(/:\s*NaN\s*}/g, ': null}')           // NaN at end of object
        .replace(/:\s*Infinity\s*,/g, ': null,')      // Infinity
        .replace(/:\s*-Infinity\s*,/g, ': null,')     // -Infinity
        .replace(/:\s*NaN\s*]/g, ': null]');          // NaN in array
      
      console.log('🧹 Cleaned NaN/Infinity values');
      // ===== END FIX =====
      
      try {
        data = JSON.parse(cleanedString);
        console.log('✅ Successfully parsed JSON');
      } catch (parseError) {
        console.error('❌ Failed to parse JSON:', parseError);
        console.error('Response preview:', data.substring(0, 500));
        throw new Error('Invalid JSON response from server');
      }
    }
    
    console.log('📦 Final data:', data);
    console.log('📦 Has summary:', !!data.summary);
    console.log('📦 Has alerts:', !!data.alerts);
    console.log('📦 Has timeseries:', !!data.timeseries_data);
    
    return data;
    
  } catch (error) {
    console.error('%c❌ UPLOAD FAILED', 'color: #ff1744; font-weight: bold');
    console.error(error);
    throw error;
  }
};

export const sendRealtimeData = async (data) => {
  console.log('📡 Sending realtime data point');
  const response = await api.post('/realtime/data', data);
  return response.data;
};

export const getRealtimeHistory = async (limit = 100) => {
  console.log(`📥 Fetching ${limit} realtime history points`);
  const response = await api.get(`/realtime/history?limit=${limit}`);
  return response.data;
};

export const clearRealtimeData = async () => {
  console.log('🗑️ Clearing realtime data');
  const response = await api.post('/realtime/clear');
  return response.data;
};

export const checkHealth = async () => {
  console.log('🏥 Checking API health');
  const response = await api.get('/health');
  return response.data;
};

export default api;