# 🐟 漁產品價格查詢系統

一個基於 Node.js 和 SQLite 的漁產品批發價格查詢與管理系統。

## 📋 功能特色

- **價格查詢**: 查詢不同漁產品在不同年份的批發價格
- **年份範圍查詢**: 支援設定起始和結束年份的範圍查詢
- **價格趨勢圖**: 使用 Chart.js 顯示價格變化趨勢
- **資料新增**: 支援新增或更新漁產品價格資料
- **響應式設計**: 支援桌面和行動裝置
- **永久儲存**: 使用 SQLite 資料庫持久化儲存資料

## 🛠️ 技術棧

- **後端**: Node.js, Express.js
- **資料庫**: SQLite3
- **前端**: HTML5, CSS3, JavaScript, Bootstrap 5
- **圖表**: Chart.js
- **資料處理**: CSV Parser

## 📦 安裝與運行

1. **克隆專案**
   ```bash
   git clone [your-repo-url]
   cd final
   ```

2. **安裝依賴**
   ```bash
   npm install
   ```

3. **啟動應用程式**
   ```bash
   # 使用 PowerShell 腳本
   .\start.ps1
   
   # 或使用批次檔
   start.bat
   
   # 或直接使用 Node.js
   node bin/www
   ```

4. **開啟瀏覽器**
   訪問 `http://localhost:3000`

## 📊 資料結構

資料庫表格 `fishery_wholesale_prices`:
- `id`: 主鍵 (自動遞增)
- `product_name`: 漁產品名稱 (TEXT)
- `year`: 年份 (民國年) (INTEGER)
- `price_per_kg`: 每公斤價格 (REAL)
- `unit`: 計量單位 (TEXT)

## 🎯 使用方法

### 價格查詢
1. 選擇想要查詢的漁產品
2. 設定查詢的年份範圍
3. 查看價格表格和趨勢圖

### 新增價格資料
1. 切換到「新增價格」模式
2. 從下拉選單選擇產品
3. 輸入年份、價格和單位
4. 提交表單

## 📁 專案結構

```
├── app.js              # 主要應用程式檔案
├── db.js               # 資料庫連接和操作
├── package.json        # 專案依賴設定
├── start.ps1          # PowerShell 啟動腳本
├── start.bat          # 批次檔啟動腳本
├── bin/
│   └── www            # 伺服器啟動檔案
├── public/            # 靜態資源
│   ├── index.html     # 主頁面
│   ├── stylesheets/
│   │   └── style.css  # 樣式檔案
│   └── javascripts/
│       └── script.js  # 前端 JavaScript
└── 3f22734f46b814a22e7585dc6b1cea99_export.csv  # 原始資料檔案
```

## 🚀 API 端點

- `GET /api/products` - 獲取所有產品列表
- `GET /api/years/:product` - 獲取特定產品的年份列表
- `GET /api/prices/:product` - 獲取特定產品的價格資料
- `POST /api/fish-prices` - 新增或更新價格資料

## 🎨 特色功能

- **現代化 UI**: 使用漸層背景和玻璃擬態效果
- **動畫效果**: 頁面載入動畫和過渡效果
- **響應式設計**: 適配各種螢幕尺寸
- **資料持久化**: 新增的資料會永久保存
- **錯誤處理**: 完善的錯誤提示和處理機制

## 📝 授權

此專案僅供學習和展示用途。

## 🤝 貢獻

歡迎提出建議和改進意見！

---

🐟 讓資料說話，讓價格透明！
