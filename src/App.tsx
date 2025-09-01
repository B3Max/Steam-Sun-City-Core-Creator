import React, { useState, useRef, useEffect } from "react";

// Define the shape of a block as a 2D boolean array
type BlockShape = boolean[][];

// --- Reusable Components ---

// Component for a single draggable block in the hub
const DraggableBlock = ({ shape, onBlockSelect }: { shape: BlockShape, onBlockSelect: (shape: BlockShape, e: React.MouseEvent) => void }) => (
  <div
    className="cursor-move select-none transition-transform hover:scale-110"
    onMouseDown={(e) => onBlockSelect(shape, e)}
  >
    <div className="grid grid-cols-2 gap-0 border-2 border-blue-400 bg-blue-500/20">
      {shape.map((row, y) =>
        row.map((cell, x) => (
          <div
            key={`${x}-${y}`}
            className={`
              w-8 h-8 border border-blue-400 flex items-center justify-center
              ${cell ? "bg-blue-500" : "bg-transparent"}
            `}
          >
            {cell ? "■" : ""}
          </div>
        ))
      )}
    </div>
  </div>
);

// The Hub that contains all available blocks
const Hub = ({ onBlockSelect }: { onBlockSelect: (shape: BlockShape, e: React.MouseEvent) => void }) => {
  // Define all available block shapes here
  const l_Block: BlockShape = [
    [true, false],
    [true, false],
    [true, true]
  ];

  // We can add more blocks here in the future
  // const another_Block: BlockShape = [[true, true], [true, true]];

  return (
    <div className="bg-gray-800 p-4 rounded-lg flex flex-col items-center gap-6">
      <h2 className="text-xl font-semibold mb-2 text-center">Детали Ядра</h2>
      <p className="text-sm text-gray-400 -mt-6 mb-2 text-center">
        Перетащите деталь на сетку
      </p>
      
      {/* Render each block available in the hub */}
      <DraggableBlock shape={l_Block} onBlockSelect={onBlockSelect} />
      {/* <DraggableBlock shape={another_Block} onBlockSelect={onBlockSelect} /> */}
    </div>
  );
};


// --- Main App Component ---

export default function App() {
  // State for the main 6x6 grid
  const [grid, setGrid] = useState<(string | null)[][]>(
    Array(6).fill(null).map(() => Array(6).fill(null))
  );
  
  // State for the block currently being dragged
  const [activeBlockShape, setActiveBlockShape] = useState<BlockShape | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  
  // State for the preview on the grid
  const [previewPosition, setPreviewPosition] = useState({ x: -1, y: -1 });
  const [canPlace, setCanPlace] = useState(false);
  
  const gridRef = useRef<HTMLDivElement>(null);

  // --- Drag and Drop Logic ---

  // Called when a block from the hub is first clicked
  const handleMouseDownOnBlock = (shape: BlockShape, e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setActiveBlockShape(shape);
    setDragPosition({ x: e.clientX, y: e.clientY });
  };

  // This useEffect now handles all logic while a block is being dragged
  useEffect(() => {
    if (!isDragging || !activeBlockShape) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      // Update the position of the "levitating" block
      setDragPosition({ x: e.clientX, y: e.clientY });
      
      // Check for grid placement preview
      if (gridRef.current) {
        const rect = gridRef.current.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / 60);
        const y = Math.floor((e.clientY - rect.top) / 60);
        
        // Check if the cursor is within the grid bounds
        if (x >= 0 && x < 6 && y >= 0 && y < 6) {
          setPreviewPosition({ x, y });
          
          let canPlaceBlock = true;
          for (let dy = 0; dy < activeBlockShape.length; dy++) {
            for (let dx = 0; dx < activeBlockShape[dy].length; dx++) {
              if (activeBlockShape[dy][dx]) {
                const gridX = x + dx;
                const gridY = y + dy;
                // Check if the block is out of bounds or overlaps with an existing block
                if (gridX >= 6 || gridY >= 6 || grid[gridY][gridX] !== null) {
                  canPlaceBlock = false;
                  break;
                }
              }
            }
            if (!canPlaceBlock) break;
          }
          setCanPlace(canPlaceBlock);
        } else {
          // If outside the grid, hide the preview
          setPreviewPosition({ x: -1, y: -1 });
          setCanPlace(false);
        }
      }
    };

    const handleGlobalMouseUp = () => {
      // Place the block on the grid if the position is valid
      if (canPlace && previewPosition.x !== -1 && activeBlockShape) {
        const newGrid = grid.map(row => [...row]);
        for (let dy = 0; dy < activeBlockShape.length; dy++) {
          for (let dx = 0; dx < activeBlockShape[dy].length; dx++) {
            if (activeBlockShape[dy][dx]) {
              newGrid[previewPosition.y + dy][previewPosition.x + dx] = "block";
            }
          }
        }
        setGrid(newGrid);
      }
      
      // Reset all dragging-related state
      setIsDragging(false);
      setActiveBlockShape(null);
      setPreviewPosition({ x: -1, y: -1 });
      setCanPlace(false);
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, activeBlockShape, grid, canPlace, previewPosition]); // Dependency array

  const clearGrid = () => {
    setGrid(Array(6).fill(null).map(() => Array(6).fill(null)));
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      {/* This is the LEVITATING block that follows the mouse */}
      {isDragging && activeBlockShape && (
        <div
          className="fixed pointer-events-none z-50"
          style={{
            left: dragPosition.x,
            top: dragPosition.y,
            transform: 'translate(-50%, -50%)', // Center the block on the cursor
          }}
        >
          <div className="grid grid-cols-2 gap-0 border-2 border-green-400">
            {activeBlockShape.map((row, y) =>
              row.map((cell, x) => (
                <div
                  key={`${x}-${y}`}
                  className={`w-15 h-15 ${cell ? 'bg-green-500/50' : 'bg-transparent'}`}
                  style={{ width: '60px', height: '60px' }}
                />
              ))
            )}
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Steam Sun — Тестовая сборка</h1>
        
        <div className="flex gap-8 items-start justify-center">
          {/* Grid Area */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-center">Сетка ядра 6x6</h2>
            <div 
              ref={gridRef}
              className="grid grid-cols-6 gap-0 border-2 border-gray-600"
            >
              {grid.map((row, y) => 
                row.map((cell, x) => (
                  <div
                    key={`${x}-${y}`}
                    className={`w-15 h-15 border border-gray-600 flex items-center justify-center relative ${cell ? "bg-blue-500" : "bg-gray-700"}`}
                    style={{ width: '60px', height: '60px' }}
                  >
                    {/* Preview overlay on the grid */}
                    {previewPosition.x !== -1 && activeBlockShape &&
                     x >= previewPosition.x && x < previewPosition.x + activeBlockShape[0].length &&
                     y >= previewPosition.y && y < previewPosition.y + activeBlockShape.length &&
                     activeBlockShape[y - previewPosition.y]?.[x - previewPosition.x] && (
                      <div className={`absolute inset-0 border-2 ${canPlace ? 'border-green-400 bg-green-500/30' : 'border-red-400 bg-red-500/30'}`}>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            <button onClick={clearGrid} className="mt-4 w-full bg-red-600 hover:bg-red-700 px-4 py-2 rounded">
              Очистить сетку
            </button>
          </div>

          {/* Hub Area */}
          <Hub onBlockSelect={handleMouseDownOnBlock} />
        </div>
      </div>
    </div>
  );
}