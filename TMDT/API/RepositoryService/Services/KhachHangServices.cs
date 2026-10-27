using API.Data;
using API.Dtos;
using API.Extension;
using API.Models;
using API.RepositoryService.Services;
using Microsoft.EntityFrameworkCore;
using API.Repository;

namespace API.RepositoryService.Service
{
    public interface IKhachHangServices
    {

        Task<IEnumerable<KhachHangResponseDTO>> GetListAsync();

        Task<KhachHangResponseDTO?> GetByIdAsync(
            int id);

        Task<int> CreateAsync(
            KhachHang khachHang);

        Task<int> UpdateAsync(
            KhachHang khachHang);

        Task<int> DeleteAsync(
            KhachHang khachHang);

        Task<RegisterResponseDTO> SighIn(
            SighInDTO dto);

        Task<LoginResponseDTO> Login(
            LogInDTO dto);

        Task Logout();

        Task<KhachHangResponseDTO> GetMyInfo();

        Task<KhachHangResponseDTO> UpdateMyInfo(
            ThongTinKhachHangDTO dto);

        Task<bool> VerifyOTPAsync(
            int maKhachHang,
            string otp);

        Task<bool> ResendOTPAsync(
            int maKhachHang);
    }


    public class KhachHangServices : IKhachHangServices
    {
        private readonly IRepository<KhachHang> _KhachHangRepository;

        private readonly QlbanSachContext _context;

        private readonly IHttpContextAccessor _httpContextAccessor;

        private readonly ICartService _cartService;

        private readonly IOTPService _otpService;

        private readonly SendMailService _sendMailService;


        public KhachHangServices(
            IRepository<KhachHang> KhachHangRepository,
            QlbanSachContext context,
            IHttpContextAccessor httpContextAccessor,
            ICartService cartService,
            IOTPService otpService,
            SendMailService sendMailService)
        {
            _KhachHangRepository = KhachHangRepository;

            _context = context;

            _httpContextAccessor =
                httpContextAccessor;

            _cartService =
                cartService;

            _otpService =
                otpService;

            _sendMailService =
                sendMailService;
        }

        public async Task<IEnumerable<KhachHangResponseDTO>>
            GetListAsync()
        {
            var result =
                await _context.KhachHangs
                    .Select(x => new KhachHangResponseDTO
                    {
                        MaKhachHang =
                            x.MaKhachHang,

                        TenDangNhap =
                            x.TenDangNhap,

                        TenKhachHang =
                            x.TenKhachHang,

                        Email =
                            x.Email,

                        SoDienThoai =
                            x.SoDienThoai,

                        DiaChi =
                            x.DiaChi,

                        Role =
                            x.Role ?? "User",

                        IsVerified =
                            x.IsVerified
                    })
                    .ToListAsync();

            return result;
        }

        public async Task<KhachHangResponseDTO?>
            GetByIdAsync(int id)
        {
            var khachHang =
                await _context.KhachHangs
                    .FirstOrDefaultAsync(
                        x => x.MaKhachHang == id);

            if (khachHang == null)
                return null;


            return MapKhachHang(khachHang);
        }

        public async Task<int> CreateAsync(
            KhachHang khachHang)
        {
            return await
                _KhachHangRepository
                    .CreateAsync(khachHang);
        }

        public async Task<int> UpdateAsync(
            KhachHang khachHang)
        {
            return await
                _KhachHangRepository
                    .UpdateAsync(khachHang);
        }


        public async Task<int> DeleteAsync(
            KhachHang khachHang)
        {
            return await
                _KhachHangRepository
                    .DeleteAsync(khachHang);
        }


        public async Task<bool> CheckTenDangNhap(
            string tenDangNhap)
        {
            if (string.IsNullOrWhiteSpace(
                tenDangNhap))
            {
                return true;
            }


            var isExist =
                await _context.KhachHangs
                    .AnyAsync(x =>
                        x.TenDangNhap ==
                        tenDangNhap);


            return !isExist;
        }


