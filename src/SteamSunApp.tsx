import { useState, useEffect } from "react";
import SelectScreen from "./SelectScreen";
import BuildScreen from "./BuildScreen";
import { JsonBlockData } from "./App";

export default function SteamSunApp() {
  const [step, setStep] = useState<"select" | "build">("select");
  const [blocks, setBlocks] = useState<JsonBlockData[]>([]);
  const [selectedBlocks, setSelectedBlocks] = useState<JsonBlockData[]>([]);

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
          onConfirm={(chosen) => {
            setSelectedBlocks(chosen);
            setStep("build");
          }}
        />
      )}

      {step === "build" && (
        <BuildScreen
          blocks={selectedBlocks}
          onBack={() => setStep("select")}
        />
      )}
    </div>
  );
}
