import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import type { Scroll } from "../types/index.ts";
import { SCROLLS } from "../constants/scrolls.ts";
import {
  EQUIPMENT_BY_CATEGORY_WITH_SCROLLS,
  EQUIPMENT_ICONS,
  ATTRIBUTE_ICONS,
} from "../constants/equipment.ts";
import { getAvailableAttributesForEquipment } from "../constants/scrolls.ts";
import scroll10 from "../assets/10.webp";
import scroll30 from "../assets/30.webp";
import scroll60 from "../assets/60.webp";
import scroll100 from "../assets/100.webp";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import * as RadixSelect from "@radix-ui/react-select";

// 模擬結果
interface SimulationResult {
  id: number;
  success: boolean;
  finalStats: { [key: string]: number };
  scrollsUsed: number;
  totalCost?: number; // 總成本（如果啟用成本計算）
  stopReason: "completed" | "stop_loss";
  scrollUsage: { [scrollId: string]: number }; // 每種卷軸的使用數量
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
  scrollUsageStats: { [scrollId: string]: number }; // 每種卷軸的總使用數量
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
  const [scrollCounts, setScrollCounts] = useState<{
    [scrollId: string]: number;
  }>({});

  // 模擬設置
  const [simulationCount, setSimulationCount] = useState(100);
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

  // 在 ScrollSimulator 組件內部 state 區塊新增 maxScrollCount 狀態
  const [maxScrollCount, setMaxScrollCount] = useState<number>(7);

  const MAX_SIMULATION_COUNT = 1000;

  // 在 ScrollSimulator 組件內部加一個 ref
  const resultRef = useRef<HTMLDivElement>(null);

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

  // 動態取得目前衝卷順序中所有捲軸能衝的屬性（去重）
  const availableScrollAttributes = useMemo(() => {
    if (selectedScrolls.length === 0) return [];
    const attrs = selectedScrolls
      .map((scrollId) => {
        const scroll = availableScrolls.find((s) => s.id === scrollId);
        if (!scroll) return [];
        // 主屬性
        const arr = [scroll.primaryEffect.stat];
        // 副屬性
        if (scroll.secondaryEffects) {
          arr.push(...scroll.secondaryEffects.map((e) => e.stat));
        }
        return arr;
      })
      .flat();
    return Array.from(new Set(attrs));
  }, [selectedScrolls, availableScrolls]);

