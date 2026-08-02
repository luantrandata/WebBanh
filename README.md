# Tiệm Bánh Online

Website bán bánh: danh mục & quản lý sản phẩm, giỏ hàng & đặt hàng, quản lý đơn hàng,
QR chuyển khoản (VietQR), nút chat Zalo, và trang quản trị có thể tự chỉnh toàn bộ
nội dung (thương hiệu, banner, chính sách, trang tuỳ chỉnh...).

Đây là site **tĩnh** (HTML/CSS/JS thuần, không cần build tool) kết nối tới
**Supabase** (cơ sở dữ liệu + đăng nhập admin).

## Cấu trúc thư mục

```
banh-shop/
├── index.html          ← trang chính, nạp toàn bộ CSS/JS
├── config.js            ← chứa URL + anon key Supabase của bạn
├── css/style.css
├── js/
│   ├── utils.js          hàm dùng chung (định dạng tiền, icon SVG...)
│   ├── store.js           toàn bộ hàm gọi Supabase (đọc/ghi dữ liệu)
│   ├── blocks.js          hệ thống "khối nội dung" cho trang tuỳ chỉnh
│   ├── site.js             giao diện khách hàng
│   ├── admin.js            giao diện quản trị
│   └── router.js           điều hướng trang + khởi động app
├── supabase/schema.sql  ← chạy 1 lần trong Supabase để tạo bảng + phân quyền
├── _headers              ← khai báo header bảo mật cho Cloudflare Pages
└── README.md
```

## 1. Thiết lập Supabase (đã có URL + key sẵn trong `config.js`)

1. Vào project Supabase của bạn → **SQL Editor** → **New query**.
2. Copy toàn bộ nội dung file `supabase/schema.sql`, dán vào và bấm **Run**.
   File này tạo các bảng `categories`, `products`, `orders`, `site_settings`,
   `pages`, thiết lập **Row Level Security** (khách chỉ đọc được dữ liệu công khai
   và tạo đơn hàng; chỉ admin đã đăng nhập mới sửa được dữ liệu), tạo sẵn
   **bucket lưu ảnh** (`images`) để dùng tính năng tải ảnh lên trong trang quản
   trị, và chèn sẵn dữ liệu mẫu.
   > Nếu bạn đã chạy `schema.sql` từ trước (không có phần bucket `images`), chỉ
   > cần copy và chạy riêng đoạn **STORAGE** ở cuối file để bổ sung.
3. Tạo tài khoản admin: vào **Authentication → Users → Add user**, nhập email +
   mật khẩu của bạn (tick **Auto Confirm User**). Đây là tài khoản bạn dùng để
   đăng nhập trang `/#/admin`.

Nếu sau này bạn đổi sang project Supabase khác, chỉ cần sửa 2 dòng trong
`config.js`.

## 2. Chạy thử trên máy (trước khi đưa lên GitHub)

Vì trình duyệt chặn gọi `fetch` từ file mở trực tiếp (`file://`), cần chạy qua
một server tĩnh đơn giản. Ví dụ dùng Python (có sẵn trên hầu hết máy):

```bash
cd banh-shop
python3 -m http.server 8080
```

Sau đó mở `http://localhost:8080` trên trình duyệt.

## 3. Đưa lên GitHub

```bash
cd banh-shop
git init
git add .
git commit -m "Website bán bánh - bản đầu tiên"
```

Tạo một repository mới trên GitHub (không cần tick "Add README"), sau đó:

```bash
git remote add origin https://github.com/<ten-tai-khoan>/<ten-repo>.git
git branch -M main
git push -u origin main
```

## 4. Deploy lên domain riêng — Cloudflare Pages

1. Vào **dash.cloudflare.com → Workers & Pages → Create application → Pages →
   Connect to Git**.
2. Chọn repo vừa tạo trên GitHub.
3. Cấu hình build:
   - **Framework preset**: None
   - **Build command**: để trống
   - **Build output directory**: `/` (thư mục gốc)
4. Bấm **Save and Deploy** — sau ~30-60 giây bạn có 1 link dạng `xxx.pages.dev`
   chạy được ngay.
5. Gắn domain riêng: vào project vừa tạo → tab **Custom domains** → **Add
   domain** → nhập domain của bạn.
   - Nếu domain đã dùng Cloudflare làm DNS: tự động trỏ + cấp SSL trong 1-2 phút.
   - Nếu domain mua ở nơi khác: cần chuyển nameserver sang Cloudflare trước
     (Cloudflare sẽ hướng dẫn cụ thể ở bước này).

Từ lúc này, mỗi khi bạn (hoặc mình) sửa code và `git push`, Cloudflare Pages sẽ
tự động build & deploy lại — không cần thao tác thủ công.

## 5. Sử dụng

- Trang khách hàng: `/` — danh mục, giỏ hàng, đặt hàng, tra cứu đơn, chat Zalo.
- Trang quản trị: `/#/admin` — đăng nhập bằng email/mật khẩu đã tạo ở bước 1.3.
  - **Tổng quan**: thống kê nhanh.
  - **Sản phẩm**: thêm/sửa/xoá sản phẩm, quản lý danh mục. Ảnh sản phẩm có thể
    dán URL hoặc bấm **Tải ảnh lên** để chọn ảnh từ máy (tự động lưu vào
    Supabase Storage, tối đa 5MB/ảnh).
  - **Đơn hàng**: xem chi tiết, cập nhật trạng thái, xác nhận thanh toán chuyển khoản.
  - **Trang & Nội dung**: tạo trang mới (chính sách, giới thiệu...) bằng cách
    ghép các khối có sẵn (Tiêu đề+Văn bản, Ảnh+Văn bản, Lưới sản phẩm, FAQ,
    Banner kêu gọi hành động); và chỉnh khối nội dung thêm hiển thị ngay ở
    trang chủ.
  - **Cài đặt Website**: tên thương hiệu, logo, nội dung banner, thông tin liên
    hệ, Zalo, thông tin ngân hàng để tạo QR.

## Giới hạn cần biết

- Trừ tồn kho khi đặt hàng chạy trực tiếp từ trình duyệt khách (không có
  transaction ở tầng server), nên trong trường hợp hiếm gặp nhiều khách mua
  cùng lúc sản phẩm sắp hết hàng, số lượng có thể lệch nhẹ. Với quy mô một tiệm
  bánh vừa và nhỏ, rủi ro này không đáng kể.
- Gói miễn phí của Supabase tạm dừng project nếu không có hoạt động trong 7
  ngày liên tục (project sẽ tự "ngủ"); chỉ cần bạn hoặc khách truy cập lại là
  project tự khởi động lại sau ít phút.
