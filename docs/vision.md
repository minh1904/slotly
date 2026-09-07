# Tầm nhìn

Chỉ ở mức tổng quan — Slotly là gì và vì sao, chưa đi vào chi tiết implementation. Kế hoạch chi
tiết theo từng tính năng sẽ nằm ở các file riêng, bổ sung sau.

## Slotly là gì

Một booking scheduler tối giản, theo tinh thần Calendly: host công bố khung giờ rảnh theo tuần,
invitee chọn 1 slot còn trống mà không cần tạo tài khoản, booking không thể đụng nhau, và cả hai
phía đều tự động nhận thông báo.

## Vì sao chọn hình dạng này

Mọi tool scheduling ngoài kia đều hội tụ về cùng ~15 nhóm tính năng (event type, quy tắc
availability, đồng bộ calendar, xử lý timezone, thông báo, team scheduling, thanh toán, routing
form...). Slotly cố tình chỉ làm đúng lõi booking 1:1 — phần mà tool nào cũng có — và bỏ qua
team/thanh toán/routing form, vốn chỉ xuất hiện ở nhóm sản phẩm cao cấp nhất của thị trường (App
Store của Cal.com, intake form/payment của Acuity, tier team của Calendly). Ưu tiên làm sâu thay vì
làm rộng: làm đúng phần khó (không double-booking, timezone chính xác) thay vì copy hời hợt mọi
tính năng.

## Ai dùng, và mỗi phía thực sự cần gì

**Host** (người bị đặt lịch) cần: kiểm soát được thời điểm mình có thể bị đặt (buffer time, min
notice), tin tưởng không bao giờ bị đặt trùng giờ, và không phải tự tay tạo lại event trên
calendar của mình hay tự đi nhắc lịch.

**Invitee** (người đặt lịch) cần: thấy đúng giờ theo timezone *của chính họ* mà không phải đoán,
đặt lịch không cần tạo tài khoản, và tự huỷ/đổi lịch mà không phải email qua lại với host.

## Điều duy nhất bắt buộc phải đúng

Các sản phẩm scheduling thật đã từng gặp 2 lỗi lặp đi lặp lại làm mất lòng tin ngay lập tức: âm
thầm mặc định sai timezone khi không detect được, và double-booking khi 2 người cùng chọn 1 slot
cùng lúc. Cả hai đều giải được ở tầng dữ liệu (xác nhận rõ timezone thay vì đoán; constraint ở
tầng DB thay vì chỉ check ở app) — đây là chỗ duy nhất Slotly không được phép làm tắt, kể cả ở MVP.

## Các nhóm tính năng, nhìn tổng quan

- **Availability** — host định nghĩa lịch rảnh lặp lại theo tuần cho 1 loại event.
- **Booking** — invitee xem slot trống theo đúng timezone của họ, đặt lịch, nhận xác nhận.
- **Đổi ý** — cả 2 phía đều huỷ/đổi lịch được mà không cần qua lại email.
- **Đồng bộ calendar** — booking đã xác nhận tạo event lên Google Calendar của host, 1 chiều.
- **Identity** — host có tài khoản; invitee thì không cần.

## Cố tình không làm

Nhiều loại event, team/round-robin scheduling, thanh toán, routing form, đồng bộ calendar 2
chiều, app mobile riêng. Đây chính là những tính năng phân biệt giữa 1 booking *tool* và 1 booking
*platform* — ngoài tầm với của bản đầu tiên, và không phải trọng tâm của việc xây dự án này.
