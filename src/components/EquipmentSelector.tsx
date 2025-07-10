import { useState } from "react";
import {
  EQUIPMENT_BY_CATEGORY_WITH_SCROLLS,
  EQUIPMENT_ICONS,
} from "../constants/equipment.ts";

interface EquipmentSelectorProps {
  selectedEquipment: string;
  onEquipmentChange: (equipment: string) => void;
  availableScrollsCount: number;
}

export const EquipmentSelector = ({
  selectedEquipment,
  onEquipmentChange,
  availableScrollsCount,
}: EquipmentSelectorProps) => {
  const categories = Object.keys(EQUIPMENT_BY_CATEGORY_WITH_SCROLLS) as Array<
    keyof typeof EQUIPMENT_BY_CATEGORY_WITH_SCROLLS
  >;
  const [activeCategory, setActiveCategory] = useState<
    keyof typeof EQUIPMENT_BY_CATEGORY_WITH_SCROLLS
  >(categories[0]);

  return (
    <div className="relative group h-full">
      {/* 光暈背景效果 */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>

      {/* 主卡片 */}
      <div className="relative bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 h-full flex flex-col shadow-2xl">
        {/* 內部發光邊框 */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl"></div>

        <div className="relative z-10 flex flex-col h-full">
          <div className="text-center mb-6">
            <div className="inline-flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl border border-blue-500/30 backdrop-blur-sm">
              <span className="text-2xl">⚔️</span>
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                選擇裝備
              </h2>
            </div>
          </div>

          <div className="flex space-x-4 flex-1">
            {/* 左側分類 Tab */}
            <div className="w-24 flex-shrink-0">
              <div className="relative h-full">
                <div className="bg-gray-700/50 backdrop-blur-sm rounded-xl border border-gray-600/50 p-1 h-full">
                  <div className="space-y-1">
                    {categories.map((category) => (
                      <button
                        key={category}
                        onClick={() => setActiveCategory(category)}
                        className={`relative w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 text-center overflow-hidden ${
                          activeCategory === category
                            ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                            : "bg-gray-600/30 text-gray-300 hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-purple-500/20 hover:text-white border border-gray-600/50"
                        }`}
                      >
                        {/* 活躍狀態光效 */}
                        {activeCategory === category && (
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/30 to-purple-400/30 rounded-lg animate-pulse"></div>
                        )}
                        <span className="relative z-10 whitespace-nowrap">
                          {category}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 右側裝備選項 */}
            <div className="flex-1 flex flex-col">
              <div className="relative">
                <div className="bg-gray-700/30 backdrop-blur-sm rounded-xl border border-gray-600/50 p-4">
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-2">
                    {EQUIPMENT_BY_CATEGORY_WITH_SCROLLS[activeCategory]?.map(
                      (equipment) => (
                        <button
                          key={equipment}
                          onClick={() =>
                            onEquipmentChange(
                              selectedEquipment === equipment ? "" : equipment
                            )
                          }
                          className={`relative p-3 rounded-lg border transition-all duration-300 group overflow-hidden ${
                            selectedEquipment === equipment
                              ? "border-blue-400 bg-gradient-to-br from-blue-500/20 to-purple-500/20 shadow-lg shadow-blue-500/25"
                              : "border-gray-600/50 bg-gray-600/20 hover:border-blue-400/60 hover:bg-gradient-to-br hover:from-blue-500/10 hover:to-purple-500/10"
                          }`}
                        >
                          {/* 背景光效 */}
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/0 to-purple-400/0 group-hover:from-blue-400/10 group-hover:to-purple-400/10 transition-all duration-300 rounded-lg"></div>
                          <div className="relative z-10 text-center">
                            <div
                              className={`text-xl mb-1 transition-all duration-300 ${
                                selectedEquipment === equipment
                                  ? "scale-110"
                                  : "group-hover:scale-110"
                              }`}
                            >
                              {EQUIPMENT_ICONS[equipment] || "📦"}
                            </div>
                            <div
                              className={`text-xs font-medium transition-colors duration-300 whitespace-nowrap ${
                                selectedEquipment === equipment
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
          </div>

          {selectedEquipment && (
            <div className="mt-4 p-4 bg-gradient-to-r from-green-600/20 to-emerald-600/20 backdrop-blur-sm rounded-xl border border-green-500/30">
              <div className="flex items-center space-x-3">
                <div className="text-xl animate-pulse">
                  {EQUIPMENT_ICONS[selectedEquipment]}
                </div>
                <div>
                  <div className="font-semibold text-white">
                    已選擇：{selectedEquipment}
                  </div>
                  <div className="text-sm text-gray-300">
                    可用卷軸：{availableScrollsCount} 種
                  </div>
                </div>
                <div className="ml-auto">
                  <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/50">
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
