import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Suspense } from "react";
import Globe from "./Globe";
import CityConnections from "./CityConnections";

interface GlobeCanvasProps {
  showConnections?: boolean;
}

const GlobeCanvas = ({ showConnections = true }: GlobeCanvasProps) => {
  return (
    <Canvas
      camera={{ position: [0, 0, 4.8], fov: 30 }}
      style={{ background: "transparent" }}
      gl={{ alpha: true, antialias: true }}
    >
      <Suspense fallback={null}>
        {/* Lighting setup matching the original */}
        <pointLight position={[-2.5, 0, 3]} intensity={0.8} color="#0a1520" />
        <hemisphereLight
          color="#ffffbb"
          groundColor="#080820"
          intensity={0.4}
        />
        <ambientLight intensity={0.2} />
        
        <Globe />
        {showConnections && <CityConnections />}
        
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          enableRotate={true}
          autoRotate={true}
          autoRotateSpeed={0.8}
          enableDamping={true}
          dampingFactor={0.08}
          rotateSpeed={0.5}
        />
      </Suspense>
    </Canvas>
  );
};

export default GlobeCanvas;
