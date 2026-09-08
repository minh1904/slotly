# Server Actions vs REST API — cơ chế đang dùng trong Slotly

Giải thích tại sao gọi `createRuleAction(...)` từ component mà không có route nào trong
`src/app/api/`, và nó khác REST truyền thống ở đâu. Bổ sung cho quyết định đã ghi ngắn gọn ở
`CLAUDE.md` ("API layer: Server Actions only").

## REST API truyền thống hoạt động thế nào

```
Client                                    Server
  │  fetch("/api/availability/rules", {   │
  │    method: "POST",                    │
  │    body: JSON.stringify({...})        │
  │  })                                    │
  │ ─────────────────────────────────►    │  route.ts nhận request
  │                                         │  tự parse body, tự check auth,
  │                                         │  tự gọi DB, tự trả JSON
  │  ◄─────────────────────────────────    │
  │  200 { id, dayOfWeek, ... }           │
```

Đặc điểm: URL cố định, có thể gọi từ bất kỳ đâu (Postman, mobile app, dịch vụ khác), bạn tự viết
contract (request/response shape), tự viết validate + auth trong `route.ts`, và về nguyên tắc có
thể mô tả bằng OpenAPI/Swagger để bên thứ ba tích hợp.

## Server Actions hoạt động thế nào (thực tế đang chạy trong Slotly)

`actions.ts` không phải là code chạy trực tiếp trên browser — dòng `"use server"` ở đầu file báo
cho Next.js: lúc build, **thay implementation thật bằng 1 tham chiếu** (action ID đã mã hoá) trong
bundle gửi cho client. Khi component gọi `createRuleAction(input)`, code chạy trên browser thực
chất chỉ gửi:

```
Client                                    Server
  │  createRuleAction(input)  // trông    │
  │  như gọi hàm bình thường               │
  │ ─────────────────────────────────►    │
  │  POST /availability                    │  Next.js router đọc header
  │  header: Next-Action: <hash mã hoá>   │  Next-Action → tìm đúng function
  │  body: input đã serialize             │  trong actions.ts → chạy nó
  │                                         │  (mutations.ts → Prisma → DB)
  │  ◄─────────────────────────────────    │
  │  RSC payload mới (không phải JSON      │
  │  tự do — là cây React đã render sẵn)  │
```

Không có file `route.ts` nào vì **Next.js tự sinh endpoint này lúc build**, bạn không viết tay.
Vài chi tiết quan trọng về cơ chế này:

- **Action ID được mã hoá, không cố định**: sinh lại mỗi lần build, cache tối đa 14 ngày — không
  phải URL đoán được như `/api/rules/create`.
- **Chỉ nhận `POST`**, và chỉ chạy khi được gọi từ đúng cơ chế này — không bao giờ chạy như side
  effect của một request `GET` (khác REST, nơi ai cũng có thể tự gọi `GET`/`POST` vào URL).
- **CSRF được chặn ở tầng framework**, không cần CSRF token: Next.js so `Origin` header với
  `Host`/`X-Forwarded-Host`, request từ domain khác bị từ chối thẳng.
- **Function không dùng ở client bị loại khỏi bundle** — không có "endpoint công khai" nào bạn
  không chủ động expose.
- Response trả về **không phải JSON tự do** — là cây RSC (React Server Component payload) để
  client patch lại UI, đó là lý do không thể lấy response này dùng cho việc khác (vd mobile app)
  như JSON REST thường.

## So sánh trực tiếp

| | REST API (`route.ts`) | Server Actions (đang dùng) |
|---|---|---|
| Endpoint | Bạn tự khai báo, URL cố định | Next.js tự sinh, ID mã hoá, đổi mỗi build |
| Gọi từ ngoài Next.js app (mobile, bên thứ 3) | Được | Không — không có contract ổn định để gọi |
| Contract request/response | Tự định nghĩa (JSON), có thể viết OpenAPI | Ẩn, gắn chặt với component gọi nó |
| Auth/validate | Tự viết trong `route.ts` | Tự viết trong `actions.ts` (như đang làm) |
| CSRF | Phải tự lo (token, SameSite cookie...) | Next.js tự chặn qua Origin check |
| Cache phía client | Tuỳ bạn tự implement (hoặc thêm TanStack Query) | Không có — dựa vào `revalidatePath` + re-render |
| Độ trễ cảm nhận sau mutation | Tuỳ bạn control (optimistic update dễ làm) | Chờ round-trip `revalidatePath` xong mới thấy (~vài giây ở dev) |
| Boilerplate | Nhiều hơn (route + fetch call + JSON parse 2 đầu) | Ít hơn — gọi thẳng như 1 hàm async |

## Vì sao Slotly chọn Server Actions

`CLAUDE.md` đã chốt: *"API layer: Server Actions only — no tRPC. Route Handlers are only for the
Google Calendar webhook."* Lý do thực tế:

- Slotly hiện tại **chỉ có 1 client** (chính web app này) — không có mobile app, không có bên thứ 3
  cần gọi API, nên mất khả năng "gọi từ ngoài" của REST không phải cái giá phải trả.
- Ít boilerplate hơn cho MVP: không cần viết route + fetch wrapper + JSON schema ở 2 đầu.
- CSRF được lo miễn phí, không cần tự implement.
- Đi theo hướng Rallly (repo tham khảo gần nhất, cùng stack) đang chuyển sang: tRPC đóng băng ở
  phần đọc cũ, mọi mutation mới đều qua Server Actions.

## Giới hạn thật cần biết (không phải lý thuyết suông)

Đã tự kiểm chứng trong lúc build tính năng Availability:

- **Không có cache phía client** — mỗi lần cần data mới phải đợi `revalidatePath` invalidate rồi
  router tự fetch lại RSC tree, không có khái niệm "query key" để cache/share giữa nhiều
  component như TanStack Query.
- **Độ trễ cảm nhận sau mutation** — vì phải chờ hết round-trip mới thấy UI cập nhật (không có
  optimistic update sẵn), thấy rõ nhất ở dev mode do Turbopack phải compile lại route.
- **Không gọi được từ ngoài Next.js app** — nếu sau này có mobile app hoặc cần public API cho bên
  thứ 3, sẽ phải viết thêm Route Handler thật (giống cách đã làm cho Google Calendar webhook), không
  tái dùng được `actions.ts` nguyên trạng.

## Khi nào nên xem lại quyết định này

- Cần optimistic UI mượt hơn mà không muốn thêm dependency → dùng `useOptimistic` của React 19
  (đã có sẵn trong stack, không cần thêm gì).
- Cần cache/share data phức tạp giữa nhiều trang, hoặc polling real-time (ví dụ: team scheduling
  nhiều host cùng xem/sửa 1 lịch chung) → lúc đó TanStack Query mới thực sự đáng giá, không phải vì
  "REST tốt hơn" mà vì bài toán cache/đồng bộ phức tạp hơn hẳn use case 1-host hiện tại.
- Cần public API cho bên thứ 3 hoặc mobile app riêng → bắt buộc phải có Route Handler thật, Server
  Actions không đáp ứng được.
