# 公司資源管理網站

這是一個可部署到 GitHub Pages 的 React/Vite 前端，用 Google Sheet 作為資料來源。

## 本機使用

```bash
npm install
npm run dev
```

## Google Sheet 設定

網站第一次開啟會使用範例資料。到「設定」頁貼上各分頁的 CSV 發佈網址後，按「儲存」即可讀取真實資料。

建議分頁與欄位：

- 專案：`id, code, name, client, status, owner, startDate, endDate, budget, description`
- 物資：`id, name, category, quantity, borrowed, location, note`
- 借用：`id, purpose, borrower, status, plannedAt, borrowedAt, returnedAt, items`
- 廠商：`id, name, type, contact, phone, email, note`
- 案例：`id, title, type, year, fileUrl, description`
- 預算：`id, projectId, projectName, type, planned, actual, paid, item`

`status` 可用 `planning`、`in_progress`、`on_hold`、`completed`、`cancelled`，或直接用中文狀態。借用狀態可用 `pending`、`borrowed`、`returned`，或中文。

## GitHub Pages 部署

1. 將專案推到 GitHub 的 `main` 分支。
2. 到 Repository Settings → Pages。
3. Source 選擇 GitHub Actions。
4. 推送後會自動執行 `.github/workflows/pages.yml` 並部署 `dist`。

## 寫入資料

目前已保留 Apps Script 寫入端點設定欄位。讀取資料可直接使用 Google Sheet 發佈 CSV；若要新增、編輯、刪除資料，建議建立 Google Apps Script Web App 來處理權限與寫入。
