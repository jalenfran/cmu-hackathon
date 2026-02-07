import { useEffect, useRef, useCallback } from "react";

const PIXEL_SIZE = 25;

const PixelMosaic = () => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const generateGrid = useCallback(() => {
    const wrapper = wrapperRef.current;
    const gridContainer = gridRef.current;
    if (!wrapper || !gridContainer) return;

    gridContainer.innerHTML = "";

    const width = wrapper.clientWidth;
    const height = wrapper.clientHeight;

    const cols = Math.ceil(width / PIXEL_SIZE);
    const rows = Math.ceil(height / PIXEL_SIZE);

    gridContainer.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    gridContainer.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

    const totalPixels = cols * rows;
    const centerCol = cols / 2;
    const centerRow = rows / 2;
    const maxDist = Math.sqrt(Math.pow(centerCol, 2) + Math.pow(centerRow, 2));

    for (let i = 0; i < totalPixels; i++) {
      const pixel = document.createElement("div");
      pixel.className = "pixel";

      const currentColumn = i % cols;
      const currentRow = Math.floor(i / cols);

      const distX = Math.abs(currentColumn - centerCol);
      const distY = Math.abs(currentRow - centerRow);
      const distance = Math.sqrt(Math.pow(distX, 2) + Math.pow(distY, 2));

      // Vignette Logic
      let centerMask = 1 - distance / maxDist;
      centerMask = Math.max(0, centerMask);
      centerMask = Math.pow(centerMask, 2);

      // Noise Logic
      const noise = Math.pow(Math.random(), 3);

      // Combine
      const finalOpacity = noise * centerMask;

      pixel.style.opacity = String(finalOpacity);
      gridContainer.appendChild(pixel);
    }
  }, []);

  useEffect(() => {
    generateGrid();

    let resizeTimeout: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(generateGrid, 200);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimeout);
    };
  }, [generateGrid]);

  return (
    <div
      ref={wrapperRef}
      className="mosaic-wrapper relative w-[65%] h-full bg-black overflow-hidden"
    >
      {/* Gradient fade overlay */}
      <div
        className="absolute top-0 left-0 w-[250px] h-full z-10 pointer-events-none"
        style={{
          background:
            "linear-gradient(to right, hsl(var(--aegis-deep)) 0%, transparent 100%)",
        }}
      />
      <div
        ref={gridRef}
        className="grid w-full h-full gap-0"
      />
      <style>{`
        .pixel {
          background-color: hsl(var(--aegis-pixel));
          width: 100%;
          height: 100%;
          transition: opacity 0.5s ease;
        }
        .pixel:hover {
          opacity: 1 !important;
          box-shadow: 0 0 8px hsl(var(--aegis-pixel));
          z-index: 2;
          transition: 0s;
        }
      `}</style>
    </div>
  );
};

export default PixelMosaic;
