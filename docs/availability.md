# Availability — Phân tích nghiệp vụ

Chi tiết hoá nhóm tính năng **Availability** từ [`vision.md`](vision.md) và Phase 1 của
[`roadmap.md`](roadmap.md), đối chiếu với 4 sản phẩm cùng thị trường (Calendly, Cal.com, Acuity
Scheduling, SavvyCal) trước khi viết spec/design implementation.

## Phạm vi & actor

Availability chỉ có 1 actor: **Host**. Invitee không tương tác trực tiếp với tính năng này — họ
chỉ tiêu thụ *kết quả* của nó (slot còn trống) ở luồng Booking (Phase 2).

**Cập nhật (2026-09-08): mở lại "nhiều schedule đặt tên"**, đảo ngược quyết định ban đầu bên dưới.
`vision.md` vẫn giữ nguyên **1 loại event duy nhất** — điều đó *không* đổi. Nhưng multi-schedule ở
đây không phải để gán theo nhiều event type (như Calendly/Cal.com cần), mà để host **chuẩn bị sẵn
nhiều bộ giờ khác nhau** (vd "Giờ bình thường" vs "Giờ mùa lễ") và chỉ **1 bộ được đánh dấu
`isDefault`** — bộ đó mới là bộ Booking (Phase 2) thực sự dùng để tính slot cho loại event duy nhất
của host. Tham khảo trực tiếp từ UI thật của Cal.com (`app.cal.com/availability/[id]`): mỗi
schedule có tên riêng, toggle "Set as default", nút xoá, và sở hữu weekly rules + overrides +
timezone riêng của nó.

Ranh giới với Booking (Phase 2), theo đúng layering `data.ts`/`mutations.ts` của `CLAUDE.md`:
Availability **chỉ định nghĩa quy tắc rảnh**; *tính slot khả dụng thật* (trừ booking đã tồn tại,
trừ buffer, sau này trừ cả busy time từ Google Calendar ở Phase 4) là việc của Booking, không phải
của Availability. Booking (khi được xây) chỉ đọc **đúng 1 schedule**: cái có `isDefault = true`.

```
Host
 └─ Schedule (nhiều bộ, đặt tên, đúng 1 bộ isDefault = true tại mọi thời điểm)
     ├─ Timezone       : riêng theo từng schedule
     ├─ Weekly rules   : nhiều khung giờ / ngày, lặp lại mỗi tuần
     └─ Overrides      : theo ngày cụ thể, đè lên weekly rules của CHÍNH schedule đó

 └─ Booking guardrails (global, không theo từng schedule — không có khái niệm event type để gán)
     ├─ Buffer          : trước/sau mỗi booking (phút)
     ├─ Min notice      : không cho đặt trước X giờ tính từ "bây giờ"
     └─ Max advance     : không cho đặt xa hơn X ngày tính từ "hôm nay"

                    ▼ (việc của Booking — Phase 2, không phải Availability)
   Slot khả dụng = (weekly rules ⊖ overrides của schedule isDefault) ⊖ booking đã có ⊖ buffer
                    ⊖ (Phase 4: busy time từ Google Calendar)
```

## Tham khảo thị trường

| | Calendly | Cal.com | Acuity Scheduling | SavvyCal |
|---|---|---|---|---|
| Đơn vị cấu hình | Schedule/user, gán event type | Schedule object, gán event type | Per-calendar / global | Overlay lịch cá nhân |
| Weekly recurring hours | ✅ | ✅ | ✅ | ✅ |
| Nhiều khung giờ/ngày | ✅ | ✅ | ✅ | ✅ |
| Date override | ✅ (đè lên weekly) | ✅ | ✅ | ✅ |
| Buffer trước/sau | ✅, không đẩy được ra ngoài working hours | ✅ | không nổi bật | không nổi bật |
| Min notice | ✅ | ✅ | ✅ ("Minimum Hours") | — |
| Max advance (rolling window) | ✅ | ✅ | ✅ ("Maximum Days") | ✅ (dạng cap số lượng/ngày·tuần·tháng) |

**Kết luận rút ra**: weekly recurring + override + max advance là bộ ba không sản phẩm nào bỏ qua —
đây là phần lõi, không phải tính năng cao cấp. Buffer + min notice rõ nét nhất ở nhóm định vị gần
Slotly nhất (Calendly, Cal.com), khớp với việc `vision.md` đã tự liệt kê 2 thứ này vào nhu cầu bắt
buộc của Host.

## Quyết định phạm vi Phase 1

Đã chốt, bổ sung cho phần Availability còn để ngỏ trong `vision.md`/`roadmap.md`:

| Quyết định | Chọn | Vì sao |
|---|---|---|
| Date override | **Có trong Phase 1** | Không có, host phải tắt cả weekly rule để nghỉ 1 ngày — trải nghiệm tệ, và cả 4 sản phẩm tham khảo đều coi đây là tối thiểu cần có. |
| Nhiều khung giờ/ngày | **Có trong Phase 1** | Không có, host phải giả lập giờ nghỉ trưa bằng cách khác — gượng ép. Không sản phẩm tham khảo nào giới hạn 1 khung/ngày. |
| Max advance window | **Có trong Phase 1** | Tránh weekly rule sinh slot vô hạn về tương lai; là kiểm soát host cần ngay từ đầu, không phải thứ thêm sau. |

