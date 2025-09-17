import { useState, useEffect } from "react";
import SelectScreen from "./SelectScreen";
import BuildScreen from "./BuildScreen";
import { JsonBlockData, GridSize } from "./Constructor";

// Импортируем новый тип
import { GridOption } from "./SelectScreen"; 

export default function SteamSunApp() {
  const [step, setStep] = useState<"select" | "build">("select");
  const [blocks, setBlocks] = useState<JsonBlockData[]>([]);
  const [selectedBlocks, setSelectedBlocks] = useState<JsonBlockData[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  // Храним всю информацию о сетке
  const [gridOption, setGridOption] = useState<GridOption | null>(null);

  // Загружаем blocks.json один раз
  useEffect(() => {
    fetch("/blocks.json")
      .then((res) => res.json())
      .then((data) => setBlocks(data))
      .catch((err) => console.error("Ошибка загрузки blocks.json:", err));
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {step === "select" && (
        <SelectScreen
          blocks={blocks}
          initialSelectedIds={selectedIds}
          onConfirm={(chosen, ids, chosenGridOption) => {
            setSelectedBlocks(chosen);
            setSelectedIds(ids);
            setGridOption(chosenGridOption); // <-- Сохраняем всю опцию
            setStep("build");
          }}
        />
      )}

      {step === "build" && gridOption && ( // <-- Добавили проверку на gridOption
        <BuildScreen
          blocks={selectedBlocks}
          gridSize={gridOption.size} // <-- Передаем размер
          gridTexture={gridOption.texture} // <-- Передаем текстуру
          onBack={() => setStep("select")}
        />
      )}
    </div>
  );
}