import React, { useState, useRef, useEffect, useMemo } from "react";

// --- Типы данных ---
type BlockShape = boolean[][];
type BlockPosition = { x: number; y: number };
type PlacedBlock = {
  id: number;
  shape: BlockShape;
  position: BlockPosition;
};

// --- Вспомогательные функции для трансформации блоков ---
const rotateBlock = (shape: BlockShape): BlockShape => {
  if (!shape || shape.length === 0) return [];
  const numRows = shape.length;
  const numCols = shape[0].length;
  const newShape: BlockShape = Array(numCols).fill(null).map(() => Array(numRows).fill(false));
  for (let y = 0; y < numRows; y++) {
    for (let x = 0; x < numCols; x++) {
      newShape[x][numRows - 1 - y] = shape[y][x];
    }
  }
  return newShape;
};

const flipBlock = (shape: BlockShape): BlockShape => {
  if (!shape) return [];
  return shape.map(row => [...row].reverse());
};

// --- Компоненты ---
const DraggableBlock = ({ shape, onBlockSelect }: { shape: BlockShape; onBlockSelect: (shape: BlockShape, e: React.MouseEvent) => void }) => {
  const blockWidth = shape[0]?.length || 1;

  return (
    <div
      className="cursor-move select-none transition-transform hover:scale-110 inline-block"
      onMouseDown={(e) => onBlockSelect(shape, e)}
    >
      <div 
        className="grid gap-0 border-2 border-blue-400 bg-blue-500/20"
        style={{ gridTemplateColumns: `repeat(${blockWidth}, 1fr)` }}
      >
        {shape.map((row, y) =>
          row.map((cell, x) => (
            <div
              key={`${x}-${y}`}
              className={`w-8 h-8 border border-blue-400 flex items-center justify-center ${cell ? "bg-blue-500" : "bg-transparent"}`}
            >
              {cell ? "■" : ""}
            </div>
          ))
        )}
      </div>
    </div>
  );
};


const Hub = ({ onBlockSelect }: { onBlockSelect: (shape: BlockShape, e: React.MouseEvent) => void }) => {
  const l_Block: BlockShape = [ // Малый часовой механизм
    [true, true, false],
    [true, true, true],
  ];
  const r_Block: BlockShape = [ // Средний часовой механизм
    [false, true, false, false],
    [true, true, true, false],
    [true, true, true, true],
    [true, true, true, false],
  ];
  const f_Block: BlockShape = [ // Ограничитель завода
    [true, true],
  ];

  return (
    <div className="bg-gray-800 p-4 rounded-lg flex flex-col items-center gap-6">
      <h2 className="text-xl font-semibold mb-2 text-center">Детали Ядра</h2>
      <p className="text-sm text-gray-400 -mt-6 mb-2 text-center">Перетащите деталь на сетку</p>
      
      <DraggableBlock shape={l_Block} onBlockSelect={onBlockSelect} />
      <DraggableBlock shape={r_Block} onBlockSelect={onBlockSelect} />
      <DraggableBlock shape={f_Block} onBlockSelect={onBlockSelect} />

      <div className="text-sm text-gray-400 mt-4 text-center">
        <p>Нажмите 'R' для поворота</p>
        <p>Нажмите 'F' для зеркала</p>
      </div>
    </div>
  );
};