        public async Task<bool> CheckEmail(
            string email)
        {
            if (string.IsNullOrWhiteSpace(email))
            {
                return true;
            }


            var isExist =
                await _context.KhachHangs
                    .AnyAsync(x =>
                        x.Email == email);


            return !isExist;
        }


        public async Task<bool> CheckSoDienThoai(
            string soDienThoai)
        {
            if (string.IsNullOrWhiteSpace(
                soDienThoai))
            {
                return true;
            }


            var isExist =
                await _context.KhachHangs
                    .AnyAsync(x =>
                        x.SoDienThoai ==
                        soDienThoai);


            return !isExist;
        }


        public async Task<RegisterResponseDTO>
            SighIn(SighInDTO dto)
        {


            if (!await CheckTenDangNhap(
                dto.TenDangNhap))
            {
                throw new Exception(
                    "Tên đăng nhập đã tồn tại!");
            }


            if (!await CheckEmail(dto.Email))
            {
                throw new Exception(
                    "Email đã được sử dụng!");
            }


            if (!await CheckSoDienThoai(
                dto.SoDienThoai))
            {
                throw new Exception(
                    "Số điện thoại đã được sử dụng!");
            }


            string passwordHash =
                BCrypt.Net.BCrypt.HashPassword(
                    dto.MatKhau);

            var khachHang = new KhachHang
            {
                TenDangNhap =
                    dto.TenDangNhap,

                TenKhachHang =
                    dto.TenKhachHang,

                Email =
                    dto.Email,

                SoDienThoai =
                    dto.SoDienThoai,

                MatKhau =
                    passwordHash,

                IsVerified = false,

                Role = "User"
            };

            _context.KhachHangs.Add(
                khachHang);

            await _context.SaveChangesAsync();

            string otp =
                _otpService.GenerateOTP(
                    khachHang.MaKhachHang);

            string message = $@"
                <html>
                <body>

                <h2>TheLiem Book Store</h2>

                <p>
                Xin chào
                <b>{khachHang.TenKhachHang}</b>,
                </p>

                <p>
                Cảm ơn bạn đã đăng ký tài khoản.
                </p>

                <p>
                Mã OTP xác thực tài khoản của bạn là:
                </p>

                <h1>{otp}</h1>

                <p>
                Mã OTP có hiệu lực trong
                <b>10 phút</b>.
                </p>

                <p>
                Không chia sẻ mã OTP này
                cho người khác.
                </p>

                </body>
                </html>
                ";

            bool sendMail =
                await _sendMailService.SendMail(
                    khachHang.Email,
                    "Xác thực tài khoản - TheLiem Book Store",
                    message);


            if (!sendMail)
            {
                throw new Exception(
                    "Đăng ký thành công nhưng không thể gửi OTP. Vui lòng gửi lại OTP!");
            }


            return new RegisterResponseDTO
            {
                MaKhachHang =
                    khachHang.MaKhachHang,

                Email =
                    khachHang.Email,

                IsVerified =
                    khachHang.IsVerified
            };
        }


