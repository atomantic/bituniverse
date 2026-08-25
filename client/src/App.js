import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import { ThemeProvider, createTheme } from "@mui/material/styles";
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

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#ff61d8" },
    secondary: { main: "#4df4ff" },
    success: { main: "#7bffa0" },
    error: { main: "#ff5757" },
    warning: { main: "#ff9b3d" },
    background: { default: "#1a1040", paper: "#2a1b50" },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: { backgroundColor: "#2a1b50", backgroundImage: "none", border: "none" },
      },
    },
    MuiButton: {
      styleOverrides: { root: { fontFamily: '"Roboto Mono", monospace' } },
    },
    MuiTypography: {
      styleOverrides: { root: { fontFamily: '"Roboto Mono", monospace' } },
    },
  },
  typography: { fontFamily: '"Roboto Mono", monospace' },
});

// Deep zoom path built incrementally
const P = "/galaxy/:galaxyId/star/:starId/planet/:planetId";
const D1 = `${P}/region/:regionId`;
const D2 = `${D1}/sector/:sectorId`;
const D3 = `${D2}/area/:areaId`;
const D4 = `${D3}/ground/:groundId`;
const D5 = `${D4}/grain/:grainId`;
const D6 = `${D5}/molecule/:moleculeId`;
const D7 = `${D6}/atom/:atomId`;
const D8 = `${D7}/quark/:quarkId`;

function AppContent() {
  const [baseKeyOffset, setBaseKeyOffset] = useState(0);
  const { galaxyId } = useParams();

  useEffect(() => {
    if (galaxyId !== undefined) {
      const index = parseInt(galaxyId, 10);
      if (!isNaN(index)) setBaseKeyOffset(index);
    }
  }, [galaxyId]);

  const sceneProps = {
    baseKeyOffset,
    onKeyOffsetChange: setBaseKeyOffset,
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh", background: "#000" }}>
      <CssBaseline />
      <Box component="main" sx={{ flexGrow: 1, position: "relative", overflow: "hidden" }}>
        <Routes>
            <Route path="/" element={<Scene {...sceneProps} />} />
            <Route path="/galaxy/:galaxyId" element={<Scene {...sceneProps} />} />
            <Route path="/galaxy/:galaxyId/star/:starId" element={<Scene {...sceneProps} view="solarSystem" />} />
            <Route path={P} element={<Scene {...sceneProps} view="planet" />} />
            <Route path={D1} element={<Scene {...sceneProps} view="map" />} />
            <Route path={D2} element={<Scene {...sceneProps} view="sector" />} />
            <Route path={D3} element={<Scene {...sceneProps} view="region" />} />
            <Route path={D4} element={<Scene {...sceneProps} view="area" />} />
            <Route path={D5} element={<Scene {...sceneProps} view="ground" />} />
            <Route path={D6} element={<Scene {...sceneProps} view="grain" />} />
            <Route path={D7} element={<Scene {...sceneProps} view="molecule" />} />
            <Route path={D8} element={<Scene {...sceneProps} view="atom" />} />
            <Route path={`${D8}/string/:stringId`} element={<Scene {...sceneProps} view="quark" />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
      </Box>
    </Box>
  );
}

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <div className="App">
        <Router>
          <AppContent />
        </Router>
      </div>
    </ThemeProvider>
  );
}

export default App;
