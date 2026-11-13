import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { scraper } from "google-maps-review-scraper";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;

/**
 * 解析短網址 (例如 maps.app.goo.gl / goo.gl/maps) 取得真實的 /maps/place/... 網址
 */
async function resolveMapsUrl(rawUrl) {
  const trimmed = rawUrl.trim();

  // 檢查是否誤貼成 Google 搜尋頁網址 (google.com/search?q=...)
  if (trimmed.includes("google.com/search")) {
    throw new Error(
      "您貼上的是「Google 搜尋頁面網址」，此爬蟲需要「Google 地圖 (Maps) 的店家分享連結」(例如 https://www.google.com/maps/place/... 或 https://maps.app.goo.gl/...)。請在搜尋結果點開右側地圖商家 ➔ 點「分享」➔「複製連結」後再貼上！"
    );
  }

  // 若為短網址，嘗試追蹤 Redirect 取得完整 /maps/place/ 網址
  if (trimmed.includes("maps.app.goo.gl") || trimmed.includes("goo.gl/maps")) {
    try {
      const resp = await fetch(trimmed, { method: "HEAD", redirect: "follow" });
      if (resp.url && resp.url.includes("/maps/place/")) {
        return resp.url;
      }
    } catch {
      // 若環境無法解析短網址，交由後續檢查處理
    }
  }

  if (!trimmed.includes("/maps/place/")) {
    throw new Error(
      "網址格式不符：請貼上包含 /maps/place/ 的 Google 地圖店家網址（含 data=!4m... 參數）。"
    );
  }

  return trimmed;
}

const server = http.createServer(async (req, res) => {
  // 1. 提供前端靜態網頁
  if (req.method === "GET" && (req.url === "/" || req.url === "/index.html")) {
    const htmlPath = path.join(__dirname, "public", "index.html");
    const html = fs.readFileSync(htmlPath, "utf-8");
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(html);
    return;
  }

  // 2. API: POST /api/scrape
  if (req.method === "POST" && req.url === "/api/scrape") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", async () => {
      try {
        const { url, sort_type = "newest", pages = 2 } = JSON.parse(body || "{}");
        if (!url) {
          res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
          res.end(JSON.stringify({ ok: false, error: "請輸入 Google Maps 店家網址" }));
          return;
        }

        const resolvedUrl = await resolveMapsUrl(url);

        const scraperOptions = {
          url: resolvedUrl,
          sort_type,
          pages: Number(pages),
          clean: true,
        };

        // 若在 proxy 環境下自動帶入環境變數
        const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
        if (proxyUrl) {
          scraperOptions.proxy = { proxyUrl, ignoreTls: true };
        }

        const reviews = await scraper(scraperOptions);

        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(
          JSON.stringify({
            ok: true,
            resolvedUrl,
            count: Array.isArray(reviews) ? reviews.length : 0,
            reviews: reviews || [],
          })
        );
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ ok: false, error: err.message || "爬取失敗" }));
      }
    });
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Not Found");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Google Maps Review Scraper Web App running on http://localhost:${PORT}`);
});
