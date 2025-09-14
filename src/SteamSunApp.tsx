import { useState, useEffect } from "react";
import SelectScreen from "./SelectScreen";
import BuildScreen from "./BuildScreen";
import { JsonBlockData, GridSize } from "./Constructor";

export default function SteamSunApp() {
  const [step, setStep] = useState<"select" | "build">("select");
  const [blocks, setBlocks] = useState<JsonBlockData[]>([]);
  const [selectedBlocks, setSelectedBlocks] = useState<JsonBlockData[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedGridSize, setSelectedGridSize] = useState<GridSize>({ x: 7, y: 7 });

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
          initialSelectedIds={selectedIds} // Передаём сохранённые ID
          onConfirm={(chosen, ids, chosenGridSize) => {
            setSelectedBlocks(chosen);
            setSelectedIds(ids); // Сохраняем ID для возврата
            setSelectedGridSize(chosenGridSize);
            setStep("build");
          }}
        />
      )}

      {step === "build" && (
        <BuildScreen
          blocks={selectedBlocks}
          gridSize={selectedGridSize}
          onBack={() => setStep("select")}
        />
      )}
    </div>
  );
}