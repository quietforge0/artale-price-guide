import React, { useState, useCallback, useMemo, useEffect } from "react";
import type { Scroll } from "../types/index.ts";
import { SCROLLS } from "../constants/scrolls.ts";
import {
  EQUIPMENT_BY_CATEGORY_WITH_SCROLLS,
  EQUIPMENT_ICONS,
  ATTRIBUTE_ICONS,
} from "../constants/equipment.ts";
import { getAvailableAttributesForEquipment } from "../constants/scrolls.ts";

// 模擬結果
interface SimulationResult {
  id: number;
  success: boolean;
  finalStats: { [key: string]: number };
  scrollsUsed: number;
  totalCost?: number; // 總成本（如果啟用成本計算）
  stopReason: "completed" | "stop_loss";
}

// 成本設置
interface CostSettings {
  enabled: boolean;
  cleanEquipmentPrice: number; // 乾淨裝備價格
  scrollPrices: { [scrollId: string]: number }; // 各卷軸價格
}

// 停損條件
interface StopLossCondition {
  attribute: string; // 屬性名稱
  minValue: number; // 最小期望值
  scrollIndex: number; // 在第幾張卷軸後檢查（從1開始計算）
}

// 停損設置
interface StopLossSettings {
  enabled: boolean;
  conditions: StopLossCondition[];
}

// 結果統計
interface ResultStats {
  totalRuns: number;
  successCount: number;
  successRate: number;
  averageScrollsUsed: number;
  totalCost?: number;
}

