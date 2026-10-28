# BookStore Admin Frontend

## Cài đặt
1. Giải nén thư mục `admin` vào `D:\ThuongMaiDienTu\TMDT\TMDT\Frontend\admin`.
2. Chạy API backend trong Visual Studio.
3. Chạy frontend bằng Live Server tại `http://localhost:5500` hoặc `http://127.0.0.1:5500`.
4. Mở `http://localhost:5500/admin/login.html`.
5. Địa chỉ API mặc định là `https://localhost:7091`. Nếu API chạy cổng khác, nhập đúng địa chỉ tại form đăng nhập.

## File
- `login.html`: đăng nhập qua `POST /api/KhachHang/login`; chỉ tiếp tục khi response có Role=Admin.
- `index.html`: dashboard quản trị.
- `admin.css`: giao diện responsive.
- `admin.js`: tích hợp CRUD với API hiện tại.

## Lưu ý backend cần xác nhận
- `AdminOnlyAttribute` đọc `Role` từ session (`mySetting.Role`). Trong action `Login` được gửi, controller nhìn thấy đang đặt `MaKhachHang` vào session; hãy bảo đảm `KhachHangServices.Login()` cũng đặt `Role` vào session, nếu không các API quản trị sẽ trả 401/403 dù login trả Role=Admin.
- `Program.cs` CORS hiện chỉ cho phép `http://localhost:5500` và `http://127.0.0.1:5500`. Nếu dùng cổng khác, thêm origin tương ứng.
- Các API danh mục/sách có thể trả lỗi nếu đang bị ràng buộc khóa ngoại hoặc nếu sách đã được dùng trong hóa đơn. Đây là phản hồi của backend/database, không phải lỗi giao diện.
- `SachController` dùng `PUT /api/sach/{id}` với model `Sach`; payload được gửi theo các trường model hiện có.
- API quản lý khách hàng hiện được dùng ở chế độ xem danh sách/chi tiết; controller được cung cấp chưa thể hiện endpoint sửa/xóa khách hàng.
- Chức năng xóa hóa đơn được nối theo endpoint API, hãy cân nhắc quy tắc nghiệp vụ và sao lưu dữ liệu trước khi thao tác trên database thật.
