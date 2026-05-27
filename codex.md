# Ghi chú quan trọng của project

## Tổng quan

Đây là project Vite dùng PixiJS để dựng prototype game slot/reel trên canvas. File chạy chính là `src/main.js`; `index.html` chỉ mount script module và stylesheet.

Project hiện tạo một màn chơi kích thước `920x800`, nền hồng, board slot ở giữa, các reel quay khi bấm nút play. Một số symbol là ảnh PNG thường, một số symbol là animation Spine.

## Công nghệ và dependency

- Vite: dùng để chạy dev server, build và preview.
- PixiJS: render canvas, sprite, container, text, graphics, mask, filter.
- `@esotericsoftware/spine-pixi-v8`: dùng để load và render Spine animation.
- `@pixi/spine-pixi` và `pixi-spine` cũng đang có trong `package.json`, nhưng code hiện tại đang import Spine từ `@esotericsoftware/spine-pixi-v8`.

Lệnh thường dùng:

```bash
npm install
npm run dev
npm run build
npm run preview
```

## Cấu trúc file chính

- `src/main.js`: toàn bộ logic PixiJS hiện tại, gồm init app, load asset, dựng board/reel, xử lý play button, tween quay reel và đổi symbol.
- `src/style.css`: style tối giản cho body/canvas.
- `index.html`: entry HTML, load `/src/style.css` và `/src/main.js`.
- `public/AA`: chứa ảnh giao diện và symbol PNG.
- `public/Symbol`: chứa asset Spine gồm `.json`, `.atlas`, `.png`.
- `public/assets`: chứa vài ảnh trái cây, hiện chưa được dùng trong `src/main.js`.

## Luồng chạy trong `src/main.js`

1. Tạo `Application` của Pixi và init với:
   - background: `#f8d1e4ff`
   - width: `920`
   - height: `800`
   - resolution: `window.devicePixelRatio || 1`
   - autoDensity: `true`
   - resizeTo: `window`
2. Append `app.canvas` vào `document.body`.
3. Đăng ký asset Spine bằng `Assets.add`:
   - `female_skeleton` / `female_atlas`
   - `male_skeleton` / `male_atlas`
   - `sombrero_skeleton` / `sombrero_atlas`
   - `logo_skeleton` / `logo_atlas`
   - `mexican_char_skeleton` / `mexican_char_atlas`
4. Load texture và Spine asset bằng `Assets.load`.
5. Tính toán kích thước board và grid dựa trên kích thước gốc của `/AA/Atest.png`:
   - board gốc: `1908x1566`
   - board hiển thị: `700x700`
   - vùng mask grid gốc: `x=205`, `y=210`, `width=1510`, `height=1190`
   - chiều cao track dùng để chia khoảng cách symbol: `1210`
   - `FIRST_REEL_OVERLAP_ORIG` đang là `0`; tăng biến này nếu muốn reel đầu dịch và mở mask sang trái.
6. Tạo reel và symbol:
   - `symbolTypes` gồm `Maracas`, `Wild`, `female`, `male`, `sombrero`.
   - Symbol PNG dùng `Sprite`.
   - Symbol Spine dùng `Spine.from(...)` và animation mặc định.
7. Tạo background app bằng `/AA/BG5.png`.
8. Tạo board bằng `/AA/Atest.png`.
9. Tạo Spine logo bằng `/Symbol/Logo.json` và `/Symbol/Logo.atlas`, đặt bên trái board.
10. Tạo Spine MexicanChar bằng `/Symbol/MexicanChar.json` và `/Symbol/MexicanChar.atlas`, đặt lệch bên phải board.
11. Đặt `reelContainer` vào đúng vùng grid của board.
12. Dùng `Graphics` làm mask để ẩn symbol ngoài vùng reel.
13. Tạo nút play từ `/AA/play_button.png`.
14. Khi bấm play, gọi `startPlay()` để tween tất cả reel.
15. Reel nào quay xong trước sẽ gọi `playLandingForReel()` để chạy animation `landing` cho các symbol Spine đang hiện trên reel đó.
16. Khi reel cuối cùng quay xong, `reelsComplete()` bật lại nút play.

## Thông số gameplay/render quan trọng

- Số reel hiện tại là `REEL_COUNT = 5`, đúng với grid `5x4`.
- `REEL_WIDTH = GRID_WIDTH / REEL_COUNT`.
- Mỗi reel tạo `SYMBOLS_PER_REEL = ROW_COUNT + 1`:
  - 4 symbol visible theo `ROW_COUNT = 4`.
  - 1 symbol ẩn phía trên.
- `SYMBOL_SIZE = GRID_HEIGHT / 4`, tức logic đang chia chiều cao grid theo 4 hàng.
- Khi symbol đi qua phía trên, code random lại loại symbol bằng `setSymbolType`.
- Blur khi quay dựa trên tốc độ thay đổi `position`: `r.blur.blurY = (r.position - r.previousPosition) * 8`.
- Các reel dừng lần lượt từ trái sang phải nhờ `stopDelayPerReel` và `extraSpinStepsPerReel` trong `startPlay()`.
- Khi bắt đầu quay, mỗi reel nhích lên một đoạn ngắn bằng `windUpDistance` trong `windUpTime`, rồi mới chạy tween quay chính.
- Landing animation được chạy theo từng reel với `landingLeadTime = 240ms`, tức là reel nào cũng bắt đầu landing trước khi spin tween kết thúc cùng một khoảng thời gian cố định.
- Spine landing dùng `LANDING_MIX_DURATION = 0.2` để blend từ idle/static sang `landing`, và `IDLE_RETURN_MIX_DURATION = 0.12` để blend từ landing về idle.
- Tween hiện tại là utility tự viết, dùng `Date.now()` và interpolation. Spin chính dùng `easeOutCubic` để reel quay nhanh lúc đầu rồi chậm dần trước khi dừng.