## Mô hình nghiệp vụ

### Schedule
Host có thể tạo nhiều schedule (đặt tên tự do, vd "Giờ bình thường"). Mỗi schedule sở hữu riêng:
timezone, weekly rules, overrides — đổi 1 schedule không ảnh hưởng schedule khác. Đúng **1 schedule
tại mọi thời điểm** được đánh dấu `isDefault = true` — đây là bộ Booking (Phase 2) sẽ đọc. Tạo
schedule đầu tiên → tự động là default (không thể có 0 default khi có ≥1 schedule). Đặt 1 schedule
khác làm default → schedule cũ tự động mất cờ default (không cộng dồn, giống nguyên tắc override
"thắng tuyệt đối" ở dưới). Xoá schedule đang là default mà vẫn còn schedule khác → tự động thăng 1
schedule còn lại (theo thứ tự tạo trước) lên làm default, không để trống.

### Weekly rules
Danh sách `{dayOfWeek, startTime, endTime}`, một ngày trong tuần có thể có nhiều bản ghi (khung giờ
không được chồng lấn nhau — validate khi nhập). Lặp lại vô hạn cho tới khi host sửa hoặc bị override.

### Overrides
Theo ngày cụ thể (`date`, không phải `dayOfWeek`), 2 dạng: **chặn hẳn** (host nghỉ nguyên ngày, vd
lễ) hoặc **giờ tuỳ chỉnh** (khác giờ thường lệ, vd chỉ rảnh buổi sáng hôm đó). Nếu 1 ngày vừa khớp
weekly rule vừa có override — **override thắng tuyệt đối**, không cộng dồn.

### Buffer, min notice, max advance
Ba tham số đơn giá trị, áp dụng toàn cục cho host (không cần cấu hình theo từng ngày):
- **Buffer**: phút chặn trước/sau mỗi booking, cộng vào cửa sổ bị chiếm khi tính slot (việc của
  Booking, không phải Availability — Availability chỉ lưu con số).
- **Min notice**: giờ tối thiểu tính từ thời điểm hiện tại tới slot start — chặn đặt sát giờ.
- **Max advance**: số ngày tối đa tính từ "hôm nay" theo timezone của host — chặn đặt quá xa.

## Quy tắc timezone (bắt buộc đúng — theo `vision.md`)

Weekly rules và overrides phải lưu theo **giờ địa phương của host + timezone id (IANA)**, không quy
đổi cứng sang UTC tại thời điểm lưu. Lý do: "9h–17h" của host phải luôn là 9h–17h giờ địa phương của
họ, kể cả khi DST đổi lệch UTC offset, hoặc khi host tự đổi timezone trong settings. Quy đổi sang UTC
chỉ xảy ra ở bước tính slot (Booking, Phase 2) tại thời điểm truy vấn — không bao giờ đoán/mặc định
timezone khi không detect được, đúng nguyên tắc "điều duy nhất bắt buộc phải đúng" của `vision.md`.

## Edge case cần xử lý

- **Không có schedule nào** (host xoá hết, hoặc tài khoản mới) → tương đương "không có slot", không
  phải lỗi hệ thống — giống hệt tinh thần "Availability trống hoàn toàn" bên dưới, chỉ khác là giờ
  xét ở cấp schedule thay vì cấp rule.
- **Availability trống hoàn toàn** (schedule default chưa có weekly rule nào) → Booking phải hiển
  thị "không có slot", không phải lỗi hệ thống.
- **Sửa Availability sau khi đã có booking đã xác nhận** → không hồi tố huỷ booking cũ; Availability
  chỉ ảnh hưởng tới slot *tương lai chưa đặt*. Đây là ranh giới rõ giữa Availability và Booking.
- **Override rơi vào ngày đã có booking đã xác nhận** → tương tự, override không huỷ booking đã có;
  chỉ chặn slot mới.
- **DST shift**: khung giờ theo weekly rule phải tự dịch đúng theo local time, không lệch 1 giờ vào
  ngày chuyển DST — do lưu local time + timezone id thay vì UTC tuyệt đối (xem mục trên).

## Ngoài phạm vi Phase 1

- Giới hạn số lượng booking/ngày·tuần·tháng (kiểu SavvyCal) — hay nhưng chưa ai yêu cầu, hoãn.
- Sắp xếp ưu tiên slot để dẫn dắt invitee chọn giờ tối ưu (SavvyCal) — thuộc nhóm tối ưu hoá, không
  phải lõi.
- Availability tổng hợp nhiều người (collective/team) — nằm trong danh sách "cố tình không làm" của
  `vision.md`.

## Nguồn tham khảo

- [How to set your availability — Calendly Help](https://calendly.com/help/how-to-set-your-availability)
- [How to use buffers — Calendly Help](https://calendly.com/help/how-to-use-buffers)
- [Cal.com API v2 — schedules & availability](https://cal.com/blog/open-source-scheduling-empower-your-team-with-customizable-features)
- [Limit when clients can book, edit, or cancel — Acuity Scheduling Help](https://help.acuityscheduling.com/hc/en-us/articles/27141282369037-Limit-when-clients-can-book-edit-or-cancel-their-appointments)
- [Scheduling Links — SavvyCal Docs](https://docs.savvycal.com/category/17-scheduling-links)