        public async Task<LoginResponseDTO> Login(LogInDTO dto)
        {
            var khachHang = await _context.KhachHangs
                .FirstOrDefaultAsync(x => x.TenDangNhap == dto.UserName);

            if (khachHang == null)
            {
                throw new Exception(
                    "Tên đăng nhập hoặc mật khẩu không đúng!");
            }

            bool checkPassword = BCrypt.Net.BCrypt.Verify(
                dto.Password,
                khachHang.MatKhau);

            if (!checkPassword)
            {
                throw new Exception(
                    "Tên đăng nhập hoặc mật khẩu không đúng!");
            }

            var context = _httpContextAccessor.HttpContext;

            if (context == null)
            {
                throw new Exception("HttpContext không tồn tại!");
            }

            var session = context.Session;

            // Lưu thông tin khách hàng vào Session
            session.SetInt32(
                mySetting.MaKhachHang,
                khachHang.MaKhachHang);

            session.SetString(
                mySetting.TenKhachHang,
                khachHang.TenKhachHang ?? "");

            session.SetString(
                mySetting.Email,
                khachHang.Email ?? "");

            session.SetString(
                mySetting.SoDienThoai,
                khachHang.SoDienThoai ?? "");

            session.SetString(
                mySetting.Role,
                khachHang.Role ?? "User");

            // Kiểm tra Session ngay sau khi lưu
            Console.WriteLine(
                $"[LOGIN] Session ID: {session.Id}");

            Console.WriteLine(
                $"[LOGIN] MaKhachHang: " +
                $"{session.GetInt32(mySetting.MaKhachHang)}");

            // Chuyển giỏ hàng khách vãng lai vào database
            var sessionCart = _cartService.LayGioHangSession();

            if (sessionCart != null && sessionCart.Any())
            {
                await _cartService.ThemVaoGioHangTuSession(
                    khachHang.MaKhachHang,
                    sessionCart);
            }

            return new LoginResponseDTO
            {
                MaKhachHang = khachHang.MaKhachHang,
                TenKhachHang = khachHang.TenKhachHang,
                Email = khachHang.Email,
                Role = khachHang.Role ?? "User",
                IsVerified = khachHang.IsVerified
            };
        }

        public Task Logout()
        {
            var session =
                _httpContextAccessor
                    .HttpContext?
                    .Session;


            if (session == null)
                return Task.CompletedTask;
            session.Remove(
                mySetting.MaKhachHang);

            session.Remove(
                mySetting.TenKhachHang);

            session.Remove(
                mySetting.Email);

            session.Remove(
                mySetting.SoDienThoai);

            session.Remove(
                mySetting.Role);
            return Task.CompletedTask;
        }
        public async Task<KhachHangResponseDTO>
            GetMyInfo()
        {
            var session =
                _httpContextAccessor
                    .HttpContext?
                    .Session;
            if (session == null)
            {
                throw new Exception(
                    "Không tìm thấy Session!");
            }
            var maKH =
                session.GetInt32(
                    mySetting.MaKhachHang);
            if (!maKH.HasValue)
            {
                throw new Exception(
                    "Bạn chưa đăng nhập!");
            }
            var khachHang =
                await _context.KhachHangs
                    .FirstOrDefaultAsync(x =>
                        x.MaKhachHang ==
                        maKH.Value);
            if (khachHang == null)
            {
                throw new Exception(
                    "Không tìm thấy thông tin khách hàng!");
            }
            if (!khachHang.IsVerified)
            {
                throw new Exception(
                    "Bạn cần xác thực email trước khi xem thông tin cá nhân!");
            }


            return MapKhachHang(
                khachHang);
        }



