import App from "./App"; // это твой переделанный конструктор с сеткой
import { JsonBlockData } from "./App"; // можно вынести типы в отдельный файл, если нужно

export default function BuildScreen({
  blocks,
  onBack,
}: {
  blocks: JsonBlockData[];
  onBack: () => void;
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

      {/* Передаём выбранные блоки как initialBlocks */}
      <App initialBlocks={blocks} />
    </div>
  );
}