## Asset đang được dùng

Trong `src/main.js`, các file đang load/dùng trực tiếp:

- `/AA/Maracas.png`
- `/AA/Wild.png`
- `/AA/BG5.png`
- `/AA/Atest.png`
- `/AA/play_button.png`
- `/Symbol/Female_Special.json`
- `/Symbol/Female_Special.atlas`
- `/Symbol/Male_Special.json`
- `/Symbol/Male_Special.atlas`
- `/Symbol/Sombrero.json`
- `/Symbol/Sombrero.atlas`
- `/Symbol/Logo.json`
- `/Symbol/Logo.atlas`
- `/Symbol/MexicanChar.json`
- `/Symbol/MexicanChar.atlas`

Lưu ý: các file `.atlas` tham chiếu tới file `.png` cùng bộ trong `public/Symbol`, vì vậy không nên đổi tên/xóa PNG nếu chưa sửa atlas.

## Animation Spine đang giả định

- `female`: animation mặc định `idle`, landing `landing`.
- `male`: animation mặc định `idle`, landing `landing`.
- `sombrero`: animation mặc định `default`, landing `landing`, sau đó quay lại `default`.
- `logo`: animation mặc định `animation`.
- `mexicanChar`: animation mặc định `idle_normal`.

Nếu thay Spine asset, cần kiểm tra tên animation trong file Spine mới có khớp các tên này không.

## Điểm cần chú ý khi phát triển tiếp

- Tween tự viết đủ cho prototype, nhưng nếu game phức tạp hơn nên cân nhắc dùng tween library để dễ easing, cancel, sequence.
- App dùng canvas resize theo viewport bằng `resizeTo: window`. `layoutScene()` căn lại background, board, reel và play button sau resize.
- `/AA/BG5.png` được scale kiểu cover để phủ toàn màn hình mà không bị méo tỉ lệ.
- Board, reel, logo và MexicanChar được scale cùng `gameScale` trong `layoutScene()` để không bị crop trên màn hình thấp/hẹp. Layout dùng `window.visualViewport`/`window.innerWidth` thay vì `app.screen` để tránh lệch do DPR/browser zoom. Các giới hạn chính là `BOARD_MIN_SIDE_MARGIN`, `BOARD_VERTICAL_MARGIN`, `BOARD_MAX_SCALE`, `BOARD_MIN_SCALE`.
- Logo và MexicanChar được căn trong `layoutScene()` bằng bounding box của Spine. Logo neo bên trái board và hơi đè vào khung bằng `LOGO_BOARD_OVERLAP`; MexicanChar neo bên phải board và chạm gần đáy bằng `MEXICAN_CHAR_BOTTOM_OFFSET`. Chỉnh `LOGO_DISPLAY_WIDTH`, `LOGO_BOARD_OVERLAP`, `LOGO_CENTER_Y_OFFSET`, `MEXICAN_CHAR_DISPLAY_HEIGHT`, `MEXICAN_CHAR_BOARD_OVERLAP`, `MEXICAN_CHAR_BOTTOM_OFFSET` nếu muốn thay đổi vị trí/kích thước.
- Spine atlas cần dùng đuôi `.atlas`. Nếu dùng `.atlas.txt`, loader có thể trả về text asset thay vì TextureAtlas và gây lỗi `this.atlas.findRegion is not a function`.
- Canvas đang dùng `resolution` theo `devicePixelRatio` để asset Spine male/female sắc hơn trên màn hình high-DPI. Nếu thấy mờ lại, kiểm tra trước phần init Pixi này.

## Quy ước chỉnh sửa nên giữ

- Asset public nên được gọi bằng path bắt đầu từ `/`, ví dụ `/AA/Wild.png`, vì Vite serve thư mục `public` tại root.
- Khi thêm symbol Spine mới, cần thêm cả skeleton alias, atlas alias, load asset, và mapping animation trong `setSymbolType`.
- Khi thêm symbol PNG mới, chỉ cần load texture nếu muốn preload, rồi thêm `Texture.from("/path.png")` vào `symbolTypes`.
- Sau khi sửa logic vị trí board/grid, cần kiểm tra trực quan vì các tọa độ hiện được căn theo kích thước ảnh gốc `1908x1566` của `/AA/Atest.png`.
- `GRID_ORIG_HEIGHT` dùng cho mask hiển thị trong khung; `SYMBOL_TRACK_ORIG_HEIGHT` dùng để tính khoảng cách dọc giữa các symbol. Không nên gộp hai giá trị này nếu chỉ muốn chỉnh độ cân hàng.
- `FIRST_REEL_OVERLAP_ORIG` vừa dịch reel đầu sang trái, vừa mở mask sang trái. Dùng thông số này khi muốn reel đầu đè lên board rõ hơn hoặc ít hơn.
