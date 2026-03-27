import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  CardActions,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Radio as RadioIcon,
} from '@mui/icons-material';
import { uploadStaticData } from '../services/api';

function ModeSelector({ onModeSelect, onDataReceived, mode }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    
    console.log('%c📁 FILE SELECTED', 'color: #00e5ff; font-weight: bold; font-size: 14px');
    console.log('   File:', file?.name);
    console.log('   Size:', file?.size, 'bytes');
    console.log('   Type:', file?.type);
    
    setSelectedFile(file);
    setError('');
    setSuccess('');
  };

  const handleStaticUpload = async () => {
  if (!selectedFile) {
    console.warn('⚠️ No file selected');
    setError('Please select a file');
    return;
  }

  console.log('%c🚀 STARTING STATIC UPLOAD', 'color: #4caf50; font-weight: bold; font-size: 16px');
  console.log('   File:', selectedFile.name);
  
  setLoading(true);
  setError('');
  setSuccess('');

  try {
    console.log('📤 Calling uploadStaticData API...');
    const data = await uploadStaticData(selectedFile);
    
    console.log('%c✅ DATA RECEIVED FROM BACKEND', 'color: #4caf50; font-weight: bold; font-size: 14px');
    
    // ===== NEW: LOG FULL RESPONSE =====
    console.log('📦 FULL RESPONSE OBJECT:', data);
    console.log('📦 Response type:', typeof data);
    console.log('📦 Response keys:', Object.keys(data));
    console.log('📦 Is Array?:', Array.isArray(data));
    
    // Try to access nested data
    console.log('🔍 Checking data.data:', data.data);
    console.log('🔍 Checking data.summary:', data.summary);
    console.log('🔍 Checking data.alerts:', data.alerts);
    console.log('🔍 Checking data.timeseries_data:', data.timeseries_data);
    // ===== END NEW =====
    
    console.log('   Summary:', data.summary);
    console.log('   Alerts:', data.alerts?.length);
    console.log('   Timeseries points:', data.timeseries_data?.length);
    
    setSuccess(`Successfully analyzed ${data.summary?.total_records || 0} records`);
    
    console.log('📊 Passing data to parent component...');
    onModeSelect('static');
    onDataReceived(data);
    
    console.log('%c✅ STATIC MODE ACTIVATED', 'color: #4caf50; font-weight: bold');
    
  } catch (err) {
    console.error('%c❌ UPLOAD ERROR', 'color: #ff1744; font-weight: bold; font-size: 14px');
    console.error('   Error:', err);
    console.error('   Response:', err.response?.data);
    
    const errorMessage = err.response?.data?.error || err.message || 'Error uploading file';
    setError(errorMessage);
  } finally {
    setLoading(false);
  }
};

  const handleRealtimeStart = () => {
    console.log('%c🔴 STARTING REAL-TIME MODE', 'color: #ff1744; font-weight: bold; font-size: 16px');
    
    const initialData = { 
      summary: { 
        total_records: 0,
        operational_records: 0,
        mode_0_count: 0,
        mode_1_count: 0,
        mode_2_count: 0
      },
      timeseries_data: [],
      alerts: [],
      predictive_maintenance: {
        anomaly_count: 0,
        anomaly_percentage: 0,
        feature_importance: []
      },
      energy_efficiency: {
        inefficient_count: 0,
        inefficient_percentage: 0
      }
    };
    
    console.log('📊 Passing initial data to parent...');
    onModeSelect('realtime');
    onDataReceived(initialData);
    
    console.log('%c✅ REAL-TIME MODE ACTIVATED', 'color: #ff1744; font-weight: bold');
    console.log('   Ready to receive data from Postman');
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
      <Grid container spacing={4} maxWidth="lg">
        <Grid item xs={12}>
          <Typography variant="h3" align="center" gutterBottom sx={{ 
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #00e5ff, #ff1744)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 4
          }}>
            Select Monitoring Mode
          </Typography>
        </Grid>

        {error && (
          <Grid item xs={12}>
            <Alert severity="error" onClose={() => setError('')}>
              {error}
            </Alert>
          </Grid>
        )}
        
        {success && (
          <Grid item xs={12}>
            <Alert severity="success" onClose={() => setSuccess('')}>
              {success}
            </Alert>
          </Grid>
        )}

        {/* Static Mode */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            height: '100%',
            background: 'rgba(21, 26, 53, 0.8)',
            backdropFilter: 'blur(10px)',
            border: '2px solid rgba(0, 229, 255, 0.3)',
            transition: 'all 0.3s',
            '&:hover': {
              transform: 'translateY(-10px)',
              border: '2px solid #00e5ff',
              boxShadow: '0 10px 40px rgba(0, 229, 255, 0.3)',
            }
          }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <CloudUploadIcon sx={{ fontSize: 60, color: '#00e5ff', mr: 2 }} />
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  Static Analysis
                </Typography>
              </Box>
              
              <Typography variant="body1" sx={{ mb: 3, minHeight: 80 }}>
                Upload a CSV file containing historical chiller data for comprehensive analysis.
                Get detailed insights on predictive maintenance and energy efficiency.
              </Typography>

              <TextField
                type="file"
                onChange={handleFileSelect}
                inputProps={{ accept: '.csv' }}
                fullWidth
                sx={{ mb: 2 }}
                disabled={loading}
              />

              {selectedFile && (
                <Typography variant="body2" sx={{ mb: 2, color: '#00e5ff' }}>
                  ✓ Selected: {selectedFile.name}
                </Typography>
              )}

              {loading && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  <Typography variant="body2">Analyzing data...</Typography>
                </Box>
              )}
            </CardContent>

            <CardActions sx={{ p: 4, pt: 0 }}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleStaticUpload}
                disabled={loading || !selectedFile}
                sx={{
                  py: 2,
                  background: 'linear-gradient(45deg, #00e5ff, #00b8d4)',
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #00b8d4, #0091a3)',
                  },
                  '&:disabled': {
                    background: 'rgba(255, 255, 255, 0.12)',
                    color: 'rgba(255, 255, 255, 0.3)',
                  }
                }}
              >
                {loading ? 'Analyzing...' : 'Upload & Analyze'}
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Real-time Mode */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            height: '100%',
            background: 'rgba(21, 26, 53, 0.8)',
            backdropFilter: 'blur(10px)',
            border: '2px solid rgba(255, 23, 68, 0.3)',
            transition: 'all 0.3s',
            '&:hover': {
              transform: 'translateY(-10px)',
              border: '2px solid #ff1744',
              boxShadow: '0 10px 40px rgba(255, 23, 68, 0.3)',
            }
          }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <RadioIcon sx={{ fontSize: 60, color: '#ff1744', mr: 2 }} />
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  Real-Time Monitoring
                </Typography>
              </Box>
              
              <Typography variant="body1" sx={{ mb: 3, minHeight: 80 }}>
                Connect to live chiller data stream for real-time monitoring and instant alerts.
                Use Postman Collection Runner to stream data.
              </Typography>

              <Box sx={{ 
                p: 2, 
                background: 'rgba(255, 23, 68, 0.1)', 
                borderRadius: 2,
                border: '1px solid rgba(255, 23, 68, 0.3)',
                mb: 2
              }}>
                <Typography variant="body2">
                  📡 Endpoint: POST /realtime/data
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Use Postman Collection Runner (2000ms delay)
                </Typography>
              </Box>
            </CardContent>

            <CardActions sx={{ p: 4, pt: 0 }}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleRealtimeStart}
                sx={{
                  py: 2,
                  background: 'linear-gradient(45deg, #ff1744, #d50000)',
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #d50000, #aa0000)',
                  }
                }}
              >
                Start Real-Time Monitoring
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default ModeSelector;