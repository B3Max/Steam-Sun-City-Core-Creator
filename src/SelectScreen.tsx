import React from "react";
import { JsonBlockData } from "./Constructor";

export default function SelectScreen({
  blocks,
  initialSelectedIds, // New prop
  onConfirm,
}: {
  blocks: JsonBlockData[];
  initialSelectedIds: string[]; // New prop type
  onConfirm: (selectedBlocks: JsonBlockData[], selectedIds: string[]) => void; // Update prop type
}) {
  // Use the initialSelectedIds to initialize the state
  const [selectedIds, setSelectedIds] = React.useState<string[]>(initialSelectedIds);

  function toggleBlock(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  const selectedBlocks = blocks.filter((b) => selectedIds.includes(b.id));

  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">Выбор деталей ядра</h1>
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
        onClick={() => onConfirm(selectedBlocks, selectedIds)} // Pass selectedIds back
        className="mt-6 bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded"
        disabled={selectedBlocks.length === 0}
      >
        Перейти к постройке
      </button>
    </div>
  );
}