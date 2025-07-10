import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SimpleScrollPage } from "../../pages/SimpleScrollPage";

// 端到端測試 - 簡化衝卷模擬器
describe("E2E Tests - 簡化衝卷模擬器", () => {
  it("應該能夠渲染基本組件", () => {
    render(<SimpleScrollPage />);

    // 檢查基本元素是否存在
    expect(screen.getByText(/衝卷模擬器/i)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /選擇裝備/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /期望增加值/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/可用卷軸/i)).toBeInTheDocument();
    expect(screen.getByText(/衝卷順序/i)).toBeInTheDocument();
  });

  it("應該有模擬設置區域", () => {
    render(<SimpleScrollPage />);

    expect(screen.getByText(/模擬設置/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /開始模擬/i })
    ).toBeInTheDocument();
  });
});

// TODO: 添加更詳細的功能測試
// - 裝備選擇測試
// - 卷軸拖拽測試
// - 模擬執行測試
// - 結果顯示測試
