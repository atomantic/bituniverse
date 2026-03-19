import React from "react";
import TerrainTileView from "./TerrainTileView";

export default function AreaView({ onChildHover }) {
  return (
    <TerrainTileView
      level="ground"
      gridSize={20}
      cameraHeight={25}
      cameraAngle={-Math.PI / 3}
      noiseScale={0.1}
      noiseOctaves={6}
      heightScale={3}
      onChildHover={onChildHover}
    />
  );
}
