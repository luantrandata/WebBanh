-- =========================================================================
-- SCHEMA CHO WEBSITE BÁN BÁNH
-- Cách dùng: Vào Supabase Dashboard → SQL Editor → New query → dán toàn bộ
-- nội dung file này → Run. Chỉ cần chạy MỘT LẦN khi khởi tạo project.
-- =========================================================================

create extension if not exists "pgcrypto";

-- ---------- Danh mục sản phẩm ----------
create table if not exists categories (
  id text primary key,
  name text not null,
  icon text default '🍰',
  sort_order int default 0
);

-- ---------- Sản phẩm ----------
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category_id text references categories(id) on delete set null,
  price numeric not null default 0,
  stock int not null default 0,
  active boolean not null default true,
  image text default '🍰',
  description text default '',
  created_at timestamptz default now()
);

-- ---------- Đơn hàng ----------
create table if not exists orders (
  id text primary key,
  customer_name text not null,
  phone text not null,
  address text not null,
  note text default '',
  payment text not null default 'cod',        -- 'cod' | 'transfer'
  payment_notified boolean default false,
  payment_notified_at timestamptz,
  payment_confirmed boolean default false,
  items jsonb not null default '[]',
  total numeric not null default 0,
  status text not null default 'pending',      -- pending | confirmed | shipping | completed | cancelled
  created_at timestamptz default now()
);

-- ---------- Cài đặt website (1 dòng duy nhất, id = 1) ----------
create table if not exists site_settings (
  id int primary key default 1,
  data jsonb not null default '{}'
);

