# 御三家錦鯉 · Gosanke Koi

三隻字元錦鯉在深墨藍水域悠游：紅白、大正三色、昭和三色。以 Canvas 字元渲染、分節身體與 XYZ 空間游動，呈現水波、細尾流與偶爾上浮的小氣泡。純全畫面動畫，沒有畫面文字或控制列。

[公開試看](https://poplolioi11.github.io/gosanke-koi/) · [下載 v0.1.0](https://github.com/poplolioi11/gosanke-koi/releases/tag/v0.1.0) · [雲龍](https://github.com/poplolioi11/yunlong)

![御三家錦鯉畫面](assets/preview.jpg)

由曲宸宇（Chu, Chen-Yu；GitHub：[poplolioi11](https://github.com/poplolioi11)）發想與決定美術方向，透過 AI 協作實作。

## 創作靈感

起點來自 [stackedlol/ascii-sharks](https://github.com/stackedlol/ascii-sharks) 的字元生物與游動概念，再沿用 [《雲龍》](https://github.com/poplolioi11/yunlong) 的空間運動思路。這次主題轉向日本御三家錦鯉，以水波取代雲氣；魚形、魚鰭、品系花色、水波與氣泡另外製作。

## 三隻錦鯉

- **紅白（Kohaku）**：白底紅斑，無墨黑斑。
- **大正三色（Taisho Sanke）**：白底紅斑與分散墨斑，頭段保留白紅。
- **昭和三色（Showa Sanshoku）**：較強的黑底交織紅白，頭部與胸鰭基部帶黑。

圓厚魚身、鰓蓋、胸鰭、背鰭與分叉尾，以 56 節身體呈現緩慢慣性、深淺、俯仰與側滾；可短暫游出畫面，再沿廣弧回游。每 6–14 秒偶爾產生一小簇氣泡，逐漸上浮並化為淡漣漪。滑鼠或觸控位置會輕微影響游動。

花色為程序化藝術表現，並非品評會等級或血統認證。參考：[全日本錦鯉振興會](https://jnpa.info/en/nishikigoi/varieties/tag/wagoi/)、[Kodama Koi Farm](https://www.kodamakoifarm.com/gosanke-koi-fish/)。本專案沒有使用或散布這些來源的魚照片。

## 本機使用

無外部執行期依賴，不需要安裝 npm 套件或打包。下載並解壓縮，或複製儲存庫：

```sh
git clone https://github.com/poplolioi11/gosanke-koi.git
cd gosanke-koi
python3 -m http.server 4330 --bind 127.0.0.1 --directory dist
```

以現代瀏覽器開啟 [http://127.0.0.1:4330/](http://127.0.0.1:4330/)。JavaScript 使用原生 ES modules，請透過 HTTP/HTTPS 開啟。也可把 `dist/` 的全部檔案放到靜態網站空間。

下載頁的 `gosanke-koi-v0.1.0-web.zip` 包含可直接架站的檔案與授權；完整程式及驗證腳本可使用 GitHub 的 Source code 下載。`package.json` 保留 `private: true` 以防誤發 npm；程式仍依 MIT 公開授權。

## 桌布與資源

可搭配支援網頁的桌布工具使用公開網址，或依該工具的說明載入本機網站。本版本是網頁動畫，尚非 macOS 原生桌布安裝包。

繪圖上限 24fps、倍率上限 1.25；三魚共用一張低解析彩色遮罩與一張主畫布。背景分頁和系統「減少動態效果」會暫停更新。

這些是程式中的限制，尚未測量桌布工具中的 GPU、總 RAM、電池消耗或跨瀏覽器效能。網頁沒有偵測 Mac 電源狀態；電池時是否停用由桌布工具設定。

## 驗證與程式結構

Node.js 22 以上可執行既有驗證；不需 `npm install`：

```sh
npm run check
npm test
```

驗證涵蓋三種視窗尺寸各 600 秒的游動、有限座標與骨架、花色規則，以及 60/120Hz 排程中的 24fps 上限與暫停。可見性採節點與半徑範圍作幾何代理，並非每幀字元像素計數；程式檢查不代表所有瀏覽器的畫面或資源表現。

| 檔案 | 用途 |
| --- | --- |
| `dist/app.js` | 啟動、輸入、24fps 排程及暫停 |
| `dist/scene.js` | 共用遮罩、字元渲染與水景合成 |
| `dist/world.js` | 三魚空間游動及分節身體 |
| `dist/fish.js` | 魚形、魚鰭與品系花色 |
| `dist/water.js` | 水波、尾流、氣泡及漣漪 |
| `scripts/` | 可重跑的驗證 |

## 歡迎各式使用與貢獻

歡迎用作個人桌布、網站背景、展示、教學、研究、改作、再散布或商業用途，也歡迎衍生其他生物、水景與互動。使用或散布時請保留 MIT 著作權及授權聲明。貢獻方式見 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 授權與 AI 協作

採 [MIT License](LICENSE)，Copyright (c) 2026 Chen-Yu Chu (曲宸宇)。原始靈感專案 ascii-sharks 的 MIT 聲明另保留於 [dist/NOTICE.txt](dist/NOTICE.txt)。

本作由 Codex 主代理整合，Codex 助手分工魚形花色、空間游動及水景；人類提供主題、需求與美術取捨。AI 協作不代表所有視覺或效能限制已被排除。
