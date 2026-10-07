# Hướng Dẫn Cấu Hình Tên Miền `danhlo.xyz` & Cập Nhật Live Tức Thì (18h14 - 18h36)

Tài liệu này hướng dẫn bạn từng bước để:
1. Trỏ tên miền **`danhlo.xyz`** về website.
2. Thiết lập **Cloudflare Worker** miễn phí để cập nhật kết quả mở thưởng **tức thì từng giây** (18h14 - 18h36) không phụ thuộc máy chủ cá nhân.

---

## BƯỚC 1: Đưa tên miền `danhlo.xyz` vào Cloudflare (Miễn phí 100%)

1. Truy cập [cloudflare.com](https://dash.cloudflare.com/) và đăng ký tài khoản (nếu chưa có).
2. Bấm **Add a Site** -> Nhập `danhlo.xyz` -> Chọn gói **Free** (Miễn phí).
3. Cloudflare sẽ cấp cho bạn 2 địa chỉ Nameserver, ví dụ:
   - `ns1.cloudflare.com`
   - `ns2.cloudflare.com`
4. Vào trang quản trị nơi bạn đã mua tên miền `danhlo.xyz` (Namecheap, GoDaddy, Inet, MatBao, v.v.):
   - Đổi Nameserver của tên miền thành 2 địa chỉ Nameserver của Cloudflare ở trên.

---

## BƯỚC 2: Trỏ Web danhlo.xyz về GitHub Pages

Trong mục **DNS** -> **Records** của Cloudflare cho `danhlo.xyz`:
1. Thêm bản ghi **CNAME**:
   - **Type**: `CNAME`
   - **Name**: `@` (hoặc `danhlo.xyz`)
   - **Target**: `thaonguyendkbike.github.io`
   - **Proxy status**: Bật đám mây màu cam (Proxied).
2. Thêm bản ghi CNAME cho `www`:
   - **Type**: `CNAME`
   - **Name**: `www`
   - **Target**: `thaonguyendkbike.github.io`
   - **Proxy status**: Proxied.
3. Trong GitHub repo `thaonguyendkbike/danhlo`:
   - Vào **Settings** -> **Pages** -> mục **Custom domain**: Nhập `danhlo.xyz` và bấm **Save**.

---

## BƯỚC 3: Tạo Cloudflare Worker làm API Live Tức Thì

Worker này có nhiệm vụ quét kết quả xổ số mỗi 3-4 giây trong khung giờ 18h14 - 18h36 và trả về cho người xem web mà không bao giờ bị lỗi CORS hay lag mạng:

1. Trong trang quản trị Cloudflare -> Menu bên trái chọn **Workers & Pages** -> Bấm **Create Application** -> Chọn **Create Worker**.
2. Đặt tên worker: ví dụ `xsmb-live` -> Bấm **Deploy**.
3. Bấm **Edit Code** (Chỉnh sửa mã nguồn).
4. Xóa hết code mặc định, sao chép toàn bộ nội dung file [cloudflare-worker/worker.js](worker.js) dán vào.
5. Bấm nút **Deploy** (Triển khai) ở góc trên bên phải.
6. Lúc này Worker của bạn đã chạy! Bạn sẽ có 1 đường dẫn gọi API, ví dụ:
   `https://xsmb-live.<tên-tài-khoản>.workers.dev`

---

## BƯỚC 4: Gắn API vào tên miền `danhlo.xyz` (Tùy chọn cực đẹp)

Để web gọi trực tiếp `https://danhlo.xyz/api/live` mà không cần đổi domain API:
1. Trong Cloudflare, vào trang tên miền `danhlo.xyz` -> Chọn **Workers Routes** (hoặc Websites -> danhlo.xyz -> Workers Routes).
2. Bấm **Add route**:
   - **Route**: `danhlo.xyz/api/live*`
   - **Worker**: Chọn worker `xsmb-live` đã tạo ở Bước 3.
3. Bấm **Save**.

👉 Giờ đây:
- Người dùng truy cập: `https://danhlo.xyz`
- Trình duyệt tự động gọi ngầm: `https://danhlo.xyz/api/live` cứ 4 giây/lần từ 18h14 đến 18h36.
- Có giải nào mới ra (Giải Nhất -> Giải 7 -> Giải Đặc Biệt), bảng số và bảng lô tô tự động hiện lên tức thì!
