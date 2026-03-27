import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';

function AlertPanel({ alerts, title }) {
  const [expanded, setExpanded] = useState(false);

  const getSeverityConfig = (severity) => {
    const configs = {
      CRITICAL: {
        color: '#ff1744',
        bgColor: 'rgba(255, 23, 68, 0.1)',
        borderColor: 'rgba(255, 23, 68, 0.5)',
        icon: <ErrorIcon />,
      },
      HIGH: {
        color: '#ff9800',
        bgColor: 'rgba(255, 152, 0, 0.1)',
        borderColor: 'rgba(255, 152, 0, 0.5)',
        icon: <WarningIcon />,
      },
      MEDIUM: {
        color: '#00e5ff',
        bgColor: 'rgba(0, 229, 255, 0.1)',
        borderColor: 'rgba(0, 229, 255, 0.5)',
        icon: <InfoIcon />,
      },
      LOW: {
        color: '#4caf50',
        bgColor: 'rgba(76, 175, 80, 0.1)',
        borderColor: 'rgba(76, 175, 80, 0.5)',
        icon: <CheckCircleIcon />,
      },
    };
    return configs[severity] || configs.MEDIUM;
  };

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  if (!alerts || alerts.length === 0) {
    return (
      <Paper sx={{ 
        p: 3, 
        background: 'rgba(21, 26, 53, 0.8)', 
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(76, 175, 80, 0.3)',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
          <CheckCircleIcon sx={{ fontSize: 60, color: '#4caf50', mr: 2 }} />
          <Box>
            <Typography variant="h5" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
              All Systems Normal
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mt: 1 }}>
              No alerts or recommendations at this time
            </Typography>
          </Box>
        </Box>
      </Paper>
    );
  }

  const alertsBySeverity = alerts.reduce((acc, alert) => {
    const severity = alert.severity || 'MEDIUM';
    if (!acc[severity]) acc[severity] = [];
    acc[severity].push(alert);
    return acc;
  }, {});

  console.log(`🚨 Rendering ${alerts.length} alerts`);

  return (
    <Paper sx={{ 
      p: 3, 
      background: 'rgba(21, 26, 53, 0.8)', 
      backdropFilter: 'blur(10px)',
    }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#00e5ff', mb: 3 }}>
        🚨 {title}
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        {Object.entries(alertsBySeverity).map(([severity, severityAlerts]) => {
          const config = getSeverityConfig(severity);
          return (
            <Chip
              key={severity}
              label={`${severity}: ${severityAlerts.length}`}
              sx={{
                background: config.bgColor,
                border: `1px solid ${config.borderColor}`,
                color: config.color,
                fontWeight: 'bold',
              }}
              icon={React.cloneElement(config.icon, { sx: { color: config.color + ' !important' } })}
            />
          );
        })}
      </Box>

      <Divider sx={{ mb: 3, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

      <Box>
        {alerts.map((alert, index) => {
          const config = getSeverityConfig(alert.severity);
          
          return (
            <Accordion
              key={index}
              expanded={expanded === `alert-${index}`}
              onChange={handleAccordionChange(`alert-${index}`)}
              sx={{
                background: config.bgColor,
                border: `1px solid ${config.borderColor}`,
                mb: 2,
                '&:before': { display: 'none' },
                borderRadius: '8px !important',
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: config.color }} />}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Box sx={{ color: config.color, mr: 2 }}>
                    {config.icon}
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {alert.message || 'Alert'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                      {new Date(alert.timestamp).toLocaleString()}
                    </Typography>
                  </Box>
                  <Chip
                    label={alert.type}
                    size="small"
                    sx={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'rgba(255, 255, 255, 0.8)',
                      mr: 2,
                    }}
                  />
                  <Chip
                    label={alert.severity}
                    size="small"
                    sx={{
                      background: config.color,
                      color: '#000',
                      fontWeight: 'bold',
                    }}
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {alert.parameters && Object.keys(alert.parameters).length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ color: config.color, mb: 1, fontWeight: 'bold' }}>
                      📊 Affected Parameters:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {Object.entries(alert.parameters).map(([key, value]) => (
                        <Chip
                          key={key}
                          label={`${key}: ${typeof value === 'number' ? value.toFixed(2) : value}`}
                          size="small"
                          sx={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            color: 'rgba(255, 255, 255, 0.9)',
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                {alert.recommendations && alert.recommendations.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: config.color, mb: 1, fontWeight: 'bold' }}>
                      💡 Recommendations:
                    </Typography>
                    <List dense sx={{ 
                      background: 'rgba(0, 0, 0, 0.2)',
                      borderRadius: 1,
                      p: 1,
                    }}>
                      {alert.recommendations.map((rec, idx) => (
                        <ListItem key={idx}>
                          <ListItemText
                            primary={rec}
                            primaryTypographyProps={{
                              variant: 'body2',
                              sx: { color: 'rgba(255, 255, 255, 0.9)' }
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Box>
    </Paper>
  );
}

export default AlertPanel;