-- ---------- Trang / nội dung tuỳ chỉnh (chính sách, giới thiệu, khối nội dung trang chủ...) ----------
create table if not exists pages (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  blocks jsonb not null default '[]',
  published boolean not null default true,
  show_in_footer boolean not null default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- =========================================================================
-- ROW LEVEL SECURITY
-- Khách (anon key): được ĐỌC sản phẩm/danh mục/cài đặt/trang, và được TẠO đơn hàng.
-- Admin (đã đăng nhập qua Supabase Auth): được TOÀN QUYỀN chỉnh sửa mọi bảng.
-- =========================================================================

alter table categories enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table site_settings enable row level security;
alter table pages enable row level security;

-- Đọc công khai
create policy "public read categories" on categories for select using (true);
create policy "public read products" on products for select using (true);
create policy "public read settings" on site_settings for select using (true);
create policy "public read pages" on pages for select using (true);

-- Khách được tạo đơn hàng, nhưng KHÔNG được đọc/sửa trực tiếp đơn hàng của người khác
create policy "public insert orders" on orders for insert with check (true);
create policy "admin read orders" on orders for select using (auth.role() = 'authenticated');
create policy "admin update orders" on orders for update using (auth.role() = 'authenticated');
create policy "admin delete orders" on orders for delete using (auth.role() = 'authenticated');

-- Cho khách tra cứu đơn hàng của CHÍNH MÌNH bằng số điện thoại (qua RPC, xem bên dưới)
-- và báo "đã chuyển khoản" mà KHÔNG được sửa bất kỳ trường nào khác (chặn bằng function, không mở UPDATE công khai).

-- Admin (đã đăng nhập) toàn quyền ghi trên tất cả các bảng
create policy "admin write categories" on categories for insert with check (auth.role() = 'authenticated');
create policy "admin update categories" on categories for update using (auth.role() = 'authenticated');
create policy "admin delete categories" on categories for delete using (auth.role() = 'authenticated');

create policy "admin write products" on products for insert with check (auth.role() = 'authenticated');
create policy "admin update products" on products for update using (auth.role() = 'authenticated');
create policy "admin delete products" on products for delete using (auth.role() = 'authenticated');

create policy "admin write settings" on site_settings for insert with check (auth.role() = 'authenticated');
create policy "admin update settings" on site_settings for update using (auth.role() = 'authenticated');

create policy "admin write pages" on pages for insert with check (auth.role() = 'authenticated');
create policy "admin update pages" on pages for update using (auth.role() = 'authenticated');
create policy "admin delete pages" on pages for delete using (auth.role() = 'authenticated');

-- =========================================================================
-- HÀM RPC CÔNG KHAI (an toàn, giới hạn đúng những gì khách được phép làm)
-- Vì bảng orders không mở quyền đọc/sửa công khai, khách tương tác qua 2 hàm dưới đây.
-- =========================================================================

-- Khách tra cứu đơn hàng CỦA MÌNH bằng số điện thoại (không cần đăng nhập)
create or replace function lookup_orders_by_phone(p_phone text)
returns setof orders
language sql
security definer
set search_path = public
as $$
  select * from orders where phone = p_phone order by created_at desc;
$$;
grant execute on function lookup_orders_by_phone(text) to anon;

-- Khách báo "đã chuyển khoản" — CHỈ được đổi 2 cờ này, không sửa được gì khác
create or replace function notify_payment(p_order_id text)
returns void
language sql
security definer
set search_path = public
as $$
  update orders
  set payment_notified = true, payment_notified_at = now()
  where id = p_order_id and payment = 'transfer';
$$;
grant execute on function notify_payment(text) to anon;

-- Lấy 1 đơn vừa đặt để hiển thị trang "Đặt hàng thành công" (không cần đăng nhập)
create or replace function get_order_by_id(p_order_id text)
returns setof orders
language sql
security definer
set search_path = public
as $$
  select * from orders where id = p_order_id;
$$;
grant execute on function get_order_by_id(text) to anon;

-- Trừ tồn kho sau khi khách đặt hàng — CHỈ trừ đúng số lượng, không cho set tuỳ ý,
-- không bao giờ âm. Đây là cách an toàn để khách (chưa đăng nhập) vẫn có thể
-- cập nhật tồn kho mà không cần mở quyền UPDATE trực tiếp trên bảng products.
create or replace function decrement_product_stock(p_product_id uuid, p_qty int)
returns void
language sql
security definer
set search_path = public
as $$
  update products set stock = greatest(0, stock - p_qty) where id = p_product_id;
$$;
grant execute on function decrement_product_stock(uuid, int) to anon;

-- =========================================================================
-- DỮ LIỆU MẪU (có thể xoá/sửa sau trong trang quản trị)
-- =========================================================================

insert into categories (id, name, icon, sort_order) values
  ('banh-kem','Bánh Kem','🎂',1),
  ('banh-nuong','Bánh Nướng','🥐',2),
  ('banh-bap','Bánh Bắp','🌽',3),
  ('tea-break','Tea Break','🍮',4),
  ('kem','Kem','🍦',5),
  ('cookies','Cookies','🍪',6)
on conflict (id) do nothing;

insert into products (name, category_id, price, stock, active, image, description) values
  ('Bánh Kem Dâu Tây Tươi','banh-kem',325000,18,true,'🍰','Cốt bông lan mềm mịn, phủ kem tươi béo nhẹ và dâu tây tươi theo mùa.'),
  ('Bánh Kem Socola Bỉ','banh-kem',355000,12,true,'🎂','Lớp cốt cacao đậm đà kết hợp kem socola Bỉ nguyên chất.'),
  ('Croissant Bơ Pháp','banh-nuong',38000,40,true,'🥐','Vỏ bánh nhiều lớp vàng óng, thơm bơ, nướng mới mỗi sáng.'),
  ('Pate Chaud Bò','banh-nuong',29000,30,true,'🥧','Vỏ bánh giòn rụm nhân thịt bò xay đậm đà.'),
  ('Bánh Bắp Kem Tươi','banh-bap',225000,15,true,'🌽','Cốt bông lan mềm mịn hoà quyện kem bắp béo ngậy.'),
  ('Tiramisu Cốc','tea-break',45000,20,true,'🍮','Tiramisu chuẩn vị Ý trong cốc nhỏ xinh.'),
  ('Gelato Sô Cô La','kem',55000,24,true,'🍦','Kem Ý nguyên bản, chất kem mềm mịn, đậm vị socola.'),
  ('Cookies Bơ Hạnh Nhân','cookies',19000,50,true,'🍪','Bánh quy bơ giòn tan, rắc hạnh nhân lát thơm bùi.')
on conflict do nothing;

insert into site_settings (id, data) values (1, '{
  "brandName": "Tên Thương Hiệu",
  "logoEmoji": "🍰",
  "logoImage": "",
  "heroEyebrow": "Thủ công mỗi ngày",
  "heroTitle": "Bánh ngon, làm bằng\ntất cả sự tận tâm.",
  "heroDesc": "Từ bánh kem sinh nhật, bánh nướng kiểu Pháp đến kem gelato mát lạnh — mỗi chiếc bánh đều được làm thủ công từ nguyên liệu tuyển chọn.",
  "heroEmoji": "🎂",
  "footerDesc": "Tiệm bánh thủ công với nguyên liệu tuyển chọn, mang đến những chiếc bánh tinh tế cho mọi khoảnh khắc quan trọng của bạn.",
  "hotline": "1900 0000",
  "email": "info@tenthuonghieu.vn",
  "address": "",
  "zaloLink": "",
  "facebookLink": "",
  "bankBin": "",
  "bankName": "",
  "bankAccountNumber": "",
  "bankAccountName": ""
}') on conflict (id) do nothing;

insert into pages (slug, title, blocks, published, show_in_footer, sort_order) values
(
  '_home', 'Trang chủ',
  '[
    {"type":"hero","eyebrow":"Thủ công mỗi ngày","heading":"Bánh ngon, làm bằng\ntất cả sự tận tâm.","text":"Từ bánh kem sinh nhật, bánh nướng kiểu Pháp đến kem gelato mát lạnh — mỗi chiếc bánh đều được làm thủ công từ nguyên liệu tuyển chọn.","emoji":"🎂","buttonLabel":"Đặt bánh ngay","buttonLink":"#/category/all"},
    {"type":"category_grid","heading":"Khám phá theo dòng bánh"},
    {"type":"products","heading":"Sản phẩm được yêu thích","category":"all"}
  ]',
  true, false, 0
),
(
  'chinh-sach-giao-hang', 'Chính sách giao hàng',
  '[{"type":"heading_text","heading":"Chính sách giao hàng","text":"Cửa hàng giao hàng trong nội thành trong vòng 2-4 giờ kể từ khi xác nhận đơn. Với đơn đặt trước (bánh sinh nhật, bánh sự kiện), vui lòng đặt trước tối thiểu 24 giờ."}]',
  true, true, 1
),
(
  'chinh-sach-doi-tra', 'Chính sách đổi trả',
  '[{"type":"heading_text","heading":"Chính sách đổi trả","text":"Sản phẩm lỗi do vận chuyển hoặc sản xuất được đổi/hoàn trong vòng 24 giờ kể từ khi nhận hàng. Vui lòng giữ nguyên bao bì và liên hệ ngay qua hotline hoặc Zalo để được hỗ trợ."}]',
  true, true, 2
),
(
  'gioi-thieu', 'Giới thiệu',
  '[{"type":"heading_text","heading":"Về chúng tôi","text":"Chúng tôi là tiệm bánh thủ công, sử dụng nguyên liệu tuyển chọn để mang đến những chiếc bánh chất lượng cho mọi khoảnh khắc quan trọng của bạn."}]',
  true, true, 3
)
on conflict (slug) do nothing;

