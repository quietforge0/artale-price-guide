import { SimpleScrollPage } from "./pages/SimpleScrollPage.tsx";

/**
 * 主應用程式組件
 * 負責應用程式層級的配置：Providers、ErrorBoundary、全域設定等
 */
function App() {
  return (
    <>
      {/* 未來可以在這裡添加：
          - Context Providers (Theme, Auth, etc.)
          - Error Boundary
          - Router
          - Global components (Toast, Modal, etc.)
      */}
      <SimpleScrollPage />
    </>
  );
}

export default App;
