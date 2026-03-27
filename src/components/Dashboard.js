import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Tabs,
  Tab,
  Paper,
  Alert,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  TrendingUp as TrendingUpIcon,
  Build as BuildIcon,
} from '@mui/icons-material';
import ModeSelector from './ModeSelector';
import PredictiveMaintenance from './PredictiveMaintenance';
import EnergyEfficiency from './EnergyEfficiency';

function Dashboard() {
  const [currentTab, setCurrentTab] = useState(0);
  const [mode, setMode] = useState('static');
  const [data, setData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('%c📊 DASHBOARD DATA UPDATED', 'color: #00e5ff; font-weight: bold; font-size: 14px');
    console.log('   Data exists:', !!data);
    console.log('   Mode:', mode);
    if (data) {
      console.log('   Total records:', data.summary?.total_records);
      console.log('   Alerts:', data.alerts?.length);
      console.log('   Timeseries points:', data.timeseries_data?.length);
    }
  }, [data]);

  const handleTabChange = (event, newValue) => {
    console.log(`🔄 Tab changed: ${newValue === 0 ? 'Predictive Maintenance' : 'Energy Efficiency'}`);
    setCurrentTab(newValue);
    if (newValue === 0) {
      navigate('/dashboard/maintenance');
    } else {
      navigate('/dashboard/efficiency');
    }
  };

  const handleDataReceived = (receivedData) => {
    console.log('%c📥 DASHBOARD RECEIVED DATA', 'color: #4caf50; font-weight: bold; font-size: 16px');
    console.log('   Received data:', receivedData);
    
    if (!receivedData) {
      console.error('❌ Received null/undefined data');
      return;
    }
    
    console.log('✅ Data validation passed');
    console.log('   Summary:', receivedData.summary);
    console.log('   PM:', receivedData.predictive_maintenance);
    console.log('   EE:', receivedData.energy_efficiency);
    console.log('   Alerts:', receivedData.alerts?.length);
    console.log('   Timeseries:', receivedData.timeseries_data?.length);
    
    setData(receivedData);
    
    console.log('%c✅ DATA SET IN STATE', 'color: #4caf50; font-weight: bold');
  };

  const handleModeSelect = (selectedMode) => {
    console.log(`%c🔄 MODE SELECTED: ${selectedMode.toUpperCase()}`, 'color: #ff9800; font-weight: bold; font-size: 14px');
    setMode(selectedMode);
  };

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%)' }}>
      <AppBar position="static" sx={{ background: 'rgba(0, 229, 255, 0.1)', backdropFilter: 'blur(10px)' }}>
        <Toolbar>
          <SettingsIcon sx={{ mr: 2, fontSize: 40, color: '#00e5ff' }} />
          <Typography variant="h4" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Air-Cooled Chiller Monitoring System
          </Typography>
          <Box sx={{ 
            px: 2, 
            py: 1, 
            borderRadius: 2, 
            background: mode === 'realtime' ? 'rgba(255, 23, 68, 0.2)' : 'rgba(0, 229, 255, 0.2)',
            border: `2px solid ${mode === 'realtime' ? '#ff1744' : '#00e5ff'}`
          }}>
            <Typography variant="h6">
              {mode === 'realtime' ? '🔴 LIVE' : '📊 STATIC'}
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {!data ? (
          <ModeSelector 
            onModeSelect={handleModeSelect} 
            onDataReceived={handleDataReceived} 
            mode={mode} 
          />
        ) : (
          <>
            {/* Debug Info */}
            <Alert severity="info" sx={{ mb: 2 }}>
              ✅ Data loaded: {data.summary?.total_records || 0} total, 
              {' '}{data.summary?.operational_records || 0} operational, 
              {' '}{data.alerts?.length || 0} alerts
            </Alert>

            <Paper sx={{ mb: 3, background: 'rgba(21, 26, 53, 0.8)', backdropFilter: 'blur(10px)' }}>
              <Tabs
                value={currentTab}
                onChange={handleTabChange}
                centered
                sx={{
                  '& .MuiTab-root': {
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    py: 2,
                  },
                }}
              >
                <Tab
                  icon={<BuildIcon />}
                  label="Predictive Maintenance"
                  iconPosition="start"
                />
                <Tab
                  icon={<TrendingUpIcon />}
                  label="Energy Efficiency"
                  iconPosition="start"
                />
              </Tabs>
            </Paper>

            <Routes>
              <Route path="/" element={<PredictiveMaintenance data={data} mode={mode} />} />
              <Route path="/maintenance" element={<PredictiveMaintenance data={data} mode={mode} />} />
              <Route path="/efficiency" element={<EnergyEfficiency data={data} mode={mode} />} />
            </Routes>
          </>
        )}
      </Container>
    </Box>
  );
}

export default Dashboard;