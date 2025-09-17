import Constructor, { JsonBlockData, GridSize } from "./Constructor";

export default function BuildScreen({
  blocks,
  onBack,
  gridSize,
  gridTexture, // <-- Принимаем новую пропсу
}: {
  blocks: JsonBlockData[];
  onBack: () => void;
  gridSize: GridSize;
  gridTexture: string; // <-- Объявляем тип
}) {
  return (
    <div className="p-4">
      <button
        onClick={onBack}
        className="mb-4 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded"
      >
        ← Назад
      </button>
      <h2 className="text-xl mb-4">Постройка ядра</h2>

      {/* Передаем текстуру дальше в Constructor */}
      <Constructor 
        initialBlocks={blocks} 
        gridSize={gridSize} 
        gridTexture={gridTexture} 
      />
    </div>
  );
}