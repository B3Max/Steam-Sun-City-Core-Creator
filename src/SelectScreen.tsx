import React, { useState } from "react";
import { JsonBlockData, GridSize } from "./Constructor";

export default function SelectScreen({
  blocks,
  initialSelectedIds,
  onConfirm,
}: {
  blocks: JsonBlockData[];
  initialSelectedIds: string[];
  onConfirm: (selectedBlocks: JsonBlockData[], selectedIds: string[], gridSize: GridSize) => void;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);
  const [selectedGridSize, setSelectedGridSize] = useState<GridSize>({ x: 7, y: 7 });

  function toggleBlock(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  const selectedBlocks = blocks.filter((b) => selectedIds.includes(b.id));
  
  const gridSizeOptions: { label: string; size: GridSize }[] = [
    { label: "7x7", size: { x: 7, y: 7 } },
    { label: "15x10", size: { x: 15, y: 10 } },
    { label: "20x10", size: { x: 20, y: 10 } },
  ];

  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">Выбор деталей ядра</h1>
      <div className="mb-4">
        <h2 className="text-xl mb-2">Размер сетки</h2>
        <div className="flex gap-4">
          {gridSizeOptions.map((option) => (
            <button
              key={`${option.size.x}x${option.size.y}`}
              className={`px-4 py-2 rounded border transition-colors ${
                selectedGridSize.x === option.size.x && selectedGridSize.y === option.size.y
                  ? "bg-blue-600 border-blue-400"
                  : "bg-gray-800 border-gray-600"
              }`}
              onClick={() => setSelectedGridSize(option.size)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {blocks.map((b) => (
          <div
            key={b.id}
            className={`p-2 rounded border cursor-pointer ${selectedIds.includes(b.id)
                ? "bg-emerald-700 border-emerald-500"
                : "bg-gray-800 border-gray-600"
              }`}
            onClick={() => toggleBlock(b.id)}
          >
            <img
              src={b.texture || ""}
              alt={b.name_ru}
              className="w-full h-20 object-contain mb-2"
            />
            <div className="font-semibold">{b.name_ru}</div>
            <div className="text-sm text-gray-400">
              М: {b.power} • К: {b.control} • РН: {b.malfunction_risk}
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={() => onConfirm(selectedBlocks, selectedIds, selectedGridSize)}
        className="mt-6 bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded"
        disabled={selectedBlocks.length === 0}
      >
        Перейти к постройке
      </button>
    </div>
  );
}