  // 在 ScrollSimulator 組件內部頂部宣告 sensors，啟用 activationConstraint: { distance: 8 }
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // 數字輸入框組件 - 修復焦點問題
  const NumberInput: React.FC<{
    value: number;
    onChange: (value: number) => void;
    placeholder?: string;
    min?: number;
    max?: number;
    className?: string;
    suffix?: string;
    allowDecimal?: boolean;
  }> = ({
    value,
    onChange,
    placeholder = "0",
    min = 0,
    max,
    className = "",
    suffix = "",
    allowDecimal = false,
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
      e.target.select();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      // 允許小數或整數
      if (
        inputValue === "" ||
        (allowDecimal
          ? /^\d*(\.\d*)?$/.test(inputValue)
          : /^\d+$/.test(inputValue))
      ) {
        setInternalValue(inputValue);
      }
    };

    const handleBlur = () => {
      setIsFocused(false);
      let numValue = allowDecimal
        ? parseFloat(internalValue)
        : parseInt(internalValue);
      if (isNaN(numValue)) numValue = 0;
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
          inputMode={allowDecimal ? "decimal" : "numeric"}
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
    setSelectedScrolls((prev) => {
      const canAdd = Math.max(0, maxScrollCount - prev.length);
      if (canAdd <= 0) return prev;
      const addCount = Math.min(count, canAdd);
      return [...prev, ...Array(addCount).fill(scrollId)];
    });
  };

  // 當 maxScrollCount 被調小時，自動移除多餘捲軸
  useEffect(() => {
    setSelectedScrolls((prev) =>
      prev.length > maxScrollCount ? prev.slice(0, maxScrollCount) : prev
    );
  }, [maxScrollCount]);

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
      const scrollUsage: { [scrollId: string]: number } = {};

      for (const scrollId of selectedScrolls) {
        scrollsUsed++;
        scrollUsage[scrollId] = (scrollUsage[scrollId] || 0) + 1;

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
                  scrollUsage,
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
        scrollUsage,
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
      scrollUsageStats: allResults.reduce((acc, r) => {
        for (const scrollId in r.scrollUsage) {
          acc[scrollId] = (acc[scrollId] || 0) + r.scrollUsage[scrollId];
        }
        return acc;
      }, {} as { [scrollId: string]: number }),
    };

    setResultStats(stats);
    setIsSimulating(false);

    // 模擬結束後自動滾動到結果區塊
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
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

  // 在檔案最上方 import 卷軸 icon
  // 在組件內部加一個根據 successRate 回傳 icon 的小工具函式
  const getScrollIcon = (successRate: number) => {
    if (successRate === 10) return scroll10;
    if (successRate === 30) return scroll30;
    if (successRate === 60) return scroll60;
    if (successRate === 100) return scroll100;
    return scroll10; // fallback
  };

  // SortableItem 元件 for dnd-kit
  function SortableItem({
    id,
    index,
    scroll,
    onRemove,
  }: {
    id: string;
    index: number;
    scroll: Scroll;
    onRemove: (idx: number) => void;
  }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id });
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      boxShadow: isDragging ? "0 4px 16px 0 rgba(80,180,255,0.25)" : undefined,
      zIndex: isDragging ? 50 : undefined,
    };
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-move mb-2 ${
          isDragging
            ? "border-blue-400 bg-blue-500/20 shadow-lg"
            : "border-gray-600/50 bg-gray-700/30 hover:bg-gray-700/50"
        }`}
      >
        <img
          src={getScrollIcon(scroll.successRate)}
          alt={scroll.successRate + "% icon"}
          className="w-8 h-8 rounded shadow border border-gray-600/50 bg-gray-800/60"
        />
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm font-mono">#{index + 1}</span>
          <div className="px-4 py-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md min-w-[48px] text-center">
            {scroll.successRate}%
          </div>
        </div>
        <div className="flex-1">
          <div className="font-medium text-white text-sm">{scroll.name}</div>
          <div className="text-xs text-gray-400">
            {/* <div>{scroll.successRate}%</div>  // 移除重複的%數顯示 */}
            <div className="flex flex-wrap gap-2 mt-1">
              {[
                {
                  stat: scroll.primaryEffect.stat,
                  value: scroll.primaryEffect.value,
                },
                ...(scroll.secondaryEffects || []),
              ].map((effect) => (
                <span
                  key={effect.stat}
                  className="bg-gray-600/40 rounded-full px-2 py-0.5 text-xs text-gray-100"
                >
                  +{effect.value} {effect.stat}
                </span>
              ))}
            </div>
          </div>
        </div>
        <button
          onClick={() => onRemove(index)}
          className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded text-sm transition-colors"
        >
          移除
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-purple-900/20">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-300 to-gray-400 bg-clip-text text-transparent mb-4">
            Artale賭狗計算機
          </h1>
          <p className="text-gray-400 text-lg mb-2">
            選擇裝備、拖拽卷軸順序、設定期望值與停損條件，然後點擊「開始模擬」即可快速計算各種衝卷結果分布、平均成本與成功率。
          </p>
          <p className="text-gray-500 text-sm">
            本工具支援所有裝備類型、全卷軸組合、停損條件、成本分析與結果分組排序，適合各種衝卷策略模擬與風險評估。所有計算皆於本地端執行，無需登入、無資料上傳，請放心使用。
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左側：裝備選擇和期望增加值 */}
          <div className="lg:col-span-1 space-y-6">
            {/* 裝備選擇 */}
            <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6">
              {/* 選擇裝備區塊 title */}
              <div className="text-center mb-3">
                <div className="flex items-center mb-1">
                  <span className="mr-2 text-2xl">⚔️</span>
                  <h3 className="text-lg font-semibold text-white">選擇裝備</h3>
                </div>
              </div>

              <div className="flex space-x-4">
                {/* 左側分類 Tab */}
                <div className="w-20 flex-shrink-0">
                  <div className="bg-gray-700/50 backdrop-blur-sm rounded-xl border border-gray-600/50 p-1 min-h-0 max-h-[320px] overflow-y-auto">
                    <div className="space-y-3">
                      {Object.keys(EQUIPMENT_BY_CATEGORY_WITH_SCROLLS).map(
                        (category) => (
                          <button
                            key={category}
                            onClick={() =>
                              setActiveCategory(
                                category as keyof typeof EQUIPMENT_BY_CATEGORY_WITH_SCROLLS
                              )
                            }
                            className={`relative w-full px-2 py-3 text-base font-medium rounded-lg transition-all duration-300 text-center overflow-hidden ${
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
                  <div className="bg-gray-700/30 backdrop-blur-sm rounded-xl border border-gray-600/50 p-3 max-h-[352px] overflow-y-auto">
                    <div
                      className="grid gap-2"
                      style={{
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(96px, 1fr))",
                      }}
                    >
                      {EQUIPMENT_BY_CATEGORY_WITH_SCROLLS[activeCategory]?.map(
                        (equipment) => (
                          <button
                            key={equipment}
                            onClick={() => handleEquipmentChange(equipment)}
                            className={
                              `relative p-2 rounded-lg border transition-all duration-300 group overflow-hidden w-full` +
                              (selectedEquipmentType === equipment
                                ? " border-blue-400 bg-gradient-to-br from-blue-500/20 to-purple-500/20 shadow-lg shadow-blue-500/25"
                                : " border-gray-600/50 bg-gray-600/20 hover:border-blue-400/60 hover:bg-gradient-to-br hover:from-blue-500/10 hover:to-purple-500/10")
                            }
                          >
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/0 to-purple-400/0 group-hover:from-blue-400/10 group-hover:to-purple-400/10 transition-all duration-300 rounded-lg"></div>
                            <div className="relative z-10 flex flex-col items-center justify-center text-center h-full">
                              <div
                                className={`text-lg mb-1 transition-all duration-300 flex items-center justify-center w-full ${
                                  selectedEquipmentType === equipment
                                    ? "scale-110"
                                    : "group-hover:scale-110"
                                }`}
                                style={{ minHeight: "36px" }}
                              >
                                {EQUIPMENT_ICONS[equipment] ? (
                                  <img
                                    src={EQUIPMENT_ICONS[equipment]}
                                    alt={equipment}
                                    className="w-8 h-8 object-contain mx-auto"
                                    onError={(e) => {
                                      const target =
                                        e.currentTarget as HTMLElement;
                                      target.style.display = "none";
                                      const fallback =
                                        target.nextElementSibling as HTMLElement;
                                      if (fallback) {
                                        fallback.style.display = "block";
                                      }
                                    }}
                                  />
                                ) : null}
                                <span
                                  className="text-xl"
                                  style={{
                                    display: EQUIPMENT_ICONS[equipment]
                                      ? "none"
                                      : "block",
                                  }}
                                >
                                  📦
                                </span>
                              </div>
                              <div className="text-xs mt-1 text-gray-200 font-medium whitespace-nowrap text-center">
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
                      {EQUIPMENT_ICONS[selectedEquipmentType] ? (
                        <img
                          src={EQUIPMENT_ICONS[selectedEquipmentType]}
                          alt={selectedEquipmentType}
                          className="w-8 h-8 object-contain"
                          style={{
                            display: "inline-block",
                            verticalAlign: "middle",
                          }}
                        />
                      ) : null}
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
              {/* 期望增加值區塊 title + 備註 */}
              <div className="mb-3">
                <div className="flex items-center mb-1">
                  <span className="mr-2 text-2xl">🎯</span>
                  <h3 className="text-lg font-semibold text-white">
                    期望增加值
                  </h3>
                </div>
                <div className="text-xs text-gray-400 mb-1">
                  請輸入期望「未衝裝備」進行衝卷後，期望增加的數值
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
                  <div className="grid grid-cols-3 lg:grid-cols-4 gap-3">
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
                          className={`relative w-full p-2 rounded-lg border transition-all duration-300 group overflow-hidden min-h-[56px] flex flex-col items-center justify-center text-center ${
                            isSelected
                              ? "border-purple-400 bg-gradient-to-br from-purple-500/20 to-pink-500/20 shadow-lg shadow-purple-500/25"
                              : "border-gray-600/50 bg-gray-600/20 hover:border-purple-400/60 hover:bg-gradient-to-br hover:from-purple-500/10 hover:to-pink-500/10"
                          }`}
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-purple-400/0 to-pink-400/0 group-hover:from-purple-400/10 group-hover:to-pink-400/10 transition-all duration-300 rounded-xl"></div>
                          <div className="relative z-10 text-center">
                            <div
                              className={`text-base mb-1 transition-all duration-300 flex items-center justify-center w-full ${
                                isSelected
                                  ? "scale-105"
                                  : "group-hover:scale-105"
                              }`}
                              style={{ minHeight: "24px" }}
                            >
                              {ATTRIBUTE_ICONS[attribute] || "📊"}
                            </div>
                            <div
                              className={`text-xs font-medium transition-colors duration-300 ${
                                isSelected
                                  ? "text-purple-300"
                                  : "text-gray-300 group-hover:text-white"
                              }`}
                            >
                              {attribute}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* 已選擇的屬性值設定 */}
                  {Object.keys(targetIncrements).length > 0 && (
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-white">
                        設定期望值：
                      </div>
                      {Object.entries(targetIncrements).map(([attr, value]) => (
                        <div
                          key={attr}
                          className="flex items-center gap-3 p-3 bg-purple-500/10 rounded-lg border border-purple-500/30"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-lg">
                              {ATTRIBUTE_ICONS[attr] || "📊"}
                            </span>
                            <span className="text-sm text-purple-300 font-medium">
                              {attr}
                            </span>
                          </div>
                          <NumberInput
                            value={value}
                            onChange={(newValue) =>
                              updateTargetIncrement(attr, newValue)
                            }
                            className="flex-1"
                            min={1}
                          />
                          <button
                            onClick={() => removeTargetIncrement(attr)}
                            className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded text-sm transition-colors"
                          >
                            移除
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 中間：卷軸選擇與排序 */}
          <div className="lg:col-span-1 space-y-6">
            {/* 可用卷軸 */}
            <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6">
              <div className="flex items-center mb-3 gap-3">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <span className="mr-2">📜</span>
                  可用卷軸
                </h3>
                <div className="flex items-center gap-2 ml-4">
                  <span className="text-xs text-gray-300">
                    本裝備可衝捲軸數
                  </span>
                  <NumberInput
                    value={maxScrollCount}
                    onChange={setMaxScrollCount}
                    min={0}
                    max={12}
                    className="w-14 text-xs"
                  />
                </div>
              </div>

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
                      <img
                        src={getScrollIcon(scroll.successRate)}
                        alt={scroll.successRate + "% icon"}
                        className="w-8 h-8 rounded shadow border border-gray-600/50 bg-gray-800/60"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-white text-sm">
                          {scroll.name}
                        </div>
                        <div className="text-xs text-gray-400">
                          <div className="flex flex-wrap gap-2 mt-1">
                            {[
                              {
                                stat: scroll.primaryEffect.stat,
                                value: scroll.primaryEffect.value,
                              },
                              ...(scroll.secondaryEffects || []),
                            ].map((effect) => (
                              <span
                                key={effect.stat}
                                className="bg-gray-600/40 rounded-full px-2 py-0.5 text-xs text-gray-100"
                              >
                                +{effect.value} {effect.stat}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <NumberInput
                        value={scrollCounts[scroll.id] || 1}
                        onChange={(value) =>
                          setScrollCounts((prev) => ({
                            ...prev,
                            [scroll.id]: value,
                          }))
                        }
                        min={1}
                        max={maxScrollCount - selectedScrolls.length}
                        className="w-16 text-sm"
                      />
                      <button
                        onClick={() =>
                          addScrollsInBatch(
                            scroll.id,
                            scrollCounts[scroll.id] || 1
                          )
                        }
                        className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={selectedScrolls.length >= maxScrollCount}
                        title={
                          selectedScrolls.length >= maxScrollCount
                            ? "已達可衝捲軸上限"
                            : ""
                        }
                      >
                        添加
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 衝卷順序 */}
            <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6">
              <div className="flex items-center mb-3 gap-3">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <span className="mr-2">🔄</span>
                  衝卷順序
                </h3>
                <div className="ml-4 text-xs text-gray-400">
                  {selectedScrolls.length} / {maxScrollCount} 捲軸已新增
                </div>
              </div>

              {selectedScrolls.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-center py-4">
                    請從上方新增捲軸至此處
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={({
                      active,
                      over,
                    }: {
                      active: { id: string };
                      over: { id: string } | null;
                    }) => {
                      if (active.id !== over?.id) {
                        const oldIndex = selectedScrolls.findIndex(
                          (id) => id === active.id
                        );
                        const newIndex = selectedScrolls.findIndex(
                          (id) => id === over?.id
                        );
                        setSelectedScrolls((items) =>
                          arrayMove(items, oldIndex, newIndex)
                        );
                      }
                    }}
                  >
                    <SortableContext
                      items={selectedScrolls.map((id, i) => `${id}-${i}`)}
                      strategy={verticalListSortingStrategy}
                    >
                      {selectedScrolls.map((scrollId, index) => {
                        const scroll = SCROLLS.find((s) => s.id === scrollId);
                        if (!scroll) return null;
                        return (
                          <SortableItem
                            key={`${scrollId}-${index}`}
                            id={`${scrollId}-${index}`}
                            index={index}
                            scroll={scroll}
                            onRemove={removeScroll}
                          />
                        );
                      })}
                    </SortableContext>
                  </DndContext>
                </div>
              )}
            </div>
          </div>

          {/* 右側：模擬設置和結果 */}
          <div className="lg:col-span-1 space-y-6">
            {/* 成本設置 */}
            <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6">
              <h3 className="text-lg font-semibold text-white mb-1 flex items-center">
                <span className="mr-2">💰</span>
                成本設置
              </h3>
              <div className="text-xs text-gray-400 mb-2">
                成本設置可設定未衝前之裝備價格以及捲軸價格
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="enableCost"
                    checked={costSettings.enabled}
                    onChange={(e) =>
                      setCostSettings((prev) => ({
                        ...prev,
                        enabled: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                  />
                  <label htmlFor="enableCost" className="text-sm text-gray-300">
                    啟用成本計算
                  </label>
                </div>
                {costSettings.enabled && selectedScrolls.length === 0 && (
                  <div className="text-center text-red-300 py-8 text-base font-semibold">
                    請先決定衝卷順序
                  </div>
                )}
                {costSettings.enabled && selectedScrolls.length > 0 && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">
                        尚未衝卷前的裝備價格 (雪花)
                      </label>
                      <NumberInput
                        value={costSettings.cleanEquipmentPrice}
                        onChange={(value) =>
                          setCostSettings((prev) => ({
                            ...prev,
                            cleanEquipmentPrice: value,
                          }))
                        }
                        className="w-full text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">
                        卷軸價格設定
                      </label>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {/* 只顯示衝卷順序中有用到的捲軸（去重） */}
                        {Array.from(new Set(selectedScrolls)).map(
                          (scrollId) => {
                            const scroll = availableScrolls.find(
                              (s) => s.id === scrollId
                            );
                            if (!scroll) return null;
                            return (
                              <div
                                key={scroll.id}
                                className="flex items-center gap-2 p-2 bg-gray-700/30 rounded"
                              >
                                <span className="text-xs text-gray-300 flex-1 truncate">
                                  {scroll.name}
                                </span>
                                <NumberInput
                                  value={
                                    costSettings.scrollPrices[scroll.id] || 0
                                  }
                                  onChange={(value) =>
                                    setCostSettings((prev) => ({
                                      ...prev,
                                      scrollPrices: {
                                        ...prev.scrollPrices,
                                        [scroll.id]: value,
                                      },
                                    }))
                                  }
                                  className="w-20 text-xs"
                                  allowDecimal={true}
                                />
                                <span className="text-xs text-gray-400">
                                  雪花
                                </span>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 停損設置 */}
            <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6">
              {/* 停損設置區塊 title + 備註 */}
              <h3 className="text-lg font-semibold text-white mb-1 flex items-center">
                <span className="mr-2">🛑</span>
                停損設置
              </h3>
              <div className="text-xs text-gray-400 mb-2">
                停損設置會在指定張數後檢查屬性，若未達最低要求則會跳過當次衝裝，接著衝下一個裝備。適合用來模擬「沒達標就停手」的情境。
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="enableStopLoss"
                    checked={stopLossSettings.enabled}
                    onChange={(e) =>
                      setStopLossSettings((prev) => ({
                        ...prev,
                        enabled: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 text-red-600 bg-gray-700 border-gray-600 rounded focus:ring-red-500 focus:ring-2"
                  />
                  <label
                    htmlFor="enableStopLoss"
                    className="text-sm text-gray-300"
                  >
                    啟用停損條件
                  </label>
                </div>

                {stopLossSettings.enabled && selectedScrolls.length === 0 && (
                  <div className="text-center text-red-300 py-8 text-base font-semibold">
                    請先決定衝卷順序
                  </div>
                )}
                {stopLossSettings.enabled && selectedScrolls.length > 0 && (
                  <div className="space-y-3">
                    {stopLossSettings.conditions.map((condition, index) => (
                      <div
                        key={index}
                        className="p-4 bg-red-500/10 rounded-lg border border-red-500/30"
                      >
                        <div className="text-xs text-red-300 mb-2">
                          停損條件 #{index + 1}
                        </div>
                        {/* 第一行：屬性、最低要求 */}
                        <div className="flex flex-wrap md:flex-nowrap items-center gap-3 mb-3">
                          <div className="flex flex-col md:flex-row md:items-center md:min-w-[140px] w-full md:w-auto">
                            <label className="text-xs text-gray-400 md:mb-0 mb-1 md:mr-2 mr-0 whitespace-nowrap">
                              屬性
                            </label>
                            <RadixSelect.Root
                              value={condition.attribute}
                              onValueChange={(value: string) => {
                                const newConditions = [
                                  ...stopLossSettings.conditions,
                                ];
                                newConditions[index].attribute = value;
                                setStopLossSettings((prev) => ({
                                  ...prev,
                                  conditions: newConditions,
                                }));
                              }}
                            >
                              <RadixSelect.Trigger
                                className="w-28 md:w-32 px-3 py-2 bg-gray-800/80 border border-purple-400/40 rounded-lg text-white text-sm focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all outline-none shadow-sm flex items-center justify-between hover:border-purple-400/80"
                                aria-label="選擇屬性"
                              >
                                <RadixSelect.Value />
                                <RadixSelect.Icon className="ml-2 text-purple-300">
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M19 9l-7 7-7-7"
                                    />
                                  </svg>
                                </RadixSelect.Icon>
                              </RadixSelect.Trigger>
                              <RadixSelect.Portal>
                                <RadixSelect.Content
                                  className="z-[120] mt-1 w-[var(--radix-select-trigger-width)] bg-gray-900/95 border border-purple-400/40 rounded-lg shadow-lg ring-1 ring-black/10 focus:outline-none text-white text-sm max-h-60 overflow-auto animate-fadeIn"
                                  position="popper"
                                  sideOffset={4}
                                >
                                  <RadixSelect.Viewport>
                                    {availableScrollAttributes.map((attr) => (
                                      <RadixSelect.Item
                                        key={attr}
                                        value={attr}
                                        className="cursor-pointer select-none relative pl-8 pr-4 py-2 transition-colors rounded-lg flex items-center data-[highlighted]:bg-purple-500/20 data-[highlighted]:text-purple-200 data-[state=checked]:bg-purple-500/40 data-[state=checked]:text-purple-100 data-[state=checked]:font-bold"
                                      >
                                        <RadixSelect.ItemIndicator className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center">
                                          <svg
                                            className="w-4 h-4 text-purple-300"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                          >
                                            <path
                                              fillRule="evenodd"
                                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                              clipRule="evenodd"
                                            />
                                          </svg>
                                        </RadixSelect.ItemIndicator>
                                        <RadixSelect.ItemText>
                                          {attr}
                                        </RadixSelect.ItemText>
                                      </RadixSelect.Item>
                                    ))}
                                  </RadixSelect.Viewport>
                                </RadixSelect.Content>
                              </RadixSelect.Portal>
                            </RadixSelect.Root>
                          </div>
                          <div className="flex flex-col md:flex-row md:items-center md:min-w-[120px] w-full md:w-auto">
                            <label className="text-xs text-gray-400 md:mb-0 mb-1 md:mr-2 mr-0 whitespace-nowrap">
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
                              min={1}
                              className="w-16 text-sm"
                            />
                          </div>
                        </div>
                        {/* 第二行：檢查時機、刪除按鈕 */}
                        <div className="flex flex-wrap md:flex-nowrap items-center gap-3">
                          <div className="flex flex-row items-center md:min-w-[170px] w-full md:w-auto">
                            <label className="text-xs text-gray-400 mr-2 whitespace-nowrap">
                              檢查時機：
                            </label>
                            <span className="text-sm text-gray-300 mr-1">
                              第
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
                              className="w-14 text-sm"
                            />
                            <span className="text-sm text-gray-300 ml-1">
                              張卷軸後
                            </span>
                          </div>
                          <div className="flex-shrink-0 flex items-center md:ml-4 ml-0 mt-2 md:mt-0">
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
                              className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded text-sm transition-colors h-10 min-w-[56px] flex items-center justify-center"
                            >
                              刪除
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {availableScrollAttributes.length > 0 && (
                      <button
                        onClick={() => {
                          setStopLossSettings((prev) => ({
                            ...prev,
                            conditions: [
                              ...prev.conditions,
                              {
                                attribute: availableScrollAttributes[0],
                                minValue: 1,
                                scrollIndex: 1,
                              },
                            ],
                          }));
                        }}
                        className="w-full py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 font-medium rounded-lg border border-red-500/30 transition-all mt-2"
                      >
                        + 添加停損條件
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 模擬設置 */}
            <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6">
              <h3 className="text-lg font-semibold text-white mb-1 flex items-center">
                <span className="mr-2">🎮</span>
                模擬設置
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">
                    模擬次數 (1 - {MAX_SIMULATION_COUNT})
                  </label>
                  <NumberInput
                    value={simulationCount}
                    onChange={setSimulationCount}
                    min={1}
                    max={MAX_SIMULATION_COUNT}
                    className="w-full"
                  />
                </div>

                <button
                  onClick={runSimulation}
                  disabled={selectedScrolls.length === 0 || isSimulating}
                  className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold rounded-xl transition-all text-lg shadow-lg shadow-purple-500/25"
                >
                  {isSimulating ? "🔄 模擬中..." : "🚀 開始模擬"}
                </button>

                {selectedScrolls.length === 0 && (
                  <p className="text-center text-sm text-gray-400">
                    請先決定衝卷順序
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 結果顯示區域 */}
        {results.length > 0 && (
          <div ref={resultRef} className="mt-8">
            <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6">
              <h3 className="text-lg font-semibold text-white mb-1 flex items-center">
                <span className="mr-2">📈</span>
                模擬結果
              </h3>

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

                {/* 卷軸使用統計 */}
                {resultStats &&
                  Object.keys(resultStats.scrollUsageStats).length > 0 && (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                      <div className="text-blue-300 text-sm mb-3">
                        卷軸使用統計
                      </div>
                      <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                        {Object.entries(resultStats.scrollUsageStats)
                          .sort(([, a], [, b]) => b - a) // 按使用數量降序排列
                          .map(([scrollId, count]) => {
                            const scroll = SCROLLS.find(
                              (s) => s.id === scrollId
                            );
                            return (
                              <div
                                key={scrollId}
                                className="flex items-center justify-between p-2 bg-blue-500/5 rounded text-xs"
                              >
                                <img
                                  src={getScrollIcon(scroll?.successRate || 10)}
                                  alt={(scroll?.successRate || 10) + "% icon"}
                                  className="w-6 h-6 rounded shadow border border-gray-600/50 bg-gray-800/60 mr-2"
                                />
                                <span className="text-gray-300 truncate">
                                  {scroll?.name || scrollId}
                                </span>
                                <span className="text-blue-300 font-medium">
                                  {count} 張
                                </span>
                              </div>
                            );
                          })}
                      </div>
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
                                  {costSettings.enabled && result.totalCost && (
                                    <div className="text-gray-400 mt-1">
                                      花費: {result.totalCost.toLocaleString()}
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
                    .sort((a, b) => {
                      // 解析 key 取出物攻數值
                      const getAtk = (key: string) => {
                        const match = key.match(/物攻:\+(\d+)/);
                        return match ? parseInt(match[1], 10) : 0;
                      };
                      return getAtk(b[0]) - getAtk(a[0]);
                    })
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
                                {(() => {
                                  // 解析 key，將物攻優先顯示
                                  const parts = key.split(", ");
                                  const atkIdx = parts.findIndex((p) =>
                                    p.startsWith("物攻:")
                                  );
                                  let display = key;
                                  if (atkIdx > -1) {
                                    const atk = parts.splice(atkIdx, 1)[0];
                                    display = [atk, ...parts].join(", ");
                                  }
                                  return `✅ ${display} (${groupResults.length} 次)`;
                                })()}
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
                              {groupResults.slice(0, 50).map((result, idx) => (
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
                                  {costSettings.enabled && result.totalCost && (
                                    <div className="text-gray-400 mt-1">
                                      花費: {result.totalCost.toLocaleString()}
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