// --- Основной компонент приложения ---
export default function App() {
  const GRID_SIZE = 6;
  const CELL_SIZE = 60; // px

  // --- Состояние (State) ---
  const [placedBlocks, setPlacedBlocks] = useState<PlacedBlock[]>([]);
  const [nextId, setNextId] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [activeBlockShape, setActiveBlockShape] = useState<BlockShape | null>(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [draggedBlockId, setDraggedBlockId] = useState<number | null>(null);
  const [previewPosition, setPreviewPosition] = useState<BlockPosition>({ x: -1, y: -1 });
  const [canPlace, setCanPlace] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const computedGrid = useMemo(() => {
    const grid: (number | null)[][] = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
    placedBlocks.forEach(block => {
      if (block.id === draggedBlockId) return;
      block.shape.forEach((row, dy) => {
        row.forEach((cell, dx) => {
          if (cell) {
            const y = block.position.y + dy;
            const x = block.position.x + dx;
            if (y < GRID_SIZE && x < GRID_SIZE) {
              grid[y][x] = block.id;
            }
          }
        });
      });
    });
    return grid;
  }, [placedBlocks, draggedBlockId]);

  const handleSelectBlockFromHub = (shape: BlockShape, e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setActiveBlockShape(shape);
    setDragOffset({ x: 0, y: 0 });
    setDragPosition({ x: e.clientX, y: e.clientY });
    setDraggedBlockId(null);
  };

  const handleMouseDownOnGrid = (e: React.MouseEvent) => {
    if (!gridRef.current) return;
    const rect = gridRef.current.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / CELL_SIZE);
    const y = Math.floor((e.clientY - rect.top) / CELL_SIZE);
    const blockId = computedGrid[y]?.[x];
    if (blockId) {
      const blockToDrag = placedBlocks.find(b => b.id === blockId);
      if (blockToDrag) {
        e.preventDefault();
        setIsDragging(true);
        setActiveBlockShape(blockToDrag.shape);
        setDraggedBlockId(blockToDrag.id);
        setDragPosition({ x: e.clientX, y: e.clientY });
        setDragOffset({
          x: (x - blockToDrag.position.x) * CELL_SIZE,
          y: (y - blockToDrag.position.y) * CELL_SIZE,
        });
      }
    }
  };

  useEffect(() => {
    if (!isDragging || !activeBlockShape) return;
    const handleGlobalMouseMove = (e: MouseEvent) => {
      setDragPosition({ x: e.clientX, y: e.clientY });
      if (!gridRef.current) return;
      const rect = gridRef.current.getBoundingClientRect();
      const gridX = Math.floor((e.clientX - rect.left - dragOffset.x) / CELL_SIZE);
      const gridY = Math.floor((e.clientY - rect.top - dragOffset.y) / CELL_SIZE);

      if (previewPosition.x !== gridX || previewPosition.y !== gridY) {
        setPreviewPosition({ x: gridX, y: gridY });
        let canPlaceBlock = true;
        for (let dy = 0; dy < activeBlockShape.length; dy++) {
          for (let dx = 0; dx < activeBlockShape[dy].length; dx++) {
            if (activeBlockShape[dy][dx]) {
              const newX = gridX + dx;
              const newY = gridY + dy;
              if (newX >= GRID_SIZE || newY >= GRID_SIZE || newX < 0 || newY < 0 ||
                  (computedGrid[newY]?.[newX] !== null && computedGrid[newY][newX] !== draggedBlockId)) {
                canPlaceBlock = false;
                break;
              }
            }
          }
          if (!canPlaceBlock) break;
        }
        setCanPlace(canPlaceBlock);
      }
    };
    const handleGlobalMouseUp = () => {
      if (canPlace && activeBlockShape) {
        if (draggedBlockId) {
          setPlacedBlocks(blocks => blocks.map(b => b.id === draggedBlockId ? { ...b, position: previewPosition, shape: activeBlockShape } : b));
        } else {
          setPlacedBlocks(blocks => [...blocks, { id: nextId, shape: activeBlockShape, position: previewPosition }]);
          setNextId(id => id + 1);
        }
      }
      setIsDragging(false);
      setActiveBlockShape(null);
      setDraggedBlockId(null);
      setPreviewPosition({ x: -1, y: -1 });
    };
    document.addEventListener("mousemove", handleGlobalMouseMove);
    document.addEventListener("mouseup", handleGlobalMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isDragging, activeBlockShape, dragOffset, computedGrid, nextId, placedBlocks, previewPosition, canPlace, draggedBlockId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isDragging || !activeBlockShape) return;
      if (e.key.toLowerCase() === 'r') {
        setActiveBlockShape(rotateBlock);
      } else if (e.key.toLowerCase() === 'f') {
        setActiveBlockShape(flipBlock);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDragging, activeBlockShape]);

  const clearGrid = () => setPlacedBlocks([]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      {isDragging && activeBlockShape && (
        <div
          className="fixed pointer-events-none z-50"
          style={{ left: dragPosition.x - dragOffset.x, top: dragPosition.y - dragOffset.y }}
        >
          <div
            className="grid gap-0 border-2 border-green-400 opacity-70"
            style={{
              gridTemplateColumns: `repeat(${activeBlockShape[0].length}, ${CELL_SIZE}px)`,
              gridTemplateRows: `repeat(${activeBlockShape.length}, ${CELL_SIZE}px)`,
            }}
          >
            {activeBlockShape.map((row, y) =>
              row.map((cell, x) => (
                <div
                  key={`${x}-${y}`}
                  className={`bg-green-500/50 ${cell ? "" : "opacity-0"}`}
                  style={{ width: `${CELL_SIZE}px`, height: `${CELL_SIZE}px` }}
                />
              ))
            )}
          </div>
        </div>
      )}
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Steam Sun — Тестовая сборка</h1>
        <div className="flex gap-8 items-start justify-center">
          <div className="bg-gray-800 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-center">Сетка ядра 6x6</h2>
            <div
              ref={gridRef}
              className="grid grid-cols-6 gap-0 border-2 border-gray-600 cursor-grab"
              onMouseDown={handleMouseDownOnGrid}
            >
              {Array.from({ length: GRID_SIZE }).map((_, y) =>
                Array.from({ length: GRID_SIZE }).map((_, x) => {
                  const blockId = computedGrid[y][x];
                  const isOccupied = blockId !== null;
                  const isPartOfPreview =
                    isDragging && activeBlockShape &&
                    x >= previewPosition.x && x < previewPosition.x + (activeBlockShape[0]?.length || 0) &&
                    y >= previewPosition.y && y < previewPosition.y + activeBlockShape.length &&
                    activeBlockShape[y - previewPosition.y]?.[x - previewPosition.x];

                  return (
                    <div
                      key={`${x}-${y}`}
                      className="relative flex items-center justify-center"
                      style={{ width: `${CELL_SIZE}px`, height: `${CELL_SIZE}px`, border: '1px solid #4A5568', backgroundColor: isOccupied ? '#4299E1' : '#2D3748' }}
                    >
                      {isOccupied && !draggedBlockId && <div className="absolute inset-0 bg-blue-500 flex items-center justify-center text-xs">■</div>}
                      {placedBlocks.map(block => {
                        if(block.id === draggedBlockId || block.id !== blockId) return null;
                        const localX = x - block.position.x;
                        const localY = y - block.position.y;
                        if(block.shape[localY]?.[localX]){
                          return <div key={`p-${block.id}`} className="absolute inset-0 bg-blue-500 flex items-center justify-center text-xs">■</div>
                        }
                        return null;
                      })}
                      {isPartOfPreview && <div className={`absolute inset-0 border-2 ${canPlace ? 'border-green-400 bg-green-500/30' : 'border-red-400 bg-red-500/30'}`}></div>}
                    </div>
                  );
                })
              )}
            </div>
            <button onClick={clearGrid} className="mt-4 w-full bg-red-600 hover:bg-red-700 px-4 py-2 rounded">
              Очистить сетку
            </button>
          </div>
          <Hub onBlockSelect={handleSelectBlockFromHub} />
        </div>
      </div>
    </div>
  );
}