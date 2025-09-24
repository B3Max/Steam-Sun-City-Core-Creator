import React, { useState, useRef, useEffect, useMemo, useLayoutEffect } from "react";

// --- Типы данных ---
type BlockShape = boolean[][];
type BlockPosition = { x: number; y: number };
type TextureAnchor = { x: number; y: number }; // в пикселях исходной текстуры (базовая ориентация)

export type GridSize = {
  x: number,
  y: number
}

type PlacedBlock = {
  id: number;
  jsonId: string;
  shape: BlockShape;
  position: BlockPosition;
  texture?: string | null;
  rotationDeg: 0 | 90 | 180 | 270;
  flippedX: boolean;
  textureBaseWidth: number;
  textureBaseHeight: number;
  texturePixelsPerCell: number;
  textureAnchor: TextureAnchor;
};

export type JsonBlockData = {
  id: string;
  name_ru: string;
  power: number;
  control: number;
  malfunction_risk: number;
  price: number;
  texture: string | null;
  texturePixelsPerCell: number;
  textureAnchor: TextureAnchor;
  shape: number[][];
};

type PaletteItem = {
  id: string;
  shape: BlockShape;
  texture: string | null;
  texturePixelsPerCell?: number;
  textureAnchor?: TextureAnchor;
};

type DraggableBlockProps = {
  item: PaletteItem;
  hubCellSizePx: number; // размер клетки предпросмотра в хабе
  onBlockSelect: (
    jsonId: string,
    shape: BlockShape,
    e: React.MouseEvent,
    texture: string | null,
    meta: { ppc: number; anchor: TextureAnchor }
  ) => void;
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

function getTextureTransform(
  baseW: number,
  baseH: number,
  cell: number,
  rotationDeg: 0 | 90 | 180 | 270,
  flipped: boolean
) {
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
      case 0: tx = Wpx; break;
      case 90: break; // Сдвиг не нужен
      case 180: ty = Hpx; break;
      case 270: tx = Hpx; ty = Wpx; break;
    }
  }
  return { tx, ty };
}

function buildImageTransform(
  baseW: number,
  baseH: number,
  cell: number,
  rotationDeg: 0 | 90 | 180 | 270,
  flippedX: boolean,
  anchorPx: TextureAnchor,
  scalePx: number
) {
  const { tx, ty } = getTextureTransform(baseW, baseH, cell, rotationDeg, flippedX);

  const scaleXValue = flippedX ? -1 : 1;

  // Порядок: scaleX применяется ПОСЛЕ rotate, что дает "отражение вида с экрана"
  return `translate(${tx}px, ${ty}px) scale(${scaleXValue}, 1) rotate(${rotationDeg}deg) scale(${scalePx}) translate(${-anchorPx.x}px, ${-anchorPx.y}px)`;
}

