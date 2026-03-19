import React from "react";
import TerrainTileView from "./TerrainTileView";

export default function RegionView({ onChildHover }) {
  return (
    <TerrainTileView
      level="area"
      gridSize={20}
      cameraHeight={40}
      cameraAngle={-Math.PI / 2.5}
      noiseScale={0.06}
      noiseOctaves={5}
      heightScale={5}
      onChildHover={onChildHover}
    />
  );
}
