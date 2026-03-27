import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
} from '@mui/material';
import {
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import RealTimeChart from './RealTimeChart';
import AlertPanel from './AlertPanel';
import { getRealtimeHistory } from '../services/api';

function PredictiveMaintenance({ data, mode }) {
  const [realtimeData, setRealtimeData] = useState([]);

  useEffect(() => {
    console.log('%c📊 PREDICTIVE MAINTENANCE MOUNTED', 'color: #4caf50; font-weight: bold');
    console.log('   Mode:', mode);
    console.log('   Data:', data);
  }, [data, mode]);

  useEffect(() => {
    if (mode === 'realtime') {
      console.log('🔄 Starting real-time polling (every 2 seconds)...');
      
      const interval = setInterval(async () => {
        try {
          const result = await getRealtimeHistory(100);
          console.log(`📡 Fetched ${result.data?.length || 0} realtime points`);
          setRealtimeData(result.data || []);
        } catch (error) {
          console.error('❌ Error fetching realtime data:', error);
        }
      }, 2000);

      return () => {
        console.log('🛑 Stopping real-time polling');
        clearInterval(interval);
      };
    }
  }, [mode]);

  const displayData = mode === 'realtime' && realtimeData.length > 0 
    ? { ...data, timeseries_data: realtimeData }
    : data;

  const pmData = displayData?.predictive_maintenance || {};
  const alerts = displayData?.alerts?.filter(a => a.type === 'MAINTENANCE') || [];
  const timeseriesData = displayData?.timeseries_data || [];

  console.log('%c📈 RENDERING PM DASHBOARD', 'color: #00e5ff; font-weight: bold');
  console.log('   Timeseries points:', timeseriesData.length);
  console.log('   Alerts:', alerts.length);
  console.log('   Anomaly count:', pmData.anomaly_count);

  return (
    <Box>
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(56, 142, 60, 0.2))',
            border: '2px solid rgba(76, 175, 80, 0.5)',
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                    {displayData?.summary?.operational_records || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Operational Records
                  </Typography>
                </Box>
                <CheckCircleIcon sx={{ fontSize: 50, color: '#4caf50', opacity: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.2), rgba(245, 124, 0, 0.2))',
            border: '2px solid rgba(255, 152, 0, 0.5)',
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#ff9800' }}>
                    {pmData.anomaly_count || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Anomalies Detected
                  </Typography>
                </Box>
                <WarningIcon sx={{ fontSize: 50, color: '#ff9800', opacity: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, rgba(255, 23, 68, 0.2), rgba(213, 0, 0, 0.2))',
            border: '2px solid rgba(255, 23, 68, 0.5)',
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#ff1744' }}>
                    {alerts.length}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Maintenance Alerts
                  </Typography>
                </Box>
                <ErrorIcon sx={{ fontSize: 50, color: '#ff1744', opacity: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.2), rgba(0, 184, 212, 0.2))',
            border: '2px solid rgba(0, 229, 255, 0.5)',
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#00e5ff' }}>
                    {pmData.anomaly_percentage?.toFixed(1) || 0}%
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Anomaly Rate
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Feature Importance */}
      {pmData.feature_importance && pmData.feature_importance.length > 0 && (
        <Paper sx={{ p: 3, mb: 4, background: 'rgba(21, 26, 53, 0.8)', backdropFilter: 'blur(10px)' }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#00e5ff' }}>
            🎯 Critical Parameters (Feature Importance)
          </Typography>
          <Grid container spacing={2} sx={{ mt: 2 }}>
            {pmData.feature_importance.map((item, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Box sx={{ 
                  p: 2, 
                  background: 'rgba(0, 229, 255, 0.05)',
                  borderRadius: 2,
                  border: '1px solid rgba(0, 229, 255, 0.2)',
                }}>
                  <Typography variant="body2" sx={{ mb: 1, color: '#00e5ff' }}>
                    {item.feature}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ 
                      flex: 1, 
                      height: 8, 
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: 1,
                      overflow: 'hidden',
                      mr: 2
                    }}>
                      <Box sx={{ 
                        width: `${item.importance * 100}%`,
                        height: '100%',
                        background: `linear-gradient(90deg, #00e5ff, #ff1744)`,
                      }} />
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {(item.importance * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={6}>
          <RealTimeChart
            data={timeseriesData}
            title="Compressor 1 Current"
            dataKey="comp1_current"
            color="#00e5ff"
            unit="A"
            mode={mode}
          />
        </Grid>
        <Grid item xs={12} lg={6}>
          <RealTimeChart
            data={timeseriesData}
            title="Compressor 2 Current"
            dataKey="comp2_current"
            color="#ff1744"
            unit="A"
            mode={mode}
          />
        </Grid>
        <Grid item xs={12} lg={6}>
          <RealTimeChart
            data={timeseriesData}
            title="Discharge Pressure 1"
            dataKey="discharge_pressure_1"
            color="#4caf50"
            unit="psi"
            mode={mode}
          />
        </Grid>
        <Grid item xs={12} lg={6}>
          <RealTimeChart
            data={timeseriesData}
            title="Discharge Pressure 2"
            dataKey="discharge_pressure_2"
            color="#ff9800"
            unit="psi"
            mode={mode}
          />
        </Grid>
        <Grid item xs={12} lg={6}>
          <RealTimeChart
            data={timeseriesData}
            title="Suction Pressure 1"
            dataKey="suction_pressure_1"
            color="#9c27b0"
            unit="psi"
            mode={mode}
          />
        </Grid>
        <Grid item xs={12} lg={6}>
          <RealTimeChart
            data={timeseriesData}
            title="Suction Pressure 2"
            dataKey="suction_pressure_2"
            color="#e91e63"
            unit="psi"
            mode={mode}
          />
        </Grid>
        <Grid item xs={12} lg={6}>
          <RealTimeChart
            data={timeseriesData}
            title="Cooler Water In Temperature"
            dataKey="water_in_temp"
            color="#00bcd4"
            unit="°F"
            mode={mode}
          />
        </Grid>
        <Grid item xs={12} lg={6}>
          <RealTimeChart
            data={timeseriesData}
            title="Cooler Water Out Temperature"
            dataKey="water_out_temp"
            color="#03a9f4"
            unit="°F"
            mode={mode}
          />
        </Grid>
      </Grid>

      {/* Alerts */}
      <AlertPanel alerts={alerts} title="Maintenance Alerts & Recommendations" />
    </Box>
  );
}

export default PredictiveMaintenance;