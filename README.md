# Google Maps 商家評價自動爬蟲站 (`gmaps-review-web`)

基於開源套件 [`YasogaN/google-maps-review-scraper`](https://github.com/YasogaN/google-maps-review-scraper) 打造的全端教學專案，支援貼上 Google 地圖店家分享連結，自動爬取評論、統計平均星等與負評數，並一鍵匯出 CSV 串接 Google Sheets / GAS 客服系統。

## 環境需求
- **Node.js >= 22.12.0**

## 快速啟動
```bash
git clone https://github.com/nutcelvischen-jpg/gmaps-review-web.git
cd gmaps-review-web
npm install
npm start
```

啟動後打開瀏覽器前往 `http://localhost:3000`。

## 使用注意事項
- 請貼上 **Google Maps 店家連結**（例如 `https://www.google.com/maps/place/...` 或 `https://maps.app.goo.gl/...`）。
- 若在 Google 搜尋頁面找到店家，請點開右側店家卡片的 **「分享 ➔ 複製連結」** 後再貼上。