-- Nếu bạn đã chạy schema từ trước và có sẵn dòng '_home_extra' cũ (không còn dùng
-- nữa vì trang chủ giờ chỉnh sửa toàn bộ qua trang '_home'), xoá dòng thừa này đi:
delete from pages where slug = '_home_extra' and (blocks is null or blocks = '[]'::jsonb);

-- =========================================================================
-- STORAGE — bucket lưu ảnh tải lên (sản phẩm, logo, trang tuỳ chỉnh)
-- Nếu bạn đã chạy schema trước đó rồi, chỉ cần chạy riêng đoạn này thêm 1 lần.
-- =========================================================================
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

-- Ai cũng xem được ảnh (bucket public), nhưng CHỈ admin đã đăng nhập mới được tải lên/xoá
create policy "admin upload images" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'images');

create policy "admin delete images" on storage.objects
  for delete to authenticated
  using (bucket_id = 'images');

-- =========================================================================
-- CHAT TRỰC TIẾP TRÊN WEB (khách chat với admin, không cần rời trang)
-- =========================================================================
create table if not exists chat_conversations (
  id text primary key,
  customer_name text not null default 'Khách',
  phone text default '',
  created_at timestamptz default now(),
  last_message_at timestamptz default now(),
  unread_admin boolean default true,
  unread_customer boolean default false
);

create table if not exists chat_messages (
  id bigint generated by default as identity primary key,
  conversation_id text not null references chat_conversations(id) on delete cascade,
  sender text not null default 'customer', -- 'customer' | 'admin'
  message text not null,
  created_at timestamptz default now()
);

alter table chat_conversations enable row level security;
alter table chat_messages enable row level security;

-- Khách tạo hội thoại mới (không cần đăng nhập)
create policy "chat_public_create_conversation" on chat_conversations
  for insert to anon, authenticated with check (true);
-- Chỉ admin xem được danh sách/toàn bộ hội thoại
create policy "chat_admin_read_conversations" on chat_conversations
  for select to authenticated using (true);
create policy "chat_admin_update_conversations" on chat_conversations
  for update to authenticated using (true);

-- Khách và admin đều được gửi tin nhắn (insert)
create policy "chat_public_insert_message" on chat_messages
  for insert to anon, authenticated with check (true);
-- Chỉ admin đọc trực tiếp bảng tin nhắn; khách đọc qua hàm RPC bên dưới
-- (giới hạn theo đúng mã hội thoại của mình, không lộ hội thoại người khác)
create policy "chat_admin_read_messages" on chat_messages
  for select to authenticated using (true);

-- Tự động cập nhật "last_message_at" và cờ chưa đọc mỗi khi có tin nhắn mới
create or replace function chat_touch_conversation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update chat_conversations
  set last_message_at = new.created_at,
      unread_admin = case when new.sender = 'customer' then true else unread_admin end,
      unread_customer = case when new.sender = 'admin' then true else unread_customer end
  where id = new.conversation_id;
  return new;
end;
$$;
drop trigger if exists trg_chat_touch_conversation on chat_messages;
create trigger trg_chat_touch_conversation
  after insert on chat_messages
  for each row execute function chat_touch_conversation();

-- Khách lấy tin nhắn CỦA MÌNH theo đúng mã hội thoại (không cần đăng nhập,
-- không đọc được hội thoại của khách khác)
create or replace function get_chat_messages(p_conversation_id text)
returns setof chat_messages
language sql
security definer
set search_path = public
as $$
  select * from chat_messages where conversation_id = p_conversation_id order by created_at asc;
$$;
grant execute on function get_chat_messages(text) to anon;
