import React from "react";
import TerrainTileView from "./TerrainTileView";

export default function ContinentView({ onChildHover }) {
  return (
    <TerrainTileView
      level="sector"
      gridSize={20}
      cameraHeight={60}
      cameraAngle={-Math.PI / 2.2}
      noiseScale={0.03}
      noiseOctaves={4}
      heightScale={8}
      onChildHover={onChildHover}
    />
  );
}
