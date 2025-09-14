import { useState, useEffect } from "react";
import SelectScreen from "./SelectScreen";
import BuildScreen from "./BuildScreen";
import { JsonBlockData } from "./Constructor";

export default function SteamSunApp() {
  const [step, setStep] = useState<"select" | "build">("select");
  const [blocks, setBlocks] = useState<JsonBlockData[]>([]);
  const [selectedBlocks, setSelectedBlocks] = useState<JsonBlockData[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]); // New state for selected IDs

  // Load blocks.json once
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
          initialSelectedIds={selectedIds} // Pass the selected IDs down
          onConfirm={(chosen, ids) => {
            setSelectedBlocks(chosen);
            setSelectedIds(ids); // Store the IDs
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