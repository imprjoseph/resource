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
- 物資：`id, name, category, manager, quantity, borrowed, location, note`
- 借用：`id, purpose, borrower, status, plannedAt, borrowedAt, returnedAt, items`
- 廠商：`id, name, type, contact, phone, email, note`
- 案例：`id, title, type, year, fileUrl, description`
- 預算：`id, projectId, projectName, type, planned, actual, paid, item`
- 帳號：`id, name, email, role, department, status, note`
- 派遣/工讀：`id, name, kind, area, manager, phone, email, status, startDate, endDate, hourlyRate, note`
- 帳密大全：`id, name, url, account, password, period, manager, note`
- SOP：`id, title, category, owner, version, status, updatedAt, fileUrl, description`

`status` 可用 `planning`、`in_progress`、`on_hold`、`completed`、`cancelled`，或直接用中文狀態。借用狀態可用 `pending`、`borrowed`、`returned`，或中文。

帳號 `role` 可用 `manager` 或 `staff`，也可填中文「管理者」「同仁」。派遣/工讀 `kind` 可填「派遣人員」或「工讀生」。

派遣/工讀的 `area` 是「區域」。舊資料若仍使用「部門」欄位，網站也會相容讀取。

## GitHub Pages 部署

1. 將專案推到 GitHub 的 `main` 分支。
2. 到 Repository Settings → Pages。
3. Source 選擇 GitHub Actions。
4. 推送後會自動執行 `.github/workflows/pages.yml` 並部署 `dist`。

## 寫入資料

網站已支援新增、編輯、刪除資料。若「設定」頁有填 Apps Script 寫入端點，操作會同步送到 Google Sheet；若未填，資料會先存在瀏覽器本機。

建立 Apps Script Web App：

1. 開啟 Google Sheet `resource`。
2. 選單進入「擴充功能」→「Apps Script」。
3. 貼上 `google-apps-script/resource-webapp.gs` 的內容。
4. 按「部署」→「新增部署作業」。
5. 類型選「網頁應用程式」。
6. 執行身分選「我」。
7. 存取權可先選「任何人」或依公司權限設定。
8. 複製 Web App URL。
9. 回到網站「設定」頁，把 URL 貼到「Apps Script 寫入端點」後按儲存。
