import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Alert,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import RealTimeChart from './RealTimeChart';
import AlertPanel from './AlertPanel';
import { getRealtimeHistory } from '../services/api';

function EnergyEfficiency({ data, mode }) {
  const [realtimeData, setRealtimeData] = useState([]);

  // ===== DEBUG: Log when component mounts =====
  useEffect(() => {
    console.log('%c⚡ ENERGY EFFICIENCY MOUNTED', 'color: #4caf50; font-weight: bold; font-size: 16px');
    console.log('   Initial data:', data);
    console.log('   Mode:', mode);
  }, []);
  // ===== END DEBUG =====

  // ===== DEBUG: Log data changes =====
  useEffect(() => {
    console.log('%c📊 DATA CHANGED', 'color: #00e5ff; font-weight: bold');
    console.log('   data:', data);
    console.log('   data.timeseries_data length:', data?.timeseries_data?.length);
    if (data?.timeseries_data && data.timeseries_data.length > 0) {
      console.log('   First 3 points:', data.timeseries_data.slice(0, 3));
      console.log('   COP values:', data.timeseries_data.map(d => d.cop).slice(0, 10));
    }
  }, [data]);
  // ===== END DEBUG =====

  useEffect(() => {
    if (mode === 'realtime') {
      console.log('🔄 Starting real-time polling for Energy Efficiency...');
      
      const interval = setInterval(async () => {
        try {
          const result = await getRealtimeHistory(100);
          console.log(`📡 Fetched ${result.data?.length || 0} realtime points for EE`);
          setRealtimeData(result.data || []);
        } catch (error) {
          console.error('❌ Error fetching realtime data:', error);
        }
      }, 2000);

      return () => {
        console.log('🛑 Stopping real-time polling for EE');
        clearInterval(interval);
      };
    }
  }, [mode]);

  const displayData = mode === 'realtime' && realtimeData.length > 0 
    ? { ...data, timeseries_data: realtimeData }
    : data;

  const eeData = displayData?.energy_efficiency || {};
  const alerts = displayData?.alerts?.filter(a => a.type === 'OPTIMIZATION') || [];
  const timeseriesData = displayData?.timeseries_data || [];

  // ===== DEBUG: Log final display data =====
  console.log('%c📈 RENDERING WITH DATA:', 'color: #ff9800; font-weight: bold');
  console.log('   displayData:', displayData);
  console.log('   timeseriesData length:', timeseriesData.length);
  console.log('   eeData:', eeData);
  
  if (timeseriesData.length > 0) {
    const copValues = timeseriesData.map(d => d.cop);
    console.log('   All COP values:', copValues);
    console.log('   COP > 0 count:', copValues.filter(v => v > 0).length);
    console.log('   COP = 0 count:', copValues.filter(v => v === 0).length);
    console.log('   Sample points:', timeseriesData.slice(0, 3));
  } else {
    console.log('   ❌ NO TIMESERIES DATA!');
  }
  // ===== END DEBUG =====

  const copValues = timeseriesData.map(d => d.cop).filter(v => v > 0);
  const avgCOP = copValues.length > 0 
    ? (copValues.reduce((a, b) => a + b, 0) / copValues.length).toFixed(2)
    : 0;

  console.log(`   📊 Average COP: ${avgCOP} (from ${copValues.length} values)`);

  const getCOPStatus = (cop) => {
    if (cop >= 4.0) return { text: 'Excellent', color: '#4caf50' };
    if (cop >= 3.0) return { text: 'Good', color: '#00e5ff' };
    if (cop >= 2.0) return { text: 'Fair', color: '#ff9800' };
    return { text: 'Poor', color: '#ff1744' };
  };

  const copStatus = getCOPStatus(parseFloat(avgCOP));

  return (
    <Box>
      {/* ===== DEBUG ALERT ===== */}
      <Alert severity="info" sx={{ mb: 2 }}>
        {`🔍 DEBUG: Total points: ${timeseriesData.length} | COP values > 0: ${copValues.length} | Average COP: ${avgCOP} | Mode: ${mode}`}
      </Alert>
      {/* ===== END DEBUG ===== */}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.2), rgba(0, 184, 212, 0.2))',
            border: '2px solid rgba(0, 229, 255, 0.5)',
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Average COP
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#00e5ff' }}>
                    {avgCOP}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1, color: copStatus.color }}>
                    {copStatus.text}
                  </Typography>
                  <Typography variant="caption" sx={{ mt: 1, display: 'block', opacity: 0.7 }}>
                    From {copValues.length} operational points
                  </Typography>
                </Box>
                <SpeedIcon sx={{ fontSize: 60, color: '#00e5ff', opacity: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.2), rgba(245, 124, 0, 0.2))',
            border: '2px solid rgba(255, 152, 0, 0.5)',
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Inefficient Points
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#ff9800' }}>
                    {eeData.inefficient_count || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {(eeData.inefficient_percentage || 0).toFixed(1)}% of total
                  </Typography>
                </Box>
                <TrendingDownIcon sx={{ fontSize: 60, color: '#ff9800', opacity: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(56, 142, 60, 0.2))',
            border: '2px solid rgba(76, 175, 80, 0.5)',
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Optimization Opportunities
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                    {alerts.length}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Actions Available
                  </Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 60, color: '#4caf50', opacity: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* ===== COP CHART WITH DEBUG ===== */}
        <Grid item xs={12}>
          {timeseriesData.length === 0 ? (
            <Paper sx={{ p: 3, background: 'rgba(21, 26, 53, 0.8)' }}>
              <Alert severity="warning">
                ⚠️ No timeseries data available. Please upload CSV or start real-time monitoring.
              </Alert>
            </Paper>
          ) : copValues.length === 0 ? (
            <Paper sx={{ p: 3, background: 'rgba(21, 26, 53, 0.8)' }}>
              <Alert severity="warning">
                ⚠️ No valid COP values found. All {timeseriesData.length} points have COP = 0.
                This usually means: <br/>
                • System was not operational (mode 0)<br/>
                • Invalid temperature readings (In Temp ≤ Out Temp)<br/>
                • No compressor current detected
              </Alert>
            </Paper>
          ) : (
            <RealTimeChart
              data={timeseriesData}
              title="Coefficient of Performance (COP)"
              dataKey="cop"
              color="#00e5ff"
              unit=""
              mode={mode}
              height={300}
            />
          )}
        </Grid>
        {/* ===== END COP CHART ===== */}

        <Grid item xs={12} lg={6}>
          <RealTimeChart
            data={timeseriesData}
            title="Operational Mode"
            dataKey="operational_mode"
            color="#4caf50"
            unit=""
            mode={mode}
          />
        </Grid>
        <Grid item xs={12} lg={6}>
          <RealTimeChart
            data={timeseriesData}
            title="Water Temperature Differential"
            dataKey="water_in_temp"
            secondaryDataKey="water_out_temp"
            color="#ff9800"
            secondaryColor="#03a9f4"
            unit="°F"
            mode={mode}
          />
        </Grid>
      </Grid>

      {/* Control Recommendations */}
      <Paper sx={{ p: 3, mb: 4, background: 'rgba(21, 26, 53, 0.8)', backdropFilter: 'blur(10px)' }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#00e5ff', mb: 3 }}>
          🎮 Control Parameter Recommendations
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Box sx={{ 
              p: 2,
              background: 'rgba(76, 175, 80, 0.1)',
              borderRadius: 2,
              border: '1px solid rgba(76, 175, 80, 0.3)',
            }}>
              <Typography variant="h6" sx={{ color: '#4caf50', mb: 2 }}>
                ✅ Current Best Practices
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                • Maintain COP above 3.0 for optimal efficiency
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                • Keep water outlet temperature at 42-45°F
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                • Ensure proper condenser fan staging
              </Typography>
              <Typography variant="body2">
                • Monitor EXV position (40-60% optimal)
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ 
              p: 2,
              background: 'rgba(255, 152, 0, 0.1)',
              borderRadius: 2,
              border: '1px solid rgba(255, 152, 0, 0.3)',
            }}>
              <Typography variant="h6" sx={{ color: '#ff9800', mb: 2 }}>
                ⚠️ Suggested Adjustments
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                • Consider increasing CW OUT TRGT by 1-2°F
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                • Review condenser fan control settings
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                • Optimize EXV load adjustment parameters
              </Typography>
              <Typography variant="body2">
                • Verify superheat targets (8-12°F ideal)
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Alerts */}
      <AlertPanel alerts={alerts} title="Energy Efficiency Alerts & Optimization" />
    </Box>
  );
}

export default EnergyEfficiency;