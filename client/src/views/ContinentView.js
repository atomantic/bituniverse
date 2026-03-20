import React from "react";
import TerrainTileView from "./TerrainTileView";

export default function ContinentView({ onChildHover }) {
  return (
    <TerrainTileView
      level="sector"
      gridCols={20}
      gridRows={10}
      hexRadius={1.0}
      hexDepth={0.25}
      cameraHeight={30}
      noiseScale={0.07}
      noiseOctaves={5}
      heightScale={0.35}
      onChildHover={onChildHover}
    />
  );
}
