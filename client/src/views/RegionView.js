import React from "react";
import TerrainTileView from "./TerrainTileView";

export default function RegionView({ onChildHover }) {
  return (
    <TerrainTileView
      level="area"
      gridCols={20}
      gridRows={10}
      hexRadius={0.9}
      hexDepth={0.18}
      cameraHeight={22}
      noiseScale={0.1}
      noiseOctaves={6}
      heightScale={0.2}
      onChildHover={onChildHover}
    />
  );
}
