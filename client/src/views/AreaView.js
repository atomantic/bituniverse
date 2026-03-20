import React from "react";
import TerrainTileView from "./TerrainTileView";

export default function AreaView({ onChildHover }) {
  return (
    <TerrainTileView
      level="ground"
      gridCols={20}
      gridRows={10}
      hexRadius={0.8}
      hexDepth={0.12}
      cameraHeight={16}
      noiseScale={0.15}
      noiseOctaves={6}
      heightScale={0.1}
      onChildHover={onChildHover}
    />
  );
}
