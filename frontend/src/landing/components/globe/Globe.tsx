import { useRef, useMemo, useEffect, useState } from "react";
import { Group, ShaderMaterial, CircleGeometry, Vector3 } from "three";
import { useFrame } from "@react-three/fiber";

const vertexShader = `
  uniform float u_time;
  uniform float u_maxExtrusion;
  
  void main() {
    vec3 newPosition = position;
    if(u_maxExtrusion > 1.0) {
      newPosition.xyz = newPosition.xyz * u_maxExtrusion + sin(u_time) * 0.02;
    } else {
      newPosition.xyz = newPosition.xyz * u_maxExtrusion;
    }
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

const fragmentShader = `
  uniform float u_time;
  
  vec3 colorA = vec3(0.6, 0.6, 0.6);  // Dimmer white/gray
  vec3 colorB = vec3(0.35, 0.35, 0.35); // Darker muted gray
  
  void main() {
    vec3 color = vec3(0.0);
    float pct = abs(sin(u_time));
    color = mix(colorA, colorB, pct);
    gl_FragColor = vec4(color, 1.0);
  }
`;

interface DotData {
  position: Vector3;
  timeOffset: number;
}

const Globe = () => {
  const groupRef = useRef<Group>(null);
  const [dots, setDots] = useState<DotData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const materialsRef = useRef<ShaderMaterial[]>([]);
  const twinkleTime = 0.03;
  const dotSphereRadius = 1;

  // Load world map and generate dots
  useEffect(() => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      
      const context = canvas.getContext('2d');
      if (!context) return;
      
      context.drawImage(image, 0, 0);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // Parse image data to find land coordinates
      // For this image, land is darker (oceans are blue/bright)
      const activeLatLon: { [key: number]: number[] } = {};
      const width = canvas.width;
      const height = canvas.height;
      
      for (let y = 0; y < height; y++) {
        const lat = 90 - (y / height) * 180;
        const latKey = Math.round(lat);
        
        if (!activeLatLon[latKey]) activeLatLon[latKey] = [];
        
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4;
          const red = imageData.data[i];
          const green = imageData.data[i + 1];
          const blue = imageData.data[i + 2];
          
          // Detect land: areas that are NOT predominantly blue (ocean)
          // Land has more balanced RGB or is greenish/brownish
          const isOcean = blue > red + 20 && blue > green + 10;
          const isLand = !isOcean && (red > 30 || green > 30);
          
          if (isLand) {
            const lon = (x / width) * 360 - 180;
            activeLatLon[latKey].push(Math.round(lon));
          }
        }
      }
      
      // Generate dots based on parsed data
      const newDots: DotData[] = [];
      const dotDensity = 2.5;
      
      const calcPosFromLatLonRad = (lon: number, lat: number): Vector3 => {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lon + 180) * (Math.PI / 180);
        
        const x = -(dotSphereRadius * Math.sin(phi) * Math.cos(theta));
        const z = (dotSphereRadius * Math.sin(phi) * Math.sin(theta));
        const y = (dotSphereRadius * Math.cos(phi));
        
        return new Vector3(x, y, z);
      };
      
      const visibilityForCoordinate = (lon: number, lat: number): boolean => {
        const latKey = Math.round(lat);
        if (!activeLatLon[latKey] || !activeLatLon[latKey].length) return false;
        
        const closest = activeLatLon[latKey].reduce((prev, curr) => {
          return Math.abs(curr - lon) < Math.abs(prev - lon) ? curr : prev;
        });
        
        return Math.abs(lon - closest) < 2;
      };
      
      // Reduced density: larger lat step and fewer dots per latitude
      for (let lat = 90, i = 0; lat > -90; lat -= 1.8, i++) {
        const radius = Math.cos(Math.abs(lat) * (Math.PI / 180)) * dotSphereRadius;
        const circumference = radius * Math.PI * 2;
        const dotsForLat = Math.max(1, circumference * dotDensity * 22);
        
        for (let x = 0; x < dotsForLat; x++) {
          const lon = -180 + x * 360 / dotsForLat;
          
          if (!visibilityForCoordinate(lon, lat)) continue;
          
          const position = calcPosFromLatLonRad(lon, lat);
          newDots.push({
            position,
            timeOffset: i * Math.sin(Math.random())
          });
        }
      }
      
      setDots(newDots);
      setIsLoading(false);
    };
    
    image.onerror = () => {
      console.log("Failed to load world map, using procedural fallback");
      generateProceduralDots();
      setIsLoading(false);
    };
    
    image.src = "/images/world_map.jpg";
  }, []);
  
  const generateProceduralDots = () => {
    const newDots: DotData[] = [];
    const dotCount = 3000;
    const phi = Math.PI * (3 - Math.sqrt(5));
    
    for (let i = 0; i < dotCount; i++) {
      const y = 1 - (i / (dotCount - 1)) * 2;
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = phi * i;
      
      const x = Math.cos(theta) * radiusAtY * dotSphereRadius;
      const z = Math.sin(theta) * radiusAtY * dotSphereRadius;
      
      if (Math.random() > 0.3) {
        newDots.push({
          position: new Vector3(x, y * dotSphereRadius, z),
          timeOffset: i * Math.sin(Math.random())
        });
      }
    }
    
    setDots(newDots);
  };
  
  // Create shader materials for dots
  const dotMeshes = useMemo(() => {
    materialsRef.current = [];
    
    return dots.map((dot, index) => {
      const material = new ShaderMaterial({
        uniforms: {
          u_time: { value: dot.timeOffset },
          u_maxExtrusion: { value: 1.0 }
        },
        vertexShader,
        fragmentShader,
        transparent: true,
      });
      
      materialsRef.current.push(material);
      
      const geometry = new CircleGeometry(0.006, 5);
      geometry.lookAt(dot.position);
      geometry.translate(dot.position.x, dot.position.y, dot.position.z);
      
      return { geometry, material, key: index };
    });
  }, [dots]);
  
  useFrame(() => {
    materialsRef.current.forEach(mat => {
      mat.uniforms.u_time.value += twinkleTime;
    });
  });
  
  return (
    <group ref={groupRef}>
      {/* Base sphere */}
      <mesh>
        <sphereGeometry args={[0.975, 35, 35]} />
        <meshStandardMaterial
          color="#0a0a0a"
          transparent
          opacity={0.95}
        />
      </mesh>
      
      {/* Loading indicator */}
      {isLoading && (
        <mesh>
          <ringGeometry args={[0.3, 0.35, 32]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.3} />
        </mesh>
      )}
      
      {/* Dot meshes */}
      {dotMeshes.map(({ geometry, material, key }) => (
        <mesh key={key} geometry={geometry} material={material} />
      ))}
      
      {/* Subtle outer glow ring */}
      <mesh>
        <ringGeometry args={[1.01, 1.02, 64]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.03}
        />
      </mesh>
    </group>
  );
};

export default Globe;
