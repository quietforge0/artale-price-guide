export const InstructionsCard = () => {
  return (
    <div className="relative group">
      {/* 光暈背景效果 */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-600 to-cyan-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>

      {/* 主卡片 */}
      <div className="relative bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 shadow-2xl">
        {/* 內部發光邊框 */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 rounded-2xl"></div>

        <div className="relative z-10">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">🎮</div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent mb-2">
              Artale 卷軸計算器
            </h2>
            <p className="text-gray-300">四個簡單步驟，找到最佳卷軸組合</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-blue-600/20 to-blue-500/20 backdrop-blur-sm rounded-lg border border-blue-500/30">
              <div className="text-2xl mb-2">🎯</div>
              <div className="font-semibold text-sm text-gray-200">
                選擇裝備
              </div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-600/20 to-purple-500/20 backdrop-blur-sm rounded-lg border border-purple-500/30">
              <div className="text-2xl mb-2">✨</div>
              <div className="font-semibold text-sm text-gray-200">
                選擇屬性
              </div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-orange-600/20 to-orange-500/20 backdrop-blur-sm rounded-lg border border-orange-500/30">
              <div className="text-2xl mb-2">📊</div>
              <div className="font-semibold text-sm text-gray-200">
                輸入數值
              </div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-green-600/20 to-green-500/20 backdrop-blur-sm rounded-lg border border-green-500/30">
              <div className="text-2xl mb-2">🚀</div>
              <div className="font-semibold text-sm text-gray-200">
                開始計算
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
