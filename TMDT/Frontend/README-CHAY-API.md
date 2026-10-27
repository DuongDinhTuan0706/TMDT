# Frontend APIq – kết nối API quản lý bán sách

## Chạy frontend
1. Giải nén thư mục `Frontend_APIq`.
2. Mở thư mục này bằng VS Code và chạy bằng Live Server (không mở trực tiếp file `file://`).
3. Chạy API ASP.NET Core trong Visual Studio. Theo `launchSettings.json`, API chạy tại `http://localhost:5008` hoặc `https://localhost:7091`. Mặc định frontend gọi `http://localhost:5008`.
4. Nếu API chạy địa chỉ khác, mở DevTools Console và chạy: `localStorage.setItem('API_ROOT','http://localhost:5008')`, sau đó tải lại trang.

## CORS / Session middleware bắt buộc khi frontend và API chạy khác port
`Program.cs` hiện tại trong APIq chưa khai báo CORS. Vì đăng nhập và giỏ hàng dùng ASP.NET Session cookie, cần cho phép origin frontend cụ thể và credentials. Thêm trước `builder.Build()`:

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy => policy
        .WithOrigins("http://127.0.0.1:5500", "http://localhost:5500")
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials());
});
```

Sau `var app = builder.Build();` và trước `app.UseSession()` thêm `app.UseCors("Frontend");`. Đặt `app.UseSession()` trước `app.MapControllers()` như hiện tại. Nếu Live Server dùng port khác, thêm đúng origin đó vào `WithOrigins`; không dùng `AllowAnyOrigin()` cùng `AllowCredentials()`.

## Những trang được kết nối
- `index.html`, `shop.html`: lấy danh sách sách từ `GET /api/sach`, thêm giỏ và yêu thích.
- `register.html`: `POST /api/KhachHang/signin`; `verify-otp.html`: xác thực và gửi lại OTP.
- `login.html`: đăng nhập, cookie Session; sau đăng nhập gọi chuyển giỏ Session sang database.
- `cart.html`: giỏ khách vãng lai dùng Session, giỏ đăng nhập dùng database; tăng/giảm/xóa.
- `profile.html`: xem/sửa thông tin cá nhân.
- `favorites.html`: xem/thêm/xóa sách yêu thích.
- `book.html?id=<MaSach>`: chi tiết sách, xem/thêm/xóa đánh giá.
- `cheackout.html`: thông tin khách hàng, giỏ hàng chuẩn bị thanh toán, tạo hóa đơn và hiển thị QR nếu API trả về.
- `orders.html`: lịch sử và chi tiết hóa đơn.
- `contact.html`: giữ nguyên template.

## Lưu ý cần biết
- Các route được lấy từ controllers thực tế trong APIq.rar. Không sửa code API/database trong gói frontend này.
- API `GET /api/vietqr/test?amount=...&maHoaDon=...` chỉ được gọi khi cần kiểm tra QR; phần thanh toán hiển thị `QRCode` nếu endpoint `POST /api/thanh-toan` trả trường đó.
- Một số thao tác đánh giá (sửa/xóa) phụ thuộc API kiểm tra quyền sở hữu; giao diện hiện hỗ trợ gửi đánh giá và xóa đánh giá được trả về.
- Nếu trình duyệt báo chứng chỉ khi dùng HTTPS, chạy API qua profile HTTP (`http://localhost:5008`) trong lúc phát triển.
