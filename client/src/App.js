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

// Base path prefix for planet deep-zoom
const P = "/galaxy/:galaxyId/star/:starId/planet/:planetId";

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
        <Router>
          <Routes>
            <Route path="/" element={<Scene {...sceneProps} />} />
            <Route path="/galaxy/:galaxyId" element={<Scene {...sceneProps} />} />
            <Route
              path="/galaxy/:galaxyId/star/:starId"
              element={<Scene {...sceneProps} view="solarSystem" />}
            />
            <Route
              path={`${P}`}
              element={<Scene {...sceneProps} view="planet" />}
            />
            <Route
              path={`${P}/globe/:continentId`}
              element={<Scene {...sceneProps} view="globe" />}
            />
            <Route
              path={`${P}/globe/:continentId/region/:regionId`}
              element={<Scene {...sceneProps} view="continent" />}
            />
            <Route
              path={`${P}/globe/:continentId/region/:regionId/area/:areaId`}
              element={<Scene {...sceneProps} view="region" />}
            />
            <Route
              path={`${P}/globe/:continentId/region/:regionId/area/:areaId/ground/:groundId`}
              element={<Scene {...sceneProps} view="area" />}
            />
            <Route
              path={`${P}/globe/:continentId/region/:regionId/area/:areaId/ground/:groundId/grain/:grainId`}
              element={<Scene {...sceneProps} view="ground" />}
            />
            <Route
              path={`${P}/globe/:continentId/region/:regionId/area/:areaId/ground/:groundId/grain/:grainId/molecule/:moleculeId`}
              element={<Scene {...sceneProps} view="grain" />}
            />
            <Route
              path={`${P}/globe/:continentId/region/:regionId/area/:areaId/ground/:groundId/grain/:grainId/molecule/:moleculeId/atom/:atomId`}
              element={<Scene {...sceneProps} view="molecule" />}
            />
            <Route
              path={`${P}/globe/:continentId/region/:regionId/area/:areaId/ground/:groundId/grain/:grainId/molecule/:moleculeId/atom/:atomId/quark/:quarkId`}
              element={<Scene {...sceneProps} view="atom" />}
            />
            <Route
              path={`${P}/globe/:continentId/region/:regionId/area/:areaId/ground/:groundId/grain/:grainId/molecule/:moleculeId/atom/:atomId/quark/:quarkId/string/:stringId`}
              element={<Scene {...sceneProps} view="quark" />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </Box>
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
