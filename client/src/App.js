import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import { ThemeProvider, createTheme, useTheme } from "@mui/material/styles";
import Scene from "./Scene";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import React, { useState, useEffect } from "react";
import "./theme.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useParams,
} from "react-router-dom";
import Footer from "./components/Footer";
import SolarSystemView from "./views/SolarSystemView";
import PlanetView from "./views/PlanetView";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#ff61d8",
    },
    secondary: {
      main: "#4df4ff",
    },
    success: {
      main: "#7bffa0",
    },
    error: {
      main: "#ff5757",
    },
    warning: {
      main: "#ff9b3d",
    },
    background: {
      default: "#1a1040",
      paper: "#2a1b50",
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "#2a1b50",
          backgroundImage: "none",
          border: "none",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          fontFamily: '"Roboto Mono", monospace',
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          fontFamily: '"Roboto Mono", monospace',
        },
      },
    },
  },
  typography: {
    fontFamily: '"Roboto Mono", monospace',
  },
});

function AppContent() {
  const [baseKeyOffset, setBaseKeyOffset] = useState(0);
  const theme = useTheme();
  const { galaxyId } = useParams();

  // Update baseKeyOffset when galaxyId changes
  useEffect(() => {
    if (galaxyId !== undefined) {
      const index = parseInt(galaxyId, 10);
      if (!isNaN(index)) {
        setBaseKeyOffset(index);
      }
    }
  }, [galaxyId]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <CssBaseline />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          position: "relative",
          overflow: "hidden",
          background: theme.palette.background.default,
        }}
      >
        <Router>
          <Routes>
            <Route
              path="/"
              element={
                <Scene
                  baseKeyOffset={baseKeyOffset}
                  onKeyOffsetChange={setBaseKeyOffset}
                />
              }
            />
            <Route
              path="/galaxy/:galaxyId"
              element={
                <Scene
                  baseKeyOffset={baseKeyOffset}
                  onKeyOffsetChange={setBaseKeyOffset}
                />
              }
            />
            <Route
              path="/galaxy/:galaxyId/star/:starId"
              element={
                <Scene
                  baseKeyOffset={baseKeyOffset}
                  onKeyOffsetChange={setBaseKeyOffset}
                  view="solarSystem"
                />
              }
            />
            <Route
              path="/galaxy/:galaxyId/star/:starId/planet/:planetId"
              element={
                <Scene
                  baseKeyOffset={baseKeyOffset}
                  onKeyOffsetChange={setBaseKeyOffset}
                  view="planet"
                />
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </Box>
      <Footer baseKeyOffset={baseKeyOffset} />
    </Box>
  );
}

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <div className="App">
        <AppContent />
      </div>
    </ThemeProvider>
  );
}

export default App;
