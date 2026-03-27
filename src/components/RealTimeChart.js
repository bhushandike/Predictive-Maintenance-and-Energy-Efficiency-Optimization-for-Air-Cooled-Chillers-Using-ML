import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Paper, Typography, Box } from '@mui/material';

function RealTimeChart({ 
  data, 
  title, 
  dataKey, 
  secondaryDataKey,
  color = '#00e5ff', 
  secondaryColor = '#ff1744',
  unit = '',
  mode = 'static',
  height = 250
}) {
  console.log(`📊 Rendering chart: ${title}`);
  console.log(`   Data points: ${data?.length || 0}`);
  console.log(`   Mode: ${mode}`);

  const chartData = data.map((item, index) => ({
    index,
    timestamp: item.timestamp || index,
    [dataKey]: item[dataKey] || 0,
    ...(secondaryDataKey ? { [secondaryDataKey]: item[secondaryDataKey] || 0 } : {})
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Box sx={{ 
          background: 'rgba(10, 14, 39, 0.95)',
          border: '1px solid rgba(0, 229, 255, 0.5)',
          borderRadius: 1,
          p: 1.5
        }}>
          <Typography variant="body2" sx={{ color: '#00e5ff', mb: 1 }}>
            Point: {label}
          </Typography>
          {payload.map((entry, index) => (
            <Typography key={index} variant="body2" sx={{ color: entry.color }}>
              {entry.name}: {entry.value?.toFixed(2)} {unit}
            </Typography>
          ))}
        </Box>
      );
    }
    return null;
  };

  return (
    <Paper sx={{ 
      p: 3, 
      background: 'rgba(21, 26, 53, 0.8)', 
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(0, 229, 255, 0.2)',
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
          {title}
        </Typography>
        {mode === 'realtime' && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            px: 2,
            py: 0.5,
            borderRadius: 1,
            background: 'rgba(255, 23, 68, 0.2)',
            border: '1px solid #ff1744',
          }}>
            <Box sx={{ 
              width: 8, 
              height: 8, 
              borderRadius: '50%',
              background: '#ff1744',
              mr: 1,
              animation: 'pulse 1.5s infinite',
              '@keyframes pulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.3 },
              }
            }} />
            <Typography variant="caption" sx={{ color: '#ff1744', fontWeight: 'bold' }}>
              LIVE
            </Typography>
          </Box>
        )}
      </Box>

      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
          <XAxis 
            dataKey="index" 
            stroke="rgba(255, 255, 255, 0.5)"
            tick={{ fill: 'rgba(255, 255, 255, 0.7)' }}
          />
          <YAxis 
            stroke="rgba(255, 255, 255, 0.5)"
            tick={{ fill: 'rgba(255, 255, 255, 0.7)' }}
            label={{ 
              value: unit, 
              angle: -90, 
              position: 'insideLeft',
              style: { fill: 'rgba(255, 255, 255, 0.7)' }
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ color: 'rgba(255, 255, 255, 0.7)' }} />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            dot={false}
            name={title}
            isAnimationActive={mode === 'realtime'}
          />
          {secondaryDataKey && (
            <Line
              type="monotone"
              dataKey={secondaryDataKey}
              stroke={secondaryColor}
              strokeWidth={2}
              dot={false}
              name={secondaryDataKey}
              isAnimationActive={mode === 'realtime'}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </Paper>
  );
}

export default RealTimeChart;