export const ScrollSimulator: React.FC = () => {
  // 基本設置
  const [selectedEquipmentType, setSelectedEquipmentType] =
    useState<string>("");
  const [activeCategory, setActiveCategory] = useState<
    keyof typeof EQUIPMENT_BY_CATEGORY_WITH_SCROLLS
  >(
    Object.keys(
      EQUIPMENT_BY_CATEGORY_WITH_SCROLLS
    )[0] as keyof typeof EQUIPMENT_BY_CATEGORY_WITH_SCROLLS
  );

  // 期望增加值狀態
  const [targetIncrements, setTargetIncrements] = useState<{
    [key: string]: number;
  }>({});

  // 卷軸相關
  const [selectedScrolls, setSelectedScrolls] = useState<string[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [scrollCounts, setScrollCounts] = useState<{
    [scrollId: string]: number;
  }>({});

  // 模擬設置
  const [simulationCount, setSimulationCount] = useState(1000);
  const [isSimulating, setIsSimulating] = useState(false);

  // 結果詳細展示
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // 成本設置
  const [costSettings, setCostSettings] = useState<CostSettings>({
    enabled: false,
    cleanEquipmentPrice: 0,
    scrollPrices: {},
  });

  // 停損設置
  const [stopLossSettings, setStopLossSettings] = useState<StopLossSettings>({
    enabled: false,
    conditions: [],
  });

  // 結果
  const [results, setResults] = useState<SimulationResult[]>([]);
  const [resultStats, setResultStats] = useState<ResultStats | null>(null);

  const MAX_SIMULATION_COUNT = 50000;

  // 獲取可用卷軸
  const availableScrolls = useMemo((): Scroll[] => {
    if (!selectedEquipmentType) return [];
    return SCROLLS.filter(
      (scroll) => scroll.equipmentType === selectedEquipmentType
    );
  }, [selectedEquipmentType]);

  // 獲取可用屬性
  const availableAttributes = useMemo(() => {
    if (!selectedEquipmentType) return [];
    return getAvailableAttributesForEquipment(selectedEquipmentType);
  }, [selectedEquipmentType]);

  // 數字輸入框組件 - 修復焦點問題
  const NumberInput: React.FC<{
    value: number;
    onChange: (value: number) => void;
    placeholder?: string;
    min?: number;
    max?: number;
    className?: string;
    suffix?: string;
  }> = ({
    value,
    onChange,
    placeholder = "0",
    min = 0,
    max,
    className = "",
    suffix = "",
  }) => {
    const [internalValue, setInternalValue] = useState<string>("");
    const [isFocused, setIsFocused] = useState(false);

    // 初始化和外部值變化時更新內部值
    useEffect(() => {
      if (!isFocused) {
        setInternalValue(value === 0 ? "" : value.toString());
      }
    }, [value, isFocused]);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      // 確保點擊一次就能獲得焦點
      e.target.select();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      // 只允許數字和空值
      if (inputValue === "" || /^\d+$/.test(inputValue)) {
        setInternalValue(inputValue);
      }
    };

    const handleBlur = () => {
      setIsFocused(false);
      const numValue = parseInt(internalValue) || 0;
      let finalValue = Math.max(min, numValue);
      if (max !== undefined) finalValue = Math.min(max, finalValue);
      onChange(finalValue);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.currentTarget.blur();
      }
    };

    return (
      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          value={internalValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`
            ${className}
            px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white text-center
            focus:border-blue-400 focus:bg-gray-700/70 transition-all outline-none
          `}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    );
  };

  // 處理裝備選擇變化
  const handleEquipmentChange = (equipmentType: string) => {
    setSelectedEquipmentType(equipmentType);
    setSelectedScrolls([]);
    setTargetIncrements({});
  };

  // 添加期望增加值
  const addTargetIncrement = (attribute: string) => {
    setTargetIncrements((prev) => ({
      ...prev,
      [attribute]: 1,
    }));
  };

  // 移除期望增加值
  const removeTargetIncrement = (attribute: string) => {
    setTargetIncrements((prev) => {
      const newIncrements = { ...prev };
      delete newIncrements[attribute];
      return newIncrements;
    });
  };

  // 更新期望增加值
  const updateTargetIncrement = (attribute: string, value: number) => {
    setTargetIncrements((prev) => ({
      ...prev,
      [attribute]: value,
    }));
  };

  // 批量添加卷軸
  const addScrollsInBatch = (scrollId: string, count: number) => {
    const newScrolls = Array(count).fill(scrollId);
    setSelectedScrolls((prev) => [...prev, ...newScrolls]);
  };

  // 處理拖拽開始
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  // 處理拖拽結束
  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // 處理拖拽過程
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  // 處理放置
  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;

    const newScrolls = [...selectedScrolls];
    const draggedItem = newScrolls[draggedIndex];
    newScrolls.splice(draggedIndex, 1);
    newScrolls.splice(dropIndex, 0, draggedItem);

    setSelectedScrolls(newScrolls);
    setDraggedIndex(null);
  };

  // 移除卷軸
  const removeScroll = (index: number) => {
    setSelectedScrolls((prev) => prev.filter((_, i) => i !== index));
  };

  // 模擬計算
  const simulateSingleRun = useCallback(
    (id: number): SimulationResult => {
      const currentIncrements: { [key: string]: number } = {};
      let scrollsUsed = 0;
      let totalCost = costSettings.enabled
        ? costSettings.cleanEquipmentPrice
        : 0;

      for (const scrollId of selectedScrolls) {
        scrollsUsed++;

        if (costSettings.enabled) {
          totalCost += costSettings.scrollPrices[scrollId] || 0;
        }

        const scroll = availableScrolls.find((s) => s.id === scrollId);
        if (!scroll) continue;

        // 確保每次模擬都有不同的隨機結果
        const randomValue = Math.random();
        const isSuccess = randomValue < scroll.successRate / 100;

        if (isSuccess) {
          const primaryStat = scroll.primaryEffect.stat;
          currentIncrements[primaryStat] =
            (currentIncrements[primaryStat] || 0) + scroll.primaryEffect.value;

          if (scroll.secondaryEffects) {
            scroll.secondaryEffects.forEach((effect) => {
              currentIncrements[effect.stat] =
                (currentIncrements[effect.stat] || 0) + effect.value;
            });
          }
        }
        // 卷軸失敗時，屬性不增加，但繼續下一張卷軸（裝備不會損壞）

        // 不管卷軸成功或失敗，都要檢查停損條件
        if (stopLossSettings.enabled) {
          for (const condition of stopLossSettings.conditions) {
            if (scrollsUsed === condition.scrollIndex) {
              const currentValue = currentIncrements[condition.attribute] || 0;
              if (currentValue < condition.minValue) {
                return {
                  id,
                  success: false,
                  finalStats: currentIncrements,
                  scrollsUsed,
                  totalCost: costSettings.enabled ? totalCost : undefined,
                  stopReason: "stop_loss",
                };
              }
            }
          }
        }
      }

      // 檢查是否達到期望增加值
      const hasTargetIncrements = Object.keys(targetIncrements).length > 0;
      let meetsTargetIncrements = false;

      if (hasTargetIncrements) {
        meetsTargetIncrements = Object.entries(targetIncrements).every(
          ([attr, targetValue]) => {
            const currentValue = currentIncrements[attr] || 0;
            return currentValue >= targetValue;
          }
        );
      }

      return {
        id,
        success: hasTargetIncrements ? meetsTargetIncrements : true, // 如果沒設定期望值，完成即成功
        finalStats: currentIncrements,
        scrollsUsed,
        totalCost: costSettings.enabled ? totalCost : undefined,
        stopReason: "completed",
      };
    },
    [
      selectedScrolls,
      availableScrolls,
      costSettings,
      stopLossSettings,
      targetIncrements,
    ]
  );

  // 運行模擬
  const runSimulation = useCallback(async () => {
    if (selectedScrolls.length === 0) return;

    setIsSimulating(true);
    setResults([]);
    setResultStats(null);

    const batchSize = 1000;
    const batches = Math.ceil(simulationCount / batchSize);
    const allResults: SimulationResult[] = [];

    for (let batch = 0; batch < batches; batch++) {
      const currentBatchSize = Math.min(
        batchSize,
        simulationCount - batch * batchSize
      );

      const batchResults = Array.from({ length: currentBatchSize }, (_, i) =>
        simulateSingleRun(batch * batchSize + i)
      );

      allResults.push(...batchResults);

      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    setResults(allResults);

    const successResults = allResults.filter((r) => r.success);
    const stats: ResultStats = {
      totalRuns: allResults.length,
      successCount: successResults.length,
      successRate: (successResults.length / allResults.length) * 100,
      averageScrollsUsed:
        allResults.length > 0
          ? allResults.reduce((sum, r) => sum + r.scrollsUsed, 0) /
            allResults.length
          : 0,
      totalCost: costSettings.enabled
        ? allResults.reduce((sum, r) => sum + (r.totalCost || 0), 0)
        : undefined,
    };

    setResultStats(stats);
    setIsSimulating(false);
  }, [simulationCount, simulateSingleRun, selectedScrolls, costSettings]);

  // 結果分組
  const groupedResults = useMemo(() => {
    if (results.length === 0) return { stopLoss: [], byAttribute: {} };

    const stopLoss = results.filter((r) => r.stopReason === "stop_loss");
    const completed = results.filter((r) => r.stopReason === "completed");

    const byAttribute: { [key: string]: SimulationResult[] } = {};

    completed.forEach((result) => {
      const stats = Object.entries(result.finalStats);
      if (stats.length === 0) {
        // 沒有任何屬性增加的情況
        const key = "無屬性增加";
        if (!byAttribute[key]) byAttribute[key] = [];
        byAttribute[key].push(result);
        return;
      }

      // 按照所有屬性組合來分組，而不是只看最高屬性
      const sortedStats = stats.sort(([a], [b]) => a.localeCompare(b));
      const key = sortedStats
        .map(([attr, value]) => `${attr}:+${value}`)
        .join(", ");

      if (!byAttribute[key]) byAttribute[key] = [];
      byAttribute[key].push(result);
    });

    return { stopLoss, byAttribute };
  }, [results]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-purple-900/20">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
            衝卷模擬器
          </h1>
          <p className="text-gray-400 text-lg">
            選擇裝備、拖拽卷軸順序、開始模擬
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左側：設置區域 */}
          <div className="lg:col-span-1 space-y-6">
            {/* 裝備選擇 */}
            <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6">
              <div className="text-center mb-6">
                <div className="inline-flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl border border-blue-500/30 backdrop-blur-sm">
                  <span className="text-2xl">⚔️</span>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    選擇裝備
                  </h3>
                </div>
              </div>

              <div className="flex space-x-4">
                {/* 左側分類 Tab */}
                <div className="w-20 flex-shrink-0">
                  <div className="bg-gray-700/50 backdrop-blur-sm rounded-xl border border-gray-600/50 p-1">
                    <div className="space-y-1">
                      {Object.keys(EQUIPMENT_BY_CATEGORY_WITH_SCROLLS).map(
                        (category) => (
                          <button
                            key={category}
                            onClick={() =>
                              setActiveCategory(
                                category as keyof typeof EQUIPMENT_BY_CATEGORY_WITH_SCROLLS
                              )
                            }
                            className={`relative w-full px-2 py-2 text-xs font-medium rounded-lg transition-all duration-300 text-center overflow-hidden ${
                              activeCategory === category
                                ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                                : "bg-gray-600/30 text-gray-300 hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-purple-500/20 hover:text-white border border-gray-600/50"
                            }`}
                          >
                            {activeCategory === category && (
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/30 to-purple-400/30 rounded-lg animate-pulse"></div>
                            )}
                            <span className="relative z-10 whitespace-nowrap">
                              {category}
                            </span>
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>

                {/* 右側裝備選項 */}
                <div className="flex-1">
                  <div className="bg-gray-700/30 backdrop-blur-sm rounded-xl border border-gray-600/50 p-3">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                      {EQUIPMENT_BY_CATEGORY_WITH_SCROLLS[activeCategory]?.map(
                        (equipment) => (
                          <button
                            key={equipment}
                            onClick={() => handleEquipmentChange(equipment)}
                            className={`relative p-2 rounded-lg border transition-all duration-300 group overflow-hidden ${
                              selectedEquipmentType === equipment
                                ? "border-blue-400 bg-gradient-to-br from-blue-500/20 to-purple-500/20 shadow-lg shadow-blue-500/25"
                                : "border-gray-600/50 bg-gray-600/20 hover:border-blue-400/60 hover:bg-gradient-to-br hover:from-blue-500/10 hover:to-purple-500/10"
                            }`}
                          >
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/0 to-purple-400/0 group-hover:from-blue-400/10 group-hover:to-purple-400/10 transition-all duration-300 rounded-lg"></div>
                            <div className="relative z-10 text-center">
                              <div
                                className={`text-lg mb-1 transition-all duration-300 ${
                                  selectedEquipmentType === equipment
                                    ? "scale-110"
                                    : "group-hover:scale-110"
                                }`}
                              >
                                {EQUIPMENT_ICONS[equipment] || "📦"}
                              </div>
                              <div
                                className={`text-xs font-medium transition-colors duration-300 whitespace-nowrap ${
                                  selectedEquipmentType === equipment
                                    ? "text-blue-300"
                                    : "text-gray-300 group-hover:text-white"
                                }`}
                              >
                                {equipment}
                              </div>
                            </div>
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {selectedEquipmentType && (
                <div className="mt-4 p-3 bg-gradient-to-r from-green-600/20 to-emerald-600/20 backdrop-blur-sm rounded-xl border border-green-500/30">
                  <div className="flex items-center space-x-3">
                    <div className="text-lg animate-pulse">
                      {EQUIPMENT_ICONS[selectedEquipmentType]}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-white text-sm">
                        已選擇：{selectedEquipmentType}
                      </div>
                      <div className="text-xs text-gray-300">
                        可用卷軸：{availableScrolls.length} 種
                      </div>
                    </div>
                    <div className="w-5 h-5 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/50">
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 期望增加值設定 */}
            <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6">
              <div className="text-center mb-6">
                <div className="inline-flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl border border-purple-500/30 backdrop-blur-sm">
                  <span className="text-2xl">🎯</span>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    期望增加值
                  </h3>
                </div>
              </div>

              {!selectedEquipmentType ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">請先選擇裝備類型</div>
                  <div className="text-sm text-gray-500">
                    選擇裝備後可以設定期望增加的屬性值
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* 屬性選擇網格 */}
                  <div className="grid grid-cols-2 gap-3">
                    {availableAttributes.map((attribute) => {
                      const isSelected = attribute in targetIncrements;
                      return (
                        <button
                          key={attribute}
                          onClick={() => {
                            if (isSelected) {
                              removeTargetIncrement(attribute);
                            } else {
                              addTargetIncrement(attribute);
                            }
                          }}
                          className={`
                            group relative p-4 rounded-2xl border transition-all duration-300 transform hover:scale-105
                            ${
                              isSelected
                                ? "bg-gradient-to-br from-blue-500/30 to-purple-500/30 border-blue-400/50 shadow-lg shadow-blue-500/20"
                                : "bg-gray-700/40 border-gray-600/50 hover:bg-gray-700/60 hover:border-gray-500"
                            }
                          `}
                        >
                          <div className="flex flex-col items-center space-y-2">
                            <div className="text-2xl">
                              {ATTRIBUTE_ICONS[attribute] || "📝"}
                            </div>
                            <div className="text-sm font-medium text-white text-center">
                              {attribute}
                            </div>
                            {isSelected && (
                              <div className="w-5 h-5 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/50">
                                <svg
                                  className="w-3 h-3 text-white"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* 期望增加值設定 */}
                  {Object.keys(targetIncrements).length > 0 && (
                    <div className="space-y-3 border-t border-gray-600/30 pt-4">
                      <h4 className="text-sm font-semibold text-gray-300 mb-3">
                        期望增加值設定
                      </h4>
                      {Object.entries(targetIncrements).map(
                        ([attribute, value]) => (
                          <div
                            key={attribute}
                            className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-400/20 rounded-lg"
                          >
                            <div className="text-lg">
                              {ATTRIBUTE_ICONS[attribute] || "📝"}
                            </div>
                            <div className="flex-1 text-white font-medium">
                              +{attribute}
                            </div>
                            <NumberInput
                              value={value}
                              onChange={(newValue) =>
                                updateTargetIncrement(attribute, newValue)
                              }
                              min={1}
                              className="w-20"
                            />
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 成本設置 */}
            <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <span className="mr-2">💰</span>
                  成本計算
                </h3>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={costSettings.enabled}
                    onChange={(e) =>
                      setCostSettings((prev) => ({
                        ...prev,
                        enabled: e.target.checked,
                      }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {costSettings.enabled && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      乾淨裝備價格
                    </label>
                    <NumberInput
                      value={costSettings.cleanEquipmentPrice}
                      onChange={(value) =>
                        setCostSettings((prev) => ({
                          ...prev,
                          cleanEquipmentPrice: value,
                        }))
                      }
                      suffix="雪花"
                      className="w-full pr-12"
                    />
                  </div>

                  {availableScrolls.length > 0 && (
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">
                        卷軸價格設定
                      </label>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {availableScrolls.map((scroll) => (
                          <div
                            key={scroll.id}
                            className="flex items-center gap-2 text-sm"
                          >
                            <span className="flex-1 text-gray-300 truncate">
                              {scroll.name}
                            </span>
                            <NumberInput
                              value={costSettings.scrollPrices[scroll.id] || 0}
                              onChange={(value) =>
                                setCostSettings((prev) => ({
                                  ...prev,
                                  scrollPrices: {
                                    ...prev.scrollPrices,
                                    [scroll.id]: value,
                                  },
                                }))
                              }
                              suffix="雪花"
                              className="w-24 text-xs pr-8"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 停損設置 */}
            <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <span className="mr-2">🛑</span>
                  停損條件
                </h3>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={stopLossSettings.enabled}
                    onChange={(e) =>
                      setStopLossSettings((prev) => ({
                        ...prev,
                        enabled: e.target.checked,
                      }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

              {stopLossSettings.enabled && (
                <div className="space-y-4">
                  <div className="text-sm text-gray-300 mb-3 p-3 bg-gray-700/30 rounded-lg">
                    <p className="font-medium text-gray-200 mb-1">
                      停損機制說明：
                    </p>
                    <p>
                      當衝完指定張數的卷軸後，如果某屬性未達到最低要求，系統會自動停止繼續衝卷
                    </p>
                  </div>

                  {stopLossSettings.conditions.map((condition, index) => (
                    <div
                      key={index}
                      className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
                    >
                      <div className="flex flex-col gap-3">
                        <div className="text-sm text-red-300 font-medium">
                          停損條件 #{index + 1}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">
                              屬性
                            </label>
                            <select
                              value={condition.attribute}
                              onChange={(e) => {
                                const newConditions = [
                                  ...stopLossSettings.conditions,
                                ];
                                newConditions[index].attribute = e.target.value;
                                setStopLossSettings((prev) => ({
                                  ...prev,
                                  conditions: newConditions,
                                }));
                              }}
                              className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                            >
                              {availableAttributes.map((attr) => (
                                <option key={attr} value={attr}>
                                  {attr}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs text-gray-400 mb-1">
                              最低要求
                            </label>
                            <NumberInput
                              value={condition.minValue}
                              onChange={(value) => {
                                const newConditions = [
                                  ...stopLossSettings.conditions,
                                ];
                                newConditions[index].minValue = value;
                                setStopLossSettings((prev) => ({
                                  ...prev,
                                  conditions: newConditions,
                                }));
                              }}
                              className="w-full text-sm"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-300">
                              檢查時機：第
                            </span>
                            <NumberInput
                              value={condition.scrollIndex}
                              onChange={(value) => {
                                const newConditions = [
                                  ...stopLossSettings.conditions,
                                ];
                                newConditions[index].scrollIndex = value;
                                setStopLossSettings((prev) => ({
                                  ...prev,
                                  conditions: newConditions,
                                }));
                              }}
                              min={1}
                              max={selectedScrolls.length || 999}
                              className="w-16 text-sm"
                            />
                            <span className="text-sm text-gray-300">
                              張卷軸後
                            </span>
                          </div>

                          <button
                            onClick={() => {
                              const newConditions =
                                stopLossSettings.conditions.filter(
                                  (_, i) => i !== index
                                );
                              setStopLossSettings((prev) => ({
                                ...prev,
                                conditions: newConditions,
                              }));
                            }}
                            className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded text-sm transition-colors"
                          >
                            刪除
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {availableAttributes.length > 0 && (
                    <button
                      onClick={() => {
                        setStopLossSettings((prev) => ({
                          ...prev,
                          conditions: [
                            ...prev.conditions,
                            {
                              attribute: availableAttributes[0],
                              minValue: 1,
                              scrollIndex: 1,
                            },
                          ],
                        }));
                      }}
                      className="w-full py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 font-medium rounded-lg border border-red-500/30 transition-all"
                    >
                      + 添加停損條件
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 模擬設置 */}
            <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <span className="mr-2">🎮</span>
                模擬設置
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">
                    模擬次數 (100 - {MAX_SIMULATION_COUNT.toLocaleString()})
                  </label>
                  <NumberInput
                    value={simulationCount}
                    onChange={setSimulationCount}
                    min={100}
                    max={MAX_SIMULATION_COUNT}
                    className="w-full"
                  />
                </div>

                <button
                  onClick={runSimulation}
                  disabled={selectedScrolls.length === 0 || isSimulating}
                  className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold rounded-xl transition-all"
                >
                  {isSimulating ? "🔄 模擬中..." : "🚀 開始模擬"}
                </button>

                {selectedScrolls.length === 0 && (
                  <p className="text-center text-sm text-gray-400">
                    請先選擇卷軸順序
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 中間：卷軸選擇與排序 */}
          <div className="lg:col-span-1 space-y-6">
            {/* 可用卷軸 */}
            <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <span className="mr-2">📜</span>
                可用卷軸
              </h3>

              {availableScrolls.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-center py-4">
                    請先選擇裝備類型
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {availableScrolls.map((scroll) => (
                    <div
                      key={scroll.id}
                      className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-all"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-white text-sm">
                          {scroll.name}
                        </div>
                        <div className="text-xs text-gray-400">
                          {scroll.successRate}% | +{scroll.primaryEffect.value}{" "}
                          {scroll.primaryEffect.stat}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <NumberInput
                          value={scrollCounts[scroll.id] || 1}
                          onChange={(count) => {
                            setScrollCounts((prev) => ({
                              ...prev,
                              [scroll.id]: count,
                            }));
                          }}
                          min={1}
                          max={10}
                          className="w-12 text-xs"
                        />
                        <button
                          onClick={() => {
                            const count = scrollCounts[scroll.id] || 1;
                            addScrollsInBatch(scroll.id, count);
                          }}
                          className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded text-sm transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 衝卷順序 */}
            <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <span className="mr-2">🎯</span>
                  衝卷順序
                </h3>
                {selectedScrolls.length > 0 && (
                  <button
                    onClick={() => setSelectedScrolls([])}
                    className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded text-sm transition-colors"
                  >
                    清空全部
                  </button>
                )}
              </div>

              {selectedScrolls.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-2">尚未選擇卷軸</p>
                  <p className="text-sm text-gray-500">
                    從左側選擇卷軸，然後拖拽調整順序
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {selectedScrolls.map((scrollId, index) => {
                    const scroll = availableScrolls.find(
                      (s) => s.id === scrollId
                    );
                    if (!scroll) return null;

                    return (
                      <div
                        key={`${scrollId}-${index}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragEnd={handleDragEnd}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, index)}
                        className={`flex items-center space-x-3 p-3 rounded-lg cursor-move transition-all ${
                          draggedIndex === index
                            ? "bg-purple-500/20 border-purple-500/50"
                            : "bg-gray-700/30 hover:bg-gray-700/50"
                        } border border-gray-600/30`}
                      >
                        <span className="text-purple-400 font-bold min-w-[24px]">
                          {index + 1}.
                        </span>

                        <div className="flex-1">
                          <div className="font-medium text-white">
                            {scroll.name}
                          </div>
                          <div className="text-sm text-gray-400">
                            {scroll.successRate}% | {scroll.primaryEffect.value}
                            + {scroll.primaryEffect.stat}
                          </div>
                        </div>

                        <button
                          onClick={() => removeScroll(index)}
                          className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded text-sm transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 右側：結果顯示 */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <span className="mr-2">📈</span>
                模擬結果
              </h3>

              {isSimulating ? (
                <div className="text-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full mx-auto mb-4"></div>
                  <p className="text-purple-300">模擬計算中...</p>
                </div>
              ) : results.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400">尚未開始模擬</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* 統計資訊 */}
                  {resultStats && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                        <div className="text-blue-300 text-sm">達成期望率</div>
                        <div className="text-white font-bold text-lg">
                          {resultStats.successRate.toFixed(1)}%
                        </div>
                      </div>
                      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                        <div className="text-green-300 text-sm">平均用卷</div>
                        <div className="text-white font-bold text-lg">
                          {resultStats.averageScrollsUsed.toFixed(1)}
                        </div>
                      </div>
                      {costSettings.enabled && resultStats.totalCost && (
                        <div className="col-span-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                          <div className="text-yellow-300 text-sm">總成本</div>
                          <div className="text-white font-bold text-lg">
                            {resultStats.totalCost.toLocaleString()} 雪花
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 結果分類 */}
                  <div className="space-y-4">
                    {/* 停損：觸發停損條件 */}
                    {groupedResults.stopLoss.length > 0 && (
                      <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg">
                        <button
                          onClick={() => {
                            const newExpanded = new Set(expandedGroups);
                            if (newExpanded.has("stopLoss")) {
                              newExpanded.delete("stopLoss");
                            } else {
                              newExpanded.add("stopLoss");
                            }
                            setExpandedGroups(newExpanded);
                          }}
                          className="w-full p-4 text-left hover:bg-orange-500/5 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-orange-300 mb-1">
                                🛑 停損：未達條件 (
                                {groupedResults.stopLoss.length} 次)
                              </div>
                              <div className="text-sm text-gray-400">
                                {(
                                  (groupedResults.stopLoss.length /
                                    results.length) *
                                  100
                                ).toFixed(1)}
                                % 的嘗試因觸發停損條件而提前停止
                              </div>
                            </div>
                            <div className="text-orange-300">
                              {expandedGroups.has("stopLoss") ? "▼" : "▶"}
                            </div>
                          </div>
                        </button>

                        {expandedGroups.has("stopLoss") && (
                          <div className="px-4 pb-4 border-t border-orange-500/20">
                            <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                              {groupedResults.stopLoss
                                .slice(0, 50)
                                .map((result, idx) => (
                                  <div
                                    key={result.id}
                                    className="text-xs p-2 bg-orange-500/5 rounded"
                                  >
                                    <div className="flex justify-between">
                                      <span className="text-orange-300">
                                        #{idx + 1}
                                      </span>
                                      <span className="text-gray-400">
                                        第{result.scrollsUsed}張後停止
                                      </span>
                                    </div>
                                    <div className="text-gray-400 mt-1">
                                      {Object.entries(result.finalStats).map(
                                        ([attr, value]) => (
                                          <span key={attr} className="mr-3">
                                            {attr}:+{value}
                                          </span>
                                        )
                                      )}
                                    </div>
                                    {costSettings.enabled &&
                                      result.totalCost && (
                                        <div className="text-gray-400 mt-1">
                                          花費:{" "}
                                          {result.totalCost.toLocaleString()}
                                          雪花
                                        </div>
                                      )}
                                  </div>
                                ))}
                              {groupedResults.stopLoss.length > 50 && (
                                <div className="text-xs text-gray-500 text-center">
                                  ...還有{groupedResults.stopLoss.length - 50}
                                  個結果
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 成功的結果按屬性分組 */}
                    {Object.entries(groupedResults.byAttribute)
                      .sort(([, a], [, b]) => b.length - a.length) // 按次數降序排列
                      .map(([key, groupResults]) => (
                        <div
                          key={key}
                          className="bg-green-500/10 border border-green-500/30 rounded-lg"
                        >
                          <button
                            onClick={() => {
                              const newExpanded = new Set(expandedGroups);
                              if (newExpanded.has(key)) {
                                newExpanded.delete(key);
                              } else {
                                newExpanded.add(key);
                              }
                              setExpandedGroups(newExpanded);
                            }}
                            className="w-full p-4 text-left hover:bg-green-500/5 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-semibold text-green-300 mb-1">
                                  ✅ {key} ({groupResults.length} 次)
                                </div>
                                <div className="text-sm text-gray-400">
                                  {(
                                    (groupResults.length / results.length) *
                                    100
                                  ).toFixed(1)}
                                  % 的嘗試達到此結果
                                </div>
                              </div>
                              <div className="text-green-300">
                                {expandedGroups.has(key) ? "▼" : "▶"}
                              </div>
                            </div>
                          </button>

                          {expandedGroups.has(key) && (
                            <div className="px-4 pb-4 border-t border-green-500/20">
                              <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                                {groupResults
                                  .slice(0, 50)
                                  .map((result, idx) => (
                                    <div
                                      key={result.id}
                                      className="text-xs p-2 bg-green-500/5 rounded"
                                    >
                                      <div className="flex justify-between">
                                        <span className="text-green-300">
                                          #{idx + 1}
                                        </span>
                                        <span className="text-gray-400">
                                          用了{result.scrollsUsed}張卷軸
                                        </span>
                                      </div>
                                      <div className="text-gray-400 mt-1">
                                        {Object.entries(result.finalStats).map(
                                          ([attr, value]) => (
                                            <span key={attr} className="mr-3">
                                              {attr}:+{value}
                                            </span>
                                          )
                                        )}
                                      </div>
                                      {costSettings.enabled &&
                                        result.totalCost && (
                                          <div className="text-gray-400 mt-1">
                                            花費:{" "}
                                            {result.totalCost.toLocaleString()}
                                            雪花
                                          </div>
                                        )}
                                    </div>
                                  ))}
                                {groupResults.length > 50 && (
                                  <div className="text-xs text-gray-500 text-center">
                                    ...還有{groupResults.length - 50}個結果
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
