import React, { useState, useRef, useEffect, useMemo } from "react";

// --- Типы данных ---
type BlockShape = boolean[][];
type BlockPosition = { x: number; y: number };
type TextureAnchor = { x: number; y: number }; // в пикселях исходной текстуры (базовая ориентация)

type PlacedBlock = {
  id: number;
  shape: BlockShape;
  position: BlockPosition;
  texture?: string | null;
  rotationDeg: 0 | 90 | 180 | 270;
  flippedX: boolean;
  textureBaseWidth: number;  // ширина блока при создании (в клетках)
  textureBaseHeight: number; // высота блока при создании (в клетках)
  texturePixelsPerCell: number; // сколько пикселей текстуры соответствует 1 клетке
  textureAnchor: TextureAnchor; // якорь текстуры (левый-верх сетки)
};

type PaletteItem = {
  shape: BlockShape;
  texture: string | null;
  texturePixelsPerCell?: number;
  textureAnchor?: TextureAnchor;
};

type DraggableBlockProps = {
  item: PaletteItem;
  onBlockSelect: (shape: BlockShape, e: React.MouseEvent, texture: string | null, meta: { ppc: number; anchor: TextureAnchor }) => void;
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

function getTextureTransform(baseW: number, baseH: number, cell: number, rotationDeg: 0 | 90 | 180 | 270, flipped: boolean) {
  const Wpx = baseW * cell;
  const Hpx = baseH * cell;

  let tx = 0;
  let ty = 0;

  if (!flipped) {
    switch (rotationDeg) {
      case 90: tx = Hpx; break;
      case 180: tx = Wpx; ty = Hpx; break;
      case 270: ty = Wpx; break;
    }
  } else {
    // Смещения, рассчитанные для порядка "сначала rotate, потом scale"
    switch (rotationDeg) {
      case 0:
        tx = Wpx;
        break;
      case 90:
        // Сдвиг не нужен
        break;
      case 180:
        ty = Hpx;
        break;
      case 270:
        tx = Hpx;
        ty = Wpx;
        break;
    }
  }
  return { tx, ty };
}

function buildImageTransform(baseW: number, baseH: number, cell: number, rotationDeg: 0 | 90 | 180 | 270, flippedX: boolean, anchorPx: TextureAnchor, scalePx: number) {
  const { tx, ty } = getTextureTransform(baseW, baseH, cell, rotationDeg, flippedX);
  
  const scaleXValue = flippedX ? -1 : 1;

  // Порядок: scaleX применяется ПОСЛЕ rotate, что дает "отражение вида с экрана"
  return `translate(${tx}px, ${ty}px) scale(${scaleXValue}, 1) rotate(${rotationDeg}deg) scale(${scalePx}) translate(${-anchorPx.x}px, ${-anchorPx.y}px)`;
}

// --- Компоненты ---
const DraggableBlock: React.FC<DraggableBlockProps> = ({ item, onBlockSelect }) => {
  const blockWidth = item.shape[0]?.length || 1;
  const blockHeight = item.shape.length || 1;
  const CELL = 40;
  const ppc = item.texturePixelsPerCell ?? 60; // по умолчанию 60px на клетку
  const anchor = item.textureAnchor ?? { x: 0, y: 0 };
  const scalePx = CELL / ppc;

  return (
    <div
      className="cursor-move select-none transition-transform hover:scale-150 inline-block"
      onMouseDown={(e) => onBlockSelect(item.shape, e, item.texture, { ppc, anchor })}
    >
      <div
        className="grid gap-0 border-2 border-blue-400 bg-gray-700"
        style={{ gridTemplateColumns: `repeat(${blockWidth}, ${CELL}px)` }}
      >
        {item.shape.map((row, y) =>
          row.map((cell, x) => (
            <div key={`${x}-${y}`} style={{ width: `${CELL}px`, height: `${CELL}px`, border: '1px solid rgba(59,130,246,0.5)', backgroundColor: cell ? 'rgba(66,153,225,0.25)' : 'transparent' }} />
          ))
        )}
      </div>
      {item.texture && (
        <div className="pointer-events-none" style={{ position: 'relative', width: blockWidth * CELL, height: blockHeight * CELL, marginTop: -blockHeight * CELL - 2, marginLeft: 2}}>
          <img
            src={item.texture}
            alt=""
            style={{ position: 'absolute', left: 0, top: 0, transformOrigin: 'top left', transform: buildImageTransform(blockWidth, blockHeight, CELL, 0, false, anchor, scalePx), imageRendering: 'auto', pointerEvents: 'none', maxWidth: 'none', height: 'auto' }}
          />
        </div>
      )}
    </div>
  );
};


const Hub = ({ onBlockSelect }: { onBlockSelect: (shape: BlockShape, e: React.MouseEvent, texture: string | null, meta: { ppc: number; anchor: TextureAnchor }) => void }) => {
  const l_Block: BlockShape = [
    [true, true, false],
    [true, true, true],
  ];
  const r_Block: BlockShape = [
    [false, true, false, false],
    [true, true, true, false],
    [true, true, true, true],
    [true, true, true, false],
  ];
  const f_Block: BlockShape = [
    [true, true],
  ];

  const items: PaletteItem[] = [
    { shape: l_Block, texture: "/textures/small_mech.png", texturePixelsPerCell: 370, textureAnchor: { x: 140, y: 20 } },
    { shape: r_Block, texture: "/textures/medium_mech.png", texturePixelsPerCell: 60, textureAnchor: { x: 0, y: 0 } },
    { shape: f_Block, texture: "/textures/stopper.png", texturePixelsPerCell: 60, textureAnchor: { x: 0, y: 0 } },
  ];

  return (
    <div className="bg-gray-800 p-4 rounded-lg flex flex-col items-center gap-6">
      <h2 className="text-xl font-semibold mb-2 text-center">Детали Ядра</h2>
      <p className="text-sm text-gray-400 -mt-6 mb-2 text-center">Перетащите деталь на сетку</p>

      {items.map((it, idx) => (
        <DraggableBlock key={idx} item={it} onBlockSelect={onBlockSelect} />
      ))}

      <div className="text-sm text-gray-400 mt-4 text-center">
        <p>Нажмите 'R' для поворота</p>
        <p>Нажмите 'F' для зеркала</p>
      </div>
    </div>
  );
};


// --- Основной компонент приложения ---
export default function App() {
  const GRID_SIZE = 7;
  const CELL_SIZE = 60;

  const [placedBlocks, setPlacedBlocks] = useState<PlacedBlock[]>([]);
  const [nextId, setNextId] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [activeBlockShape, setActiveBlockShape] = useState<BlockShape | null>(null);
  const [activeTexture, setActiveTexture] = useState<string | null>(null);
  const [activeRotationDeg, setActiveRotationDeg] = useState<0 | 90 | 180 | 270>(0);
  const [activeFlippedX, setActiveFlippedX] = useState<boolean>(false);
  const [activeBaseW, setActiveBaseW] = useState<number>(0);
  const [activeBaseH, setActiveBaseH] = useState<number>(0);
  const [activePpc, setActivePpc] = useState<number>(60);
  const [activeAnchor, setActiveAnchor] = useState<TextureAnchor>({ x: 0, y: 0 });
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [draggedBlockId, setDraggedBlockId] = useState<number | null>(null);
  const [previewPosition, setPreviewPosition] = useState<BlockPosition>({ x: -10, y: -10 });
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
            if (y >= 0 && y < GRID_SIZE && x >= 0 && x < GRID_SIZE) {
              grid[y][x] = block.id;
            }
          }
        });
      });
    });
    return grid;
  }, [placedBlocks, draggedBlockId]);

  const handleSelectBlockFromHub = (shape: BlockShape, e: React.MouseEvent, texture: string | null, meta: { ppc: number; anchor: TextureAnchor }) => {
    e.preventDefault();
    setIsDragging(true);
    setActiveBlockShape(shape);
    setActiveTexture(texture ?? null);
    setActiveRotationDeg(0);
    setActiveFlippedX(false);
    setActiveBaseW(shape[0]?.length || 0);
    setActiveBaseH(shape.length || 0);
    setActivePpc(meta.ppc);
    setActiveAnchor(meta.anchor);

    // Вычисляем смещение от точки клика до левого верхнего угла блока
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    setDragOffset({ x: offsetX, y: offsetY });

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
        setActiveTexture(blockToDrag.texture ?? null);
        setActiveRotationDeg(blockToDrag.rotationDeg);
        setActiveFlippedX(blockToDrag.flippedX);
        setActiveBaseW(blockToDrag.textureBaseWidth);
        setActiveBaseH(blockToDrag.textureBaseHeight);
        setActivePpc(blockToDrag.texturePixelsPerCell);
        // Для уже размещённого блока используем сохранённый якорь без перерасчёта
        setActiveAnchor(blockToDrag.textureAnchor);
        setDragPosition({ x: e.clientX, y: e.clientY });
        // Точный пиксельный оффсет точки захвата внутри блока
        const blockLeft = blockToDrag.position.x * CELL_SIZE;
        const blockTop = blockToDrag.position.y * CELL_SIZE;
        const offsetX = (e.clientX - rect.left) - blockLeft;
        const offsetY = (e.clientY - rect.top) - blockTop;
        setDragOffset({ x: offsetX, y: offsetY });
      }
    }
  };

  useEffect(() => {
    if (!isDragging || !activeBlockShape) return;
    const handleGlobalMouseMove = (e: MouseEvent) => {
      setDragPosition({ x: e.clientX, y: e.clientY });
      if (!gridRef.current) return;
      const rect = gridRef.current.getBoundingClientRect();
      const gridX = Math.round((e.clientX - rect.left - dragOffset.x) / CELL_SIZE);
      const gridY = Math.round((e.clientY - rect.top - dragOffset.y) / CELL_SIZE);

      if (previewPosition.x !== gridX || previewPosition.y !== gridY) {
        setPreviewPosition({ x: gridX, y: gridY });
        let canPlaceBlock = true;
        for (let dy = 0; dy < activeBlockShape.length; dy++) {
          for (let dx = 0; dx < activeBlockShape[dy].length; dx++) {
            if (activeBlockShape[dy][dx]) {
              const newX = gridX + dx;
              const newY = gridY + dy;
              if (newX >= GRID_SIZE || newY >= GRID_SIZE || newX < 0 || newY < 0 || (computedGrid[newY]?.[newX] !== null && computedGrid[newY][newX] !== draggedBlockId)) {
                canPlaceBlock = false;
                break;
              }
            }
          }
          if (!canPlaceBlock) break;
        }
        setCanPlace(canPlaceBlock);
        if (!canPlaceBlock) {
          setPreviewPosition({ x: -10, y: -10 });
        }
      }

    };
    const handleGlobalMouseUp = () => {
      if (canPlace && activeBlockShape && previewPosition.x >= 0 && previewPosition.y >= 0) {
        if (draggedBlockId) {
          setPlacedBlocks(blocks => blocks.map(b => b.id === draggedBlockId ? { ...b, position: previewPosition, shape: activeBlockShape, rotationDeg: activeRotationDeg, flippedX: activeFlippedX } : b));
        } else {
          setPlacedBlocks(blocks => [...blocks, { id: nextId, shape: activeBlockShape, position: previewPosition, texture: activeTexture ?? null, rotationDeg: activeRotationDeg, flippedX: activeFlippedX, textureBaseWidth: activeBaseW, textureBaseHeight: activeBaseH, texturePixelsPerCell: activePpc, textureAnchor: activeAnchor }]);
          setNextId(id => id + 1);
        }
      }
      setIsDragging(false);
      setActiveBlockShape(null);
      setDraggedBlockId(null);
      setPreviewPosition({ x: -10, y: -10 });
      setActiveTexture(null);
    };
    document.addEventListener("mousemove", handleGlobalMouseMove);
    document.addEventListener("mouseup", handleGlobalMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isDragging, activeBlockShape, dragOffset, computedGrid, nextId, placedBlocks, previewPosition, canPlace, draggedBlockId, activeRotationDeg, activeFlippedX, activeBaseW, activeBaseH, activeTexture, activePpc, activeAnchor]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isDragging || !activeBlockShape) return;
      if (e.key.toLowerCase() === 'r') {
        // --- НАЧАЛО ИЗМЕНЕНИЙ ---
        // Если блок отражен, вращаем его в обратную сторону, чтобы визуально это выглядело правильно
        const rotationAmount = activeFlippedX ? -90 : 90;
        setActiveRotationDeg(prev => ((prev + rotationAmount + 360) % 360) as 0 | 90 | 180 | 270);
        // Применяем простое вращение к самой форме.
        // Направление вращения формы не зависит от отражения текстуры.
        setActiveBlockShape(rotateBlock);
        // --- КОНЕЦ ИЗМЕНЕНИЙ ---
      } else if (e.key.toLowerCase() === 'f') {
        setActiveBlockShape(flipBlock);
        setActiveFlippedX(prev => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => { document.removeEventListener('keydown', handleKeyDown); };
    // Убедитесь, что в массиве зависимостей есть activeFlippedX
  }, [isDragging, activeBlockShape, activeFlippedX]);

  const clearGrid = () => setPlacedBlocks([]);

  const scalePx = CELL_SIZE / activePpc;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      {isDragging && activeBlockShape && (
        <div className="fixed pointer-events-none z-50" style={{ left: dragPosition.x - dragOffset.x, top: dragPosition.y - dragOffset.y }}>
          <div className="grid gap-0 border-2 border-green-400 opacity-40 bg-transparent" style={{ gridTemplateColumns: `repeat(${activeBlockShape[0].length}, ${CELL_SIZE}px)`, gridTemplateRows: `repeat(${activeBlockShape.length}, ${CELL_SIZE}px)` }}>
            {activeBlockShape.map((row, y) => row.map((cell, x) => (<div key={`${x}-${y}`} style={{ width: `${CELL_SIZE}px`, height: `${CELL_SIZE}px`, backgroundColor: cell ? 'rgba(66,153,225,0.12)' : 'transparent' }} />)))}
          </div>
        </div>
      )}
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Steam Sun — Тестовая сборка</h1>
        <div className="flex gap-8 items-start justify-center">
          <div className="bg-gray-800 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-center">Сетка ядра 7x7</h2>
            <div ref={gridRef} className="grid grid-cols-7 gap-0 border-2 border-gray-600 cursor-grab relative" onMouseDown={handleMouseDownOnGrid}>
              {Array.from({ length: GRID_SIZE }).map((_, y) => Array.from({ length: GRID_SIZE }).map((_, x) => {
                const isOccupied = computedGrid[y][x] !== null;
                const isPartOfPreview = isDragging && activeBlockShape && x >= previewPosition.x && x < previewPosition.x + (activeBlockShape[0]?.length || 0) && y >= previewPosition.y && y < previewPosition.y + activeBlockShape.length && activeBlockShape[y - previewPosition.y]?.[x - previewPosition.x];
                return (
                  <div key={`${x}-${y}`} className="relative" style={{ width: `${CELL_SIZE}px`, height: `${CELL_SIZE}px`, border: '1px solid #4A5568', backgroundColor: isOccupied ? 'rgba(255,255,255,0.02)' : '#2D3748' }}>
                    {isPartOfPreview && <div className={`absolute inset-0 border-2 ${canPlace ? 'border-green-400 bg-green-500/20' : 'border-red-400 bg-red-500/20'}`}></div>}
                  </div>
                );
              }))}

              {placedBlocks.map(block => {
                if (block.id === draggedBlockId) return null;
                if (!block.texture) return null;
                const left = block.position.x * CELL_SIZE;
                const top = block.position.y * CELL_SIZE;
                const scale = CELL_SIZE / block.texturePixelsPerCell;
                const transform = buildImageTransform(block.textureBaseWidth, block.textureBaseHeight, CELL_SIZE, block.rotationDeg, block.flippedX, block.textureAnchor, scale);
                return (
                  <img key={`tex-${block.id}`} src={block.texture} alt="" className="pointer-events-none" style={{ position: 'absolute', left, top, zIndex: 10, transformOrigin: 'top left', transform, maxWidth: 'none', height: 'auto' }} />
                );
              })}

              {isDragging && activeBlockShape && activeTexture && (
                <img
                  src={activeTexture}
                  alt=""
                  className="pointer-events-none"
                  style={{
                    position: previewPosition.x >= 0 ? 'absolute' : 'fixed',
                    left: previewPosition.x >= 0 ? previewPosition.x * CELL_SIZE : dragPosition.x - dragOffset.x,
                    top: previewPosition.y >= 0 ? previewPosition.y * CELL_SIZE : dragPosition.y - dragOffset.y,
                    zIndex: 20,
                    transformOrigin: 'top left',
                    transform: buildImageTransform(activeBaseW, activeBaseH, CELL_SIZE, activeRotationDeg, activeFlippedX, activeAnchor, scalePx),
                    opacity: 0.9,
                    maxWidth: 'none',
                    height: 'auto'
                  }}
                />
              )}
            </div>
            <button onClick={clearGrid} className="mt-4 w-full bg-red-600 hover:bg-red-700 px-4 py-2 rounded">Очистить сетку</button>
          </div>
          <Hub onBlockSelect={handleSelectBlockFromHub} />
        </div>
      </div>
    </div>
  );
}