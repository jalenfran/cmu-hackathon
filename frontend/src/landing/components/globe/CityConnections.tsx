import { useRef, useMemo, useEffect, useState } from "react";
import { Group, Vector3, QuadraticBezierCurve3, BufferGeometry, Float32BufferAttribute } from "three";
import { useFrame } from "@react-three/fiber";
import { latLngToVector3, getRandomCities, City } from "../../data/cities";

interface Connection {
  from: City;
  to: City;
  curve: QuadraticBezierCurve3;
}

const CityConnections = () => {
  const groupRef = useRef<Group>(null);
  const [activeCities, setActiveCities] = useState<City[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  
  // Initialize random cities and connections
  useEffect(() => {
    const cities = getRandomCities(10);
    setActiveCities(cities);
    
    // Create connections between cities
    const newConnections: Connection[] = [];
    for (let i = 0; i < cities.length; i++) {
      // Connect to 2-3 other random cities
      const connectCount = Math.floor(Math.random() * 2) + 2;
      for (let j = 0; j < connectCount; j++) {
        const targetIndex = (i + j + 1) % cities.length;
        const from = cities[i];
        const to = cities[targetIndex];
        
        const startPos = latLngToVector3(from.lat, from.lng, 1.02);
        const endPos = latLngToVector3(to.lat, to.lng, 1.02);
        
        const start = new Vector3(...startPos);
        const end = new Vector3(...endPos);
        
        // Calculate midpoint elevated above the sphere
        const mid = new Vector3().addVectors(start, end).multiplyScalar(0.5);
        const elevation = 1.3 + mid.length() * 0.3;
        mid.normalize().multiplyScalar(elevation);
        
        const curve = new QuadraticBezierCurve3(start, mid, end);
        
        newConnections.push({ from, to, curve });
      }
    }
    setConnections(newConnections);
  }, []);
  
  // City node positions
  const cityNodes = useMemo(() => {
    const geometry = new BufferGeometry();
    const positions: number[] = [];
    
    activeCities.forEach((city) => {
      const pos = latLngToVector3(city.lat, city.lng, 1.02);
      positions.push(...pos);
    });
    
    geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
    return geometry;
  }, [activeCities]);
  
  // Animated connection lines
  const [animProgress, setAnimProgress] = useState(0);
  
  useFrame((_, delta) => {
    setAnimProgress((prev) => (prev + delta * 0.3) % 1);
  });
  
  return (
    <group ref={groupRef}>
      {/* City nodes */}
      <points geometry={cityNodes}>
        <pointsMaterial
          color="#ffffff"
          size={0.04}
          transparent
          opacity={1}
          sizeAttenuation
        />
      </points>
      
      {/* Glowing city halos */}
      {activeCities.map((city, i) => {
        const pos = latLngToVector3(city.lat, city.lng, 1.02);
        return (
          <mesh key={`halo-${i}`} position={pos}>
            <ringGeometry args={[0.02, 0.035, 16]} />
            <meshBasicMaterial
              color="#ffffff"
              transparent
              opacity={0.4}
            />
          </mesh>
        );
      })}
      
      {/* Connection arcs */}
      {connections.map((conn, i) => {
        const points = conn.curve.getPoints(50);
        const positions = new Float32Array(points.length * 3);
        points.forEach((p, idx) => {
          positions[idx * 3] = p.x;
          positions[idx * 3 + 1] = p.y;
          positions[idx * 3 + 2] = p.z;
        });
        
        const geometry = new BufferGeometry();
        geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
        
        return (
          <line key={`arc-${i}`}>
            <bufferGeometry attach="geometry">
              <bufferAttribute
                attach="attributes-position"
                args={[positions, 3]}
                count={positions.length / 3}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial
              color="#ffffff"
              transparent
              opacity={0.3}
              linewidth={1}
            />
          </line>
        );
      })}
      
      {/* Animated pulse points along connections */}
      {connections.map((conn, i) => {
        const progress = (animProgress + i * 0.1) % 1;
        const point = conn.curve.getPoint(progress);
        
        return (
          <mesh key={`pulse-${i}`} position={[point.x, point.y, point.z]}>
            <sphereGeometry args={[0.015, 8, 8]} />
            <meshBasicMaterial
              color="#ffffff"
              transparent
              opacity={0.8}
            />
          </mesh>
        );
      })}
    </group>
  );
};

export default CityConnections;
