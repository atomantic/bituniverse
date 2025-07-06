import React, { useState, useEffect, useRef, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import CelestialBody from "./CelestialBody";
import ConnectionLine from "./ConnectionLine";
import { generateKeyPair } from "../../utils/helpers";
import socketIO from "../../io";

export default function SolarSystem({
  position,
  startKey,
  onSelectBody,
  orbitRadius,
  orbitSpeed,
}) {
  const [bodies, setBodies] = useState([]);
  const [hoveredBody, setHoveredBody] = useState(null);
  const systemRef = useRef();

  useEffect(() => {
    const newBodies = [];
    const numBodies = Math.floor(Math.random() * 5) + 3;
    for (let i = 0; i < numBodies; i++) {
      const type =
        Math.random() < 0.6 ? "star" : Math.random() < 0.8 ? "planet" : "moon";
      const bodyOrbitRadius = 1 + i * 0.5;
      const bodyOrbitSpeed = 0.5 + Math.random() * 0.5;
      const bodyKeyValue = BigInt(startKey) + BigInt(i);
      newBodies.push({
        position: [
          Math.cos(i) * bodyOrbitRadius,
          Math.sin(i * 0.5) * bodyOrbitRadius * 0.5,
          Math.sin(i) * bodyOrbitRadius,
        ],
        key: i,
        type,
        bodyOrbitRadius,
        bodyOrbitSpeed,
        keyValue: bodyKeyValue,
      });
    }
    setBodies(newBodies);
  }, [startKey]);

  useFrame((state) => {
    if (systemRef.current) {
      const time = state.clock.elapsedTime;
      systemRef.current.position.x = Math.cos(time * orbitSpeed) * orbitRadius;
      systemRef.current.position.z = Math.sin(time * orbitSpeed) * orbitRadius;
      systemRef.current.position.y = position[1];
    }
  });

  const handleBodyHover = useCallback(
    (body) => {
      setHoveredBody(body.key);
      if (!body.address) {
        const keyPair = generateKeyPair(body.keyValue);
        if (keyPair) {
          const updatedBody = { ...body, ...keyPair };
          setBodies((prev) =>
            prev.map((b) => (b.key === body.key ? updatedBody : b))
          );
          onSelectBody(updatedBody);
          socketIO.emit("lookupAddress", keyPair.address, (response) => {
            if (response.success) {
              const bodyWithBalance = {
                ...updatedBody,
                balance: response.data,
              };
              setBodies((prev) =>
                prev.map((b) => (b.key === body.key ? bodyWithBalance : b))
              );
              onSelectBody(bodyWithBalance);
            }
          });
        }
      } else {
        onSelectBody(body);
      }
    },
    [onSelectBody]
  );

  return (
    <group ref={systemRef}>
      {bodies.map((body, index) => {
        if (index < bodies.length - 1) {
          return (
            <ConnectionLine
              key={`line-${body.key}`}
              start={new THREE.Vector3(...body.position)}
              end={new THREE.Vector3(...bodies[index + 1].position)}
            />
          );
        }
        return null;
      })}
      {bodies.map((body) => (
        <CelestialBody
          key={body.key}
          position={body.position}
          onHover={() => handleBodyHover(body)}
          isSelected={hoveredBody === body.key}
          type={body.type}
        />
      ))}
    </group>
  );
}