// --- Компоненты ---
const DraggableBlock: React.FC<DraggableBlockProps> = ({ item, onBlockSelect, hubCellSizePx }) => {
  const blockWidth = item.shape[0]?.length || 1;
  const blockHeight = item.shape.length || 1;
  const CELL = hubCellSizePx / 1.5;
  const ppc = item.texturePixelsPerCell ?? 60; // по умолчанию 60px на клетку
  const anchor = item.textureAnchor ?? { x: 0, y: 0 };
  const scalePx = CELL / ppc;

  return (
    <div
      className="cursor-move select-none transition-transform hover:scale-150 inline-block"
      onMouseDown={(e) => onBlockSelect(item.id, item.shape, e, item.texture, { ppc, anchor })}
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
        <div className="pointer-events-none" style={{ position: 'relative', width: blockWidth * CELL, height: blockHeight * CELL, marginTop: -blockHeight * CELL - 2, marginLeft: 2 }}>
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

const Hub = ({ items, onBlockSelect, hubCellSizePx }: {
  items: PaletteItem[];
  hubCellSizePx: number;
  onBlockSelect: (
    jsonId: string,
    shape: BlockShape,
    e: React.MouseEvent,
    texture: string | null,
    meta: { ppc: number; anchor: TextureAnchor }
  ) => void;
}) => {
  return (
    <div className="bg-gray-800 p-4 rounded-lg flex flex-col items-center gap-6">
      <h2 className="text-xl font-semibold mb-2 text-center">Детали Ядра</h2>
      <p className="text-sm text-gray-400 -mt-6 mb-2 text-center">Перетащите деталь на сетку</p>
      <p>Нажмите 'R' для поворота</p>
      <p>Нажмите 'F' для зеркала</p>

      {items.map((it, idx) => (
        it.shape.length > 0 && <DraggableBlock key={idx} item={it} hubCellSizePx={hubCellSizePx} onBlockSelect={onBlockSelect} />
      ))}
    </div>
  );
};


// --- Основной компонент приложения ---
export default function Consctructor({ initialBlocks, gridSize, gridTexture }: {
  initialBlocks: JsonBlockData[],
  gridSize: GridSize,
  gridTexture: string
}) {
  const [placedBlocks, setPlacedBlocks] = useState<PlacedBlock[]>([]);
  const [nextId, setNextId] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [activeBlockShape, setActiveBlockShape] = useState<BlockShape | null>(null);
  const [activeJsonId, setActiveJsonId] = useState<string | null>(null);
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
  const [inGrid, setInGrid] = useState(false);
  const [conflictingCells, setConflictingCells] = useState<BlockPosition[]>([]);
  const [cellSize, setCellSize] = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);
  const gridMeasureRef = useRef<HTMLDivElement>(null); // стабильный контейнер для измерения (карточка с padding)

  useLayoutEffect(() => {
    if (!gridMeasureRef.current) return;
    const el = gridMeasureRef.current;

    const computeContentWidth = () => {
      const style = window.getComputedStyle(el);
      const paddingLeft = parseFloat(style.paddingLeft || "0");
      const paddingRight = parseFloat(style.paddingRight || "0");
      const innerWidth = el.clientWidth - paddingLeft - paddingRight;
      const availableWidth = Math.max(0, innerWidth);
      const size = availableWidth > 0 ? Math.floor(availableWidth / gridSize.x) : 0;
      setCellSize(size);
    };

    // Инициализация
    computeContentWidth();

    const ro = new ResizeObserver(() => {
      computeContentWidth();
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
    };
  }, [gridSize]);


  const palette: PaletteItem[] = useMemo(
    () =>
      initialBlocks.map((b) => ({
        id: b.id,
        name_ru: b.name_ru,
        shape: b.shape.map((row) => row.map((c) => c === 1)),
        texture: b.texture,
        texturePixelsPerCell: b.texturePixelsPerCell ?? 60,
        textureAnchor: b.textureAnchor ?? { x: 0, y: 0 },
      })),
    [initialBlocks]
  );

  const computedGrid = useMemo(() => {
    const grid: (number | null)[][] = Array(gridSize.y).fill(null).map(() => Array(gridSize.x).fill(null));
    placedBlocks.forEach(block => {
      if (block.id === draggedBlockId) return;
      block.shape.forEach((row, dy) => {
        row.forEach((cell, dx) => {
          if (cell) {
            const y = block.position.y + dy;
            const x = block.position.x + dx;
            if (y >= 0 && y < gridSize.y && x >= 0 && x < gridSize.x) {
              grid[y][x] = block.id;
            }
          }
        });
      });
    });
    return grid;
  }, [placedBlocks, draggedBlockId]);

  const handleSelectBlockFromHub = (
    jsonId: string,
    shape: BlockShape,
    e: React.MouseEvent,
    texture: string | null,
    meta: {
      ppc: number;
      anchor: TextureAnchor
    }
  ) => {
    e.preventDefault();
    setIsDragging(true);
    setActiveJsonId(jsonId);
    setActiveBlockShape(shape);
    setActiveTexture(texture ?? null);
    setActiveRotationDeg(0);
    setActiveFlippedX(false);
    setActiveBaseW(shape[0]?.length || 0);
    setActiveBaseH(shape.length || 0);
    setActivePpc(meta.ppc);
    setActiveAnchor(meta.anchor);
    setPreviewPosition({ x: -10, y: -10 });

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
    const x = Math.floor((e.clientX - rect.left) / cellSize);
    const y = Math.floor((e.clientY - rect.top) / cellSize);
    const blockId = computedGrid[y]?.[x];
    if (blockId) {
      const blockToDrag = placedBlocks.find(b => b.id === blockId);
      if (blockToDrag) {
        e.preventDefault();
        setIsDragging(true);
        setActiveJsonId(blockToDrag.jsonId);
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
        const blockLeft = blockToDrag.position.x * cellSize;
        const blockTop = blockToDrag.position.y * cellSize;
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

      const gridX = Math.round((e.clientX - rect.left - dragOffset.x) / cellSize);
      const gridY = Math.round((e.clientY - rect.top - dragOffset.y) / cellSize);

      setPreviewPosition({ x: gridX, y: gridY });

      const newConflictingCells: BlockPosition[] = [];
      let canPlaceBlock = true;

      for (let dy = 0; dy < activeBlockShape.length; dy++) {
        for (let dx = 0; dx < activeBlockShape[dy].length; dx++) {
          if (activeBlockShape[dy][dx]) {
            const newX = gridX + dx;
            const newY = gridY + dy;
            const isOccupied = computedGrid[newY]?.[newX] !== null;

            if (newX >= gridSize.x || newY >= gridSize.y || newX < 0 || newY < 0 || isOccupied) {
              newConflictingCells.push({ x: newX, y: newY });
              canPlaceBlock = false;
            }
          }
        }
      }

      setConflictingCells(newConflictingCells);
      setCanPlace(canPlaceBlock);
      setInGrid(e.clientX > rect.left && e.clientX < rect.right && e.clientY > rect.top && e.clientY < rect.bottom);
    };
    const handleGlobalMouseUp = () => {
      if (canPlace && activeBlockShape && activeJsonId && previewPosition.x >= 0 && previewPosition.y >= 0) {
        if (draggedBlockId) {
          setPlacedBlocks(blocks => blocks.map(b => b.id === draggedBlockId ? { ...b, position: previewPosition, shape: activeBlockShape, rotationDeg: activeRotationDeg, flippedX: activeFlippedX } : b));
        } else {
          setPlacedBlocks(blocks => [...blocks, {
            id: nextId,
            jsonId: activeJsonId,
            shape: activeBlockShape,
            position: previewPosition,
            texture: activeTexture ?? null,
            rotationDeg: activeRotationDeg,
            flippedX: activeFlippedX,
            textureBaseWidth: activeBaseW,
            textureBaseHeight: activeBaseH,
            texturePixelsPerCell: activePpc,
            textureAnchor: activeAnchor
          }]);
          setNextId(id => id + 1);
        }
      }
      setIsDragging(false);
      setActiveBlockShape(null);
      setDraggedBlockId(null);
      setActiveTexture(null);
      setActiveJsonId(null);
    };
    document.addEventListener("mousemove", handleGlobalMouseMove);
    document.addEventListener("mouseup", handleGlobalMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isDragging, activeBlockShape, dragOffset, computedGrid, nextId, placedBlocks, previewPosition, canPlace, draggedBlockId, activeRotationDeg, activeFlippedX, activeBaseW, activeBaseH, activeTexture, activePpc, activeAnchor, conflictingCells, inGrid, activeJsonId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isDragging || !activeBlockShape) return;
      if (e.key.toLowerCase() === 'r') {
        // Если блок отражен, вращаем его в обратную сторону, чтобы визуально это выглядело правильно
        const rotationAmount = activeFlippedX ? -90 : 90;
        setActiveRotationDeg(prev => ((prev + rotationAmount + 360) % 360) as 0 | 90 | 180 | 270);
        // Применяем простое вращение к самой форме.
        // Направление вращения формы не зависит от отражения текстуры.
        setActiveBlockShape(prev => prev ? rotateBlock(prev) : prev);
      } else if (e.key.toLowerCase() === 'f') {
        setActiveBlockShape(prev => prev ? flipBlock(prev) : prev);
        setActiveFlippedX(prev => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => { document.removeEventListener('keydown', handleKeyDown); };
    // Убедитесь, что в массиве зависимостей есть activeFlippedX
  }, [isDragging, activeBlockShape, activeFlippedX]);

  const clearGrid = () => setPlacedBlocks([]);

  const scalePx = cellSize / activePpc;

  const totalStats = useMemo(() => {
    const stats = {
      power: 0,
      control: 0,
      malfunction_risk: 0,
      price: 0,
    };

    placedBlocks.forEach(placed => {
      const sourceBlock = initialBlocks.find(b => b.id === placed.jsonId);
      if (sourceBlock) {
        stats.power += sourceBlock.power;
        stats.control += sourceBlock.control;
        stats.malfunction_risk += sourceBlock.malfunction_risk;
        stats.price += sourceBlock.price;
      }
    });

    return stats;
  }, [placedBlocks, initialBlocks]);


  return (
    <div className="bg-gray-900 text-white p-8">
      {isDragging && activeBlockShape && (
        <div className="fixed pointer-events-none z-50" style={{ left: dragPosition.x - dragOffset.x, top: dragPosition.y - dragOffset.y }}>
          <div className="grid gap-0 border-2 border-green-400 opacity-40 bg-transparent" style={{ gridTemplateColumns: `repeat(${activeBlockShape[0].length}, ${cellSize}px)`, gridTemplateRows: `repeat(${activeBlockShape.length}, ${cellSize}px)` }}>
            {activeBlockShape.map((row, y) => row.map((cell, x) => (<div key={`${x}-${y}`} style={{ width: `${cellSize}px`, height: `${cellSize}px`, backgroundColor: cell ? 'rgba(66,153,225,0.12)' : 'transparent' }} />)))}
          </div>
        </div>
      )}
      <div className="mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Steam Sun — Тестовая сборка</h1>
        <div className="flex gap-8 items-start">
          <div className="flex-1 min-w-0">
            <div className="bg-gray-800 p-4 rounded-lg" ref={gridMeasureRef}>
            <h2 className="text-xl font-semibold mb-4 text-center">Сетка ядра {gridSize.x}x{gridSize.y}</h2>
              <div className="relative">
              {/* Фоновая текстура */}
                <img
                  src={gridTexture}
                  alt="Grid background"
                  className="absolute top-0 left-0 pointer-events-none z-0"
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    transformOrigin: 'top left',
                    // Рисуем как текстуру блока: масштабируем от cellSize с условным ppc
                    transform: buildImageTransform(
                      gridSize.x,
                      gridSize.y,
                      cellSize,
                      0,
                      false,
                      { x: 133, y: 114 },
                      cellSize / 115
                    ),
                    maxWidth: 'none',
                    height: 'auto'
                  }}
                />
              <div
                ref={gridRef}
                className={`grid gap-0 border-2 border-gray-600 relative`}
                style={{
                  gridTemplateColumns: `repeat(${gridSize.x}, ${cellSize}px)`,
                  width: `${gridSize.x * cellSize}px`,
                  height: `${gridSize.y * cellSize}px`,
                  zIndex: 1
                }}
                onMouseDown={handleMouseDownOnGrid}
              >
                {Array.from({ length: gridSize.y }).map((_, y) => Array.from({ length: gridSize.x }).map((_, x) => {
                  return (
                      <div key={`${x}-${y}`} className="relative" style={{ width: `${cellSize}px`, height: `${cellSize}px`, border: '1px solid #181a15ff', boxSizing: 'border-box' }}>
                      {
                        isDragging && activeBlockShape &&
                        x >= previewPosition.x && x < previewPosition.x + (activeBlockShape[0]?.length || 0) &&
                        y >= previewPosition.y && y < previewPosition.y + activeBlockShape.length &&
                        activeBlockShape[y - previewPosition.y]?.[x - previewPosition.x] &&
                        (
                          canPlace
                            ? <div className={`absolute inset-0 border-2 border-green-400/70 bg-green-500/10 z-30`}></div>
                            : (
                              conflictingCells.some(c => c.x === x && c.y === y) &&
                              <div className={`absolute inset-0 border-2 border-red-400/70 bg-red-500/10 z-30`}></div>
                            )
                        )
                      }
                    </div>
                  );
                }))}

                {placedBlocks.map(block => {
                  if (block.id === draggedBlockId) return null;
                  if (!block.texture) return null;
                  const left = block.position.x * cellSize;
                  const top = block.position.y * cellSize;
                  const scale = cellSize / block.texturePixelsPerCell;
                  const transform = buildImageTransform(block.textureBaseWidth, block.textureBaseHeight, cellSize, block.rotationDeg, block.flippedX, block.textureAnchor, scale);
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
                      position: inGrid ? 'absolute' : 'fixed',
                      left: inGrid ? previewPosition.x * cellSize : dragPosition.x - dragOffset.x,
                      top: inGrid ? previewPosition.y * cellSize : dragPosition.y - dragOffset.y,
                      zIndex: 20,
                      transformOrigin: 'top left',
                      transform: buildImageTransform(activeBaseW, activeBaseH, cellSize, activeRotationDeg, activeFlippedX, activeAnchor, scalePx),
                      opacity: 0.9,
                      maxWidth: 'none',
                      height: 'auto'
                    }}
                  />
                )}
              </div>
              </div>
              <button onClick={clearGrid} className="mt-4 w-full bg-red-600 hover:bg-red-700 px-4 py-2 rounded">Очистить сетку</button>
            </div>
          </div>
          <div className="mt-6 p-4 border border-gray-600 rounded-lg">
            <h3 className="text-lg font-semibold text-center mb-3">Итоговые параметры сборки</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <span className="text-gray-400">Мощность:</span>
              <span className="font-mono text-emerald-400">{totalStats.power}</span>

              <span className="text-gray-400">Контроль:</span>
              <span className="font-mono text-sky-400">{totalStats.control}</span>

              <span className="text-gray-400">Риск неисправности:</span>
              <span className="font-mono text-amber-400">{totalStats.malfunction_risk}%</span>

              <span className="text-gray-400">Цена:</span>
              <span className="font-mono text-green-400">{totalStats.price} ⚙️</span>
            </div>
          </div>
          <Hub items={palette} hubCellSizePx={cellSize} onBlockSelect={handleSelectBlockFromHub} />
        </div>
      </div>
    </div>
  );
}