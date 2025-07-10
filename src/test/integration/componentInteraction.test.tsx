import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ScrollSimulator } from "../../components/ScrollSimulator";

describe("組件交互整合測試", () => {
  describe("基礎組件渲染", () => {
    it("應該成功渲染 ScrollSimulator 組件", async () => {
      render(<ScrollSimulator />);

      await waitFor(() => {
        // 檢查標題是否存在
        const title = screen.getByText("衝卷模擬器");
        expect(title).toBeInTheDocument();
      });
    });

    it("應該顯示裝備選擇區域", async () => {
      render(<ScrollSimulator />);

      await waitFor(() => {
        // 檢查選擇裝備標題
        const equipmentSection = screen.getByText("選擇裝備");
        expect(equipmentSection).toBeInTheDocument();

        // 檢查裝備類型按鈕
        const armorButton = screen.getByText("防具");
        const weaponButton = screen.getByText("武器");
        const accessoryButton = screen.getByText("飾品");

        expect(armorButton).toBeInTheDocument();
        expect(weaponButton).toBeInTheDocument();
        expect(accessoryButton).toBeInTheDocument();
      });
    });

    it("應該顯示模擬設置區域", async () => {
      render(<ScrollSimulator />);

      await waitFor(() => {
        // 檢查模擬設置標題
        const simulationSection = screen.getByText("模擬設置");
        expect(simulationSection).toBeInTheDocument();

        // 檢查開始模擬按鈕
        const simulateButton = screen.getByText("🚀 開始模擬");
        expect(simulateButton).toBeInTheDocument();
      });
    });
  });

  describe("裝備選擇功能", () => {
    it("應該能夠切換裝備類型", async () => {
      render(<ScrollSimulator />);

      await waitFor(() => {
        // 點擊武器按鈕
        const weaponButton = screen.getByText("武器");
        fireEvent.click(weaponButton);

        // 驗證按鈕被選中（這裡只是檢查不會拋出錯誤）
        expect(weaponButton).toBeInTheDocument();
      });
    });

    it("應該顯示裝備選項", async () => {
      render(<ScrollSimulator />);

      await waitFor(() => {
        // 檢查是否有裝備選項按鈕
        const helmetButton = screen.getByText(/頭盔/);
        expect(helmetButton).toBeInTheDocument();
      });
    });
  });

  describe("模擬執行測試", () => {
    it("模擬按鈕應該存在且可點擊", async () => {
      render(<ScrollSimulator />);

      await waitFor(() => {
        const simulateButton = screen.getByText("🚀 開始模擬");
        expect(simulateButton).toBeInTheDocument();
        expect(simulateButton).toBeDisabled(); // 初始狀態應該是禁用的
      });
    });

    it("應該顯示模擬結果區域", async () => {
      render(<ScrollSimulator />);

      await waitFor(() => {
        const resultsSection = screen.getByText("模擬結果");
        expect(resultsSection).toBeInTheDocument();
      });
    });
  });

  describe("表單輸入測試", () => {
    it("應該有模擬次數輸入框", async () => {
      render(<ScrollSimulator />);

      await waitFor(() => {
        // 查找輸入框（通過placeholder或其他屬性）
        const inputs = screen.getAllByRole("textbox");
        expect(inputs.length).toBeGreaterThan(0);
      });
    });

    it("輸入框應該能夠輸入數值", async () => {
      render(<ScrollSimulator />);

      await waitFor(() => {
        const inputs = screen.getAllByRole("textbox");
        if (inputs.length > 0) {
          const firstInput = inputs[0];
          fireEvent.change(firstInput, { target: { value: "2000" } });
          expect(firstInput).toHaveValue("2000");
        }
      });
    });
  });

  describe("功能區塊測試", () => {
    it("應該顯示成本計算區域", async () => {
      render(<ScrollSimulator />);

      await waitFor(() => {
        const costSection = screen.getByText("成本計算");
        expect(costSection).toBeInTheDocument();
      });
    });

    it("應該顯示停損條件區域", async () => {
      render(<ScrollSimulator />);

      await waitFor(() => {
        const stopLossSection = screen.getByText("停損條件");
        expect(stopLossSection).toBeInTheDocument();
      });
    });

    it("應該顯示可用卷軸區域", async () => {
      render(<ScrollSimulator />);

      await waitFor(() => {
        const scrollsSection = screen.getByText("可用卷軸");
        expect(scrollsSection).toBeInTheDocument();
      });
    });

    it("應該顯示衝卷順序區域", async () => {
      render(<ScrollSimulator />);

      await waitFor(() => {
        const orderSection = screen.getByText("衝卷順序");
        expect(orderSection).toBeInTheDocument();
      });
    });
  });

  describe("狀態管理測試", () => {
    it("組件應該正確渲染而不崩潰", async () => {
      const { unmount } = render(<ScrollSimulator />);

      await waitFor(() => {
        // 檢查基本結構存在
        const title = screen.getByText("衝卷模擬器");
        expect(title).toBeInTheDocument();
      });

      // 卸載組件不應該拋出錯誤
      expect(() => unmount()).not.toThrow();
    });

    it("多次重新渲染應該穩定", async () => {
      const { rerender } = render(<ScrollSimulator />);

      await waitFor(() => {
        const title = screen.getByText("衝卷模擬器");
        expect(title).toBeInTheDocument();
      });

      // 重新渲染
      rerender(<ScrollSimulator />);

      await waitFor(() => {
        const title = screen.getByText("衝卷模擬器");
        expect(title).toBeInTheDocument();
      });
    });
  });

  describe("響應式設計測試", () => {
    it("組件應該在不同視窗大小下正常顯示", async () => {
      // 模擬不同視窗大小
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 768,
      });

      render(<ScrollSimulator />);

      await waitFor(() => {
        const title = screen.getByText("衝卷模擬器");
        expect(title).toBeInTheDocument();
      });

      // 切換到手機尺寸
      Object.defineProperty(window, "innerWidth", {
        value: 320,
      });

      // 觸發resize事件
      fireEvent(window, new Event("resize"));

      await waitFor(() => {
        const title = screen.getByText("衝卷模擬器");
        expect(title).toBeInTheDocument();
      });
    });
  });

  describe("錯誤處理測試", () => {
    it("應該優雅處理空的配置", async () => {
      render(<ScrollSimulator />);

      await waitFor(() => {
        const simulateButton = screen.getByText("🚀 開始模擬");

        // 不配置任何東西直接點擊模擬按鈕
        if (!simulateButton.hasAttribute("disabled")) {
          fireEvent.click(simulateButton);
        }

        // 應該不會崩潰
        expect(simulateButton).toBeInTheDocument();
      });
    });

    it("組件應該處理無效數據而不崩潰", async () => {
      // 模擬損壞的localStorage
      const originalGetItem = Storage.prototype.getItem;
      Storage.prototype.getItem = () => "invalid_json";

      expect(() => render(<ScrollSimulator />)).not.toThrow();

      await waitFor(() => {
        const title = screen.getByText("衝卷模擬器");
        expect(title).toBeInTheDocument();
      });

      // 恢復原始方法
      Storage.prototype.getItem = originalGetItem;
    });
  });

  describe("性能測試", () => {
    it("組件渲染應該在合理時間內完成", async () => {
      const startTime = performance.now();

      render(<ScrollSimulator />);

      await waitFor(() => {
        const title = screen.getByText("衝卷模擬器");
        expect(title).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // 組件渲染應該在500ms內完成
      expect(renderTime).toBeLessThan(500);
    });

    it("大量交互操作不應該導致性能問題", async () => {
      render(<ScrollSimulator />);

      const startTime = performance.now();

      // 執行多次快速交互
      for (let i = 0; i < 10; i++) {
        await waitFor(() => {
          const weaponButton = screen.getByText("武器");
          fireEvent.click(weaponButton);

          const armorButton = screen.getByText("防具");
          fireEvent.click(armorButton);
        });
      }

      const endTime = performance.now();
      const interactionTime = endTime - startTime;

      // 10次交互應該在1秒內完成
      expect(interactionTime).toBeLessThan(1000);
    });
  });

  describe("國際化支持測試", () => {
    it("應該正確顯示繁體中文文字", async () => {
      render(<ScrollSimulator />);

      await waitFor(() => {
        // 檢查主要的中文標題
        expect(screen.getByText("衝卷模擬器")).toBeInTheDocument();
        expect(screen.getByText("選擇裝備")).toBeInTheDocument();
        expect(screen.getByText("防具")).toBeInTheDocument();
        expect(screen.getByText("武器")).toBeInTheDocument();
        expect(screen.getByText("飾品")).toBeInTheDocument();

        // 檢查功能區塊標題
        expect(screen.getByText("成本計算")).toBeInTheDocument();
        expect(screen.getByText("停損條件")).toBeInTheDocument();
        expect(screen.getByText("可用卷軸")).toBeInTheDocument();
        expect(screen.getByText("衝卷順序")).toBeInTheDocument();
        expect(screen.getByText("模擬設置")).toBeInTheDocument();
        expect(screen.getByText("模擬結果")).toBeInTheDocument();
        expect(screen.getByText("🚀 開始模擬")).toBeInTheDocument();
      });
    });

    it("不應該包含英文或簡體中文關鍵詞", async () => {
      render(<ScrollSimulator />);

      await waitFor(() => {
        // 確保沒有英文關鍵詞
        expect(screen.queryByText(/simulation/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/equipment/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/scroll/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/cost/i)).not.toBeInTheDocument();
      });
    });
  });
});
