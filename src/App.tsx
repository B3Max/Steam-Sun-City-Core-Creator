import React, { useState, useRef, useEffect, useMemo } from "react";

// --- Типы данных ---
type BlockShape = boolean[][];
type BlockPosition = { x: number; y: number };
type PlacedBlock = {
  id: number;
  shape: BlockShape;
  position: BlockPosition;
};

// --- Компоненты (без изменений) ---
const DraggableBlock = ({ shape, onBlockSelect }: { shape: BlockShape; onBlockSelect: (shape: BlockShape, e: React.MouseEvent) => void }) => (
  <div
    className="cursor-move select-none transition-transform hover:scale-110"
    onMouseDown={(e) => onBlockSelect(shape, e)}
  >
    <div className="grid grid-cols-2 gap-0 border-2 border-blue-400 bg-blue-500/20">
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

const Hub = ({ onBlockSelect }: { onBlockSelect: (shape: BlockShape, e: React.MouseEvent) => void }) => {
  const l_Block: BlockShape = [
    [true, false],
    [true, false],
    [true, true],
  ];
  return (
    <div className="bg-gray-800 p-4 rounded-lg flex flex-col items-center gap-6">
      <h2 className="text-xl font-semibold mb-2 text-center">Детали Ядра</h2>
      <p className="text-sm text-gray-400 -mt-6 mb-2 text-center">Перетащите деталь на сетку</p>
      <DraggableBlock shape={l_Block} onBlockSelect={onBlockSelect} />
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

  // Состояние перетаскивания
  const [isDragging, setIsDragging] = useState(false);
  const [activeBlockShape, setActiveBlockShape] = useState<BlockShape | null>(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 }); // Позиция курсора на экране
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 }); // Смещение курсора внутри блока
  const [draggedBlockId, setDraggedBlockId] = useState<number | null>(null); // ID блока, который двигаем с сетки

  // Состояние предпросмотра на сетке
  const [previewPosition, setPreviewPosition] = useState<BlockPosition>({ x: -1, y: -1 });
  const [canPlace, setCanPlace] = useState(false);
  
  const gridRef = useRef<HTMLDivElement>(null);

  // --- "Вычисляемая" сетка ---
  // Создаем виртуальную сетку на основе placedBlocks для проверок и рендеринга.
  // useMemo кэширует результат, чтобы не пересчитывать на каждый рендер.
  const computedGrid = useMemo(() => {
    const grid: (number | null)[][] = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
    placedBlocks.forEach(block => {
      // Не отображаем блок, который мы сейчас тащим
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

  // --- Логика Drag and Drop ---

  // 1. Кликнули на блок в ХАБЕ
  const handleSelectBlockFromHub = (shape: BlockShape, e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setActiveBlockShape(shape);
    setDragOffset({ x: 0, y: 0 }); // Новый блок всегда тащится за угол
    setDragPosition({ x: e.clientX, y: e.clientY });
    setDraggedBlockId(null); // Это новый блок, у него еще нет ID
  };

  // 2. Кликнули на СЕТКУ (чтобы подвинуть существующий блок)
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
        // Запоминаем смещение клика относительно угла блока
        setDragOffset({
          x: (x - blockToDrag.position.x) * CELL_SIZE,
          y: (y - blockToDrag.position.y) * CELL_SIZE,
        });
      }
    }
  };

  // 3. Глобальный обработчик движения и отпускания мыши
  useEffect(() => {
    if (!isDragging || !activeBlockShape) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      setDragPosition({ x: e.clientX, y: e.clientY });

      if (gridRef.current) {
        const rect = gridRef.current.getBoundingClientRect();
        // Рассчитываем позицию угла блока на сетке, учитывая смещение
        const gridX = Math.floor((e.clientX - rect.left - dragOffset.x) / CELL_SIZE);
        const gridY = Math.floor((e.clientY - rect.top - dragOffset.y) / CELL_SIZE);

        if (previewPosition.x !== gridX || previewPosition.y !== gridY) {
           setPreviewPosition({ x: gridX, y: gridY });

          // Проверка, можно ли разместить блок
          let canPlaceBlock = true;
          for (let dy = 0; dy < activeBlockShape.length; dy++) {
            for (let dx = 0; dx < activeBlockShape[dy].length; dx++) {
              if (activeBlockShape[dy][dx]) {
                const newX = gridX + dx;
                const newY = gridY + dy;
                if (newX >= GRID_SIZE || newY >= GRID_SIZE || newX < 0 || newY < 0 || computedGrid[newY][newX] !== null) {
                  canPlaceBlock = false;
                  break;
                }
              }
            }
            if (!canPlaceBlock) break;
          }
          setCanPlace(canPlaceBlock);
        }
      }
    };

    const handleGlobalMouseUp = () => {
      if (canPlace) {
        if (draggedBlockId) {
          // Мы двигали существующий блок -> обновляем его позицию
          setPlacedBlocks(blocks => blocks.map(b => b.id === draggedBlockId ? { ...b, position: previewPosition } : b));
        } else {
          // Мы ставили новый блок -> добавляем его в массив
          setPlacedBlocks(blocks => [...blocks, { id: nextId, shape: activeBlockShape, position: previewPosition }]);
          setNextId(id => id + 1);
        }
      }

      // Сброс состояния перетаскивания
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

  const clearGrid = () => {
    setPlacedBlocks([]);
  };

  // --- Рендеринг ---
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      {/* Левитирующий блок */}
      {isDragging && activeBlockShape && (
        <div
          className="fixed pointer-events-none z-50"
          style={{
            left: dragPosition.x - dragOffset.x,
            top: dragPosition.y - dragOffset.y,
          }}
        >
          <div className="grid grid-cols-2 gap-0 border-2 border-green-400 opacity-70">
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
          
          {/* Сетка */}
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
                  
                  // Логика для предпросмотра
                  const isPartOfPreview = 
                    isDragging && activeBlockShape &&
                    x >= previewPosition.x && x < previewPosition.x + activeBlockShape[0].length &&
                    y >= previewPosition.y && y < previewPosition.y + activeBlockShape.length &&
                    activeBlockShape[y - previewPosition.y]?.[x - previewPosition.x];

                  return (
                    <div
                      key={`${x}-${y}`}
                      className={`relative flex items-center justify-center 
                        ${isOccupied ? "bg-blue-500" : "bg-gray-700 hover:bg-gray-600"}
                      `}
                      style={{ width: `${CELL_SIZE}px`, height: `${CELL_SIZE}px`, border: '1px solid #4A5568' }}
                    >
                      {isPartOfPreview && (
                        <div className={`absolute inset-0 border-2 ${canPlace ? 'border-green-400 bg-green-500/30' : 'border-red-400 bg-red-500/30'}`}></div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            <button onClick={clearGrid} className="mt-4 w-full bg-red-600 hover:bg-red-700 px-4 py-2 rounded">
              Очистить сетку
            </button>
          </div>

          {/* Хаб */}
          <Hub onBlockSelect={handleSelectBlockFromHub} />
        </div>
      </div>
    </div>
  );
}