import type { Scroll } from "../constants/scrolls.ts";
import { EQUIPMENT_TYPES } from "../constants/equipmentTypes.ts";

// 重新導出Scroll類型供其他模組使用
export type { Scroll };

// 裝備類型
export type EquipmentType = keyof typeof EQUIPMENT_TYPES;

// 捲軸價格信息
export interface ScrollPrice {
  scrollId: string;
  price: number;
  count: number;
}

// 期望值計算結果
export interface ExpectedValue {
  costInSnowflakes: number; // 期望成本（雪花）
  costInMaple: number; // 期望成本（楓幣）
  attempts: number; // 期望嘗試次數
}

// 投資分析結果
export interface InvestmentAnalysis {
  expectedCost: ExpectedValue; // 期望投入成本
  expectedRevenue: number; // 期望收益（雪花）
  expectedProfit: number; // 期望利潤（雪花）
  profitMargin: number; // 利潤率 (%)
  isWorthInvesting: boolean; // 是否值得投資
  breakEvenSuccessRate: number; // 盈虧平衡成功率
}

// 卷軸組合方案
export interface ScrollCombination {
  scrolls: { scroll: Scroll; count: number }[];
  totalAttributes: { [key: string]: number };
  averageSuccessRate: number;
  totalScrolls: number;
  isExactMatch?: boolean;
  matchScore?: number;
  explanation?: string;
  riskLevel?: "low" | "medium" | "high";
  expectedValue?: ExpectedValue; // 期望成本分析
  investmentAnalysis?: InvestmentAnalysis; // 投資收益分析
}

// 期望值設定
export interface ExpectedValueSettings {
  snowflakeToMapleRate: number; // 雪花對楓幣比率，預設 400000 (1:40萬)
  scrollPrices: { [scrollId: string]: number }; // 各捲軸的雪花價格
  cleanEquipmentPrice: number; // 乾淨裝備價格（雪花）
  targetEquipmentValue: number; // 目標裝備價值（雪花）
  failureStopLoss: number; // 失敗停損次數（預設3次）
}

// 屬性統計
export interface AttributeStats {
  [key: string]: string;
}

// 計算需求
export interface CalculationRequirement {
  [key: string]: number;
}
