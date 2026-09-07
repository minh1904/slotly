# Roadmap theo phase

Chia 5 nhóm tính năng trong [`vision.md`](vision.md) thành phase theo thứ tự phụ thuộc — phase
sau luôn cần dữ liệu/hạ tầng của phase trước. Không gắn tuần/ngày cụ thể — độ dài thật để đó cho
lúc code, đây chỉ là **thứ tự làm**, không phải deadline.

## Phase 1 — Nền: Identity + Availability

Chưa có gì để đặt lịch nếu chưa có host và chưa có khung giờ rảnh — mọi phase sau đều phụ thuộc
vào 2 thứ này.

- Đăng nhập host (Better-Auth)
- Host cấu hình khung giờ rảnh theo tuần cho 1 loại event duy nhất (vd "30 phút call")
- Data model: `User`, `AvailabilityRule`

**Xong khi:** host đăng nhập được, tự cấu hình được lịch rảnh qua UI, dữ liệu lưu đúng.

## Phase 2 — Lõi booking (rủi ro cao nhất, làm ngay sau nền)

Đây là phần quyết định dự án có "chạy được" hay không — cố tình đẩy lên sớm thay vì để cuối, vì
double-booking là rủi ro lớn nhất đã xác định (xem `vision.md`).

- Trang public: invitee xem slot còn trống, đúng theo timezone của họ (không cần đăng nhập)
- Tạo booking — chặn double-booking bằng constraint ở tầng DB, không chỉ check ở app
- Data model: `Booking`

**Xong khi:** 2 request đặt cùng 1 slot cùng lúc — chỉ 1 cái thành công, cái kia nhận lỗi rõ ràng.
Khách ở timezone khác host thấy đúng giờ của họ.

## Phase 3 — Đổi ý

Chỉ có ý nghĩa khi đã có booking thật từ Phase 2.

- Host huỷ/đổi lịch từ dashboard
- Invitee tự huỷ/đổi lịch qua link trong email — không cần liên hệ host

**Xong khi:** cả 2 phía đều thao tác được mà không cần thao tác thủ công nào từ phía còn lại.

## Phase 4 — Đồng bộ calendar

Tính năng cộng thêm, không chặn các phase trước — có thể làm sau cùng mà không ảnh hưởng luồng
chính.

- OAuth kết nối Google Calendar (host, từ dashboard settings)
- Booking mới → tự tạo event trên Google Calendar (1 chiều)
- Push notification (watch channel) + fallback sync định kỳ, vì Google không đảm bảo delivery
  100%

**Xong khi:** booking mới xuất hiện trên Google Calendar thật của host trong vài giây, và vẫn đúng
dù push notification bị miss (nhờ fallback sync).

## Phase 5 — Thông báo & hoàn thiện

Gói lại trải nghiệm — không có tính năng mới, chỉ nối các phase trước lại thành sản phẩm hoàn
chỉnh.

- Email xác nhận khi đặt lịch thành công (Resend)
- Email nhắc lịch trước giờ hẹn
- Landing page
- Deploy (Vercel)

**Xong khi:** đi từ landing page → đặt lịch → nhận email → thấy trên Google Calendar, không đụng
tay vào code.

## Ghi chú

- Thứ tự trên **không phải cố định tuyệt đối** — nếu Phase 2 (double-booking + timezone) khó hơn
  dự tính, xem lại Kill criteria đã ghi trong repo spec gốc trước khi cố đẩy tiếp sang Phase 3.
- Mỗi phase nên có 1 commit/PR riêng, `scope` trong commit message khớp với feature chính của
  phase đó (`feat(booking): ...`, `feat(calendar-sync): ...`).