        public async Task<KhachHangResponseDTO> UpdateMyInfo(
    ThongTinKhachHangDTO dto)
        {
            var session = _httpContextAccessor.HttpContext?.Session;

            if (session == null)
                throw new Exception("Không tìm thấy Session!");

            var maKH = session.GetInt32(mySetting.MaKhachHang);

            if (!maKH.HasValue)
                throw new Exception("Bạn chưa đăng nhập!");

            var khachHang = await _context.KhachHangs
                .FirstOrDefaultAsync(x => x.MaKhachHang == maKH.Value);

            if (khachHang == null)
                throw new Exception("Không tìm thấy khách hàng!");

            if (!khachHang.IsVerified)
                throw new Exception(
                    "Bạn cần xác thực email trước khi chỉnh sửa thông tin!");

            if (string.IsNullOrWhiteSpace(dto.TenKhachHang))
                throw new Exception("Họ tên không được để trống!");

            if (string.IsNullOrWhiteSpace(dto.SoDienThoai))
                throw new Exception("Số điện thoại không được để trống!");

            if (string.IsNullOrWhiteSpace(dto.Email))
                throw new Exception("Email không được để trống!");

            var email = dto.Email.Trim();
            var soDienThoai = dto.SoDienThoai.Trim();

            // Kiểm tra email có thuộc khách hàng khác không
            var emailExists = await _context.KhachHangs.AnyAsync(x =>
                x.Email == email &&
                x.MaKhachHang != maKH.Value);

            if (emailExists)
                throw new Exception("Email đã được khách hàng khác sử dụng!");

            // Kiểm tra số điện thoại có thuộc khách hàng khác không
            var phoneExists = await _context.KhachHangs.AnyAsync(x =>
                x.SoDienThoai == soDienThoai &&
                x.MaKhachHang != maKH.Value);

            if (phoneExists)
                throw new Exception(
                    "Số điện thoại đã được khách hàng khác sử dụng!");

            // Cập nhật đúng khách hàng đang đăng nhập
            khachHang.TenKhachHang = dto.TenKhachHang.Trim();
            khachHang.SoDienThoai = soDienThoai;
            khachHang.DiaChi = string.IsNullOrWhiteSpace(dto.DiaChi)
                ? null
                : dto.DiaChi.Trim();

            // Email chỉ được giữ nguyên nếu không có yêu cầu đổi email.
            // Nếu cho phép đổi email, bỏ comment dòng dưới:
            // khachHang.Email = email;

            // Lưu vào SQL Server
            await _context.SaveChangesAsync();

            // Đồng bộ Session
            session.SetString(
                mySetting.TenKhachHang,
                khachHang.TenKhachHang ?? "");

            session.SetString(
                mySetting.SoDienThoai,
                khachHang.SoDienThoai ?? "");

            session.SetString(
                mySetting.Email,
                khachHang.Email ?? "");

            // Trả về dữ liệu vừa cập nhật
            return MapKhachHang(khachHang);
        }



        public async Task<bool> VerifyOTPAsync(
            int maKhachHang,
            string otp)
        {
            var khachHang =
                await _context.KhachHangs
                    .FirstOrDefaultAsync(x =>
                        x.MaKhachHang ==
                        maKhachHang);
            if (khachHang == null)
            {
                return false;
            }
            if (khachHang.IsVerified)
            {
                return true;
            }
            bool isValid =
                _otpService.VerifyOTP(
                    maKhachHang,
                    otp);
            if (!isValid)
            {
                return false;
            }
            khachHang.IsVerified = true;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ResendOTPAsync(
            int maKhachHang)
        {
            var khachHang =
                await _context.KhachHangs
                    .FirstOrDefaultAsync(x =>
                        x.MaKhachHang ==
                        maKhachHang);


            if (khachHang == null)
            {
                return false;
            }

            if (khachHang.IsVerified)
            {
                return false;
            }
            string otp =
                _otpService.GenerateOTP(
                    maKhachHang);
            string message = $@"
                <html>
                <body>

                <h2>TheLiem Book Store</h2>

                <p>
                Xin chào
                <b>{khachHang.TenKhachHang}</b>,
                </p>

                <p>
                Mã OTP mới của bạn là:
                </p>

                <h1>{otp}</h1>

                <p>
                Mã OTP có hiệu lực trong
                <b>10 phút</b>.
                </p>

                <p>
                Mã OTP cũ không còn hiệu lực.
                </p>

                </body>
                </html>
                ";
            bool sendMail =
                await _sendMailService.SendMail(
                    khachHang.Email,
                    "Gửi lại OTP - TheLiem Book Store",
                    message);


            return sendMail;
        }
        private KhachHangResponseDTO MapKhachHang(
            KhachHang khachHang)
        {
            return new KhachHangResponseDTO
            {
                MaKhachHang =
                    khachHang.MaKhachHang,

                TenDangNhap =
                    khachHang.TenDangNhap,

                TenKhachHang =
                    khachHang.TenKhachHang,

                Email =
                    khachHang.Email,

                SoDienThoai =
                    khachHang.SoDienThoai,

                DiaChi =
                    khachHang.DiaChi,

                Role =
                    khachHang.Role ?? "User",

                IsVerified =
                    khachHang.IsVerified
            };
        }
    }
}