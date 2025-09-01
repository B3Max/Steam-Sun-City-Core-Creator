import React, { useState, useRef, useEffect } from "react";

export default function App() {
  const [grid, setGrid] = useState<(string | null)[][]>(
    Array(6).fill(null).map(() => Array(6).fill(null))
  );
  
  const [draggedBlock, setDraggedBlock] = useState<boolean[][]>([
    [true, false],
    [true, false], 
    [true, true]
  ]);

  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [previewPosition, setPreviewPosition] = useState({ x: -1, y: -1 });
  const [canPlace, setCanPlace] = useState(false);
  
  const gridRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragPosition({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    setDragPosition({ x: e.clientX, y: e.clientY });
    
    // Находим позицию в сетке
    if (gridRef.current) {
      const rect = gridRef.current.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) / 60);
      const y = Math.floor((e.clientY - rect.top) / 60);
      
      if (x >= 0 && x < 6 && y >= 0 && y < 6) {
        setPreviewPosition({ x, y });
        
        // Проверяем, можно ли разместить блок
        let canPlaceBlock = true;
        for (let dy = 0; dy < draggedBlock.length; dy++) {
          for (let dx = 0; dx < draggedBlock[dy].length; dx++) {
            if (draggedBlock[dy][dx]) {
              const gridX = x + dx;
              const gridY = y + dy;
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
        setPreviewPosition({ x: -1, y: -1 });
        setCanPlace(false);
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    // Размещаем блок если можно
    if (canPlace && previewPosition.x >= 0 && previewPosition.y >= 0) {
      const newGrid = [...grid];
      for (let dy = 0; dy < draggedBlock.length; dy++) {
        for (let dx = 0; dx < draggedBlock[dy].length; dx++) {
          if (draggedBlock[dy][dx]) {
            const gridX = previewPosition.x + dx;
            const gridY = previewPosition.y + dy;
            newGrid[gridY][gridX] = "block";
          }
        }
      }
      setGrid(newGrid);
    }
    
    setPreviewPosition({ x: -1, y: -1 });
    setCanPlace(false);
  };

  // Глобальные обработчики мыши для перетаскивания
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setDragPosition({ x: e.clientX, y: e.clientY });
      
      if (gridRef.current) {
        const rect = gridRef.current.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / 60);
        const y = Math.floor((e.clientY - rect.top) / 60);
        
        if (x >= 0 && x < 6 && y >= 0 && y < 6) {
          setPreviewPosition({ x, y });
          
          let canPlaceBlock = true;
          for (let dy = 0; dy < draggedBlock.length; dy++) {
            for (let dx = 0; dx < draggedBlock[dy].length; dx++) {
              if (draggedBlock[dy][dx]) {
                const gridX = x + dx;
                const gridY = y + dy;
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
          setPreviewPosition({ x: -1, y: -1 });
          setCanPlace(false);
        }
      }
    };

    const handleGlobalMouseUp = () => {
      if (!isDragging) return;
      
      setIsDragging(false);
      
      if (canPlace && previewPosition.x >= 0 && previewPosition.y >= 0) {
        const newGrid = [...grid];
        for (let dy = 0; dy < draggedBlock.length; dy++) {
          for (let dx = 0; dx < draggedBlock[dy].length; dx++) {
            if (draggedBlock[dy][dx]) {
              const gridX = previewPosition.x + dx;
              const gridY = previewPosition.y + dy;
              newGrid[gridY][gridX] = "block";
            }
          }
        }
        setGrid(newGrid);
      }
      
      setPreviewPosition({ x: -1, y: -1 });
      setCanPlace(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, canPlace, previewPosition, draggedBlock, grid]);

  // Функция для очистки сетки
  const clearGrid = () => {
    setGrid(Array(6).fill(null).map(() => Array(6).fill(null)));
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Steam Sun — Тестовая сборка</h1>
        
        <div className="flex gap-8 items-start justify-center">
          {/* Сетка 6x6 */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-center">Сетка ядра 6x6</h2>
            <div 
              ref={gridRef}
              className="grid grid-cols-6 gap-0 border-2 border-gray-600 relative"
            >
              {grid.map((row, y) => 
                row.map((cell, x) => (
                  <div
                    key={`${x}-${y}`}
                    className={`
                      w-15 h-15 border border-gray-600 flex items-center justify-center relative
                      ${cell === "block" ? "bg-blue-500" : "bg-gray-700"}
                    `}
                    style={{ width: '60px', height: '60px' }}
                  >
                    {cell === "block" ? "■" : ""}
                    
                    {/* Предварительный просмотр блока */}
                    {previewPosition.x >= 0 && previewPosition.y >= 0 && 
                     x >= previewPosition.x && x < previewPosition.x + draggedBlock[0].length &&
                     y >= previewPosition.y && y < previewPosition.y + draggedBlock.length &&
                     draggedBlock[y - previewPosition.y] && draggedBlock[y - previewPosition.y][x - previewPosition.x] && (
                      <div className={`absolute inset-0 border-2 ${canPlace ? 'border-green-400 bg-green-500/30' : 'border-red-400 bg-red-500/30'}`}>
                        {canPlace ? "✓" : "✗"}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            
            <button 
              onClick={clearGrid}
              className="mt-4 w-full bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
            >
              Очистить сетку
            </button>
          </div>

          {/* Интерактивный L-блок */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-center">L-блок для теста</h2>
            <div 
              className={`cursor-move select-none transition-transform ${isDragging ? 'scale-110' : ''}`}
              onMouseDown={handleMouseDown}
            >
              <div className="grid grid-cols-2 gap-0 border-2 border-blue-400 bg-blue-500/20">
                {draggedBlock.map((row, y) => 
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
            <p className="text-sm text-gray-400 mt-2 text-center">
              Перетащите мышкой на сетку
            </p>
            
            {/* Индикатор состояния */}
            {isDragging && (
              <div className="mt-4 p-2 bg-gray-700 rounded text-center">
                <div className="text-sm">
                  {canPlace ? (
                    <span className="text-green-400">✓ Можно разместить</span>
                  ) : (
                    <span className="text-red-400">✗ Нельзя разместить</span>
                  )}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Позиция: ({previewPosition.x}, {previewPosition.y})
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
