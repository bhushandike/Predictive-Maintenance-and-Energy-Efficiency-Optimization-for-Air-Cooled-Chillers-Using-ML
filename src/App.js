import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Dashboard from './components/Dashboard';
import './styles/App.css';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00e5ff',
    },
    secondary: {
      main: '#ff1744',
    },
    background: {
      default: '#0a0e27',
      paper: '#151a35',
    },
  },
  typography: {
    fontFamily: '"Orbitron", "Roboto", "Arial", sans-serif',
  },
});

function App() {
  useEffect(() => {
    console.log('%c🚀 CHILLER MONITORING APP STARTED', 'color: #00e5ff; font-weight: bold; font-size: 20px');
    console.log('%cFrontend is running on http://localhost:3000', 'color: #4caf50; font-size: 14px');
    console.log('%cBackend should be running on http://localhost:5000', 'color: #ff9800; font-size: 14px');
    console.log('%c', 'font-size: 1px');
    console.log('%cOpen your browser console to see detailed logs', 'color: #00e5ff; font-size: 12px');
  }, []);

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard/*" element={<Dashboard />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;