using API.Data;
using API.Dtos;
using API.Extension;
using API.RepositoryService.Service;
using API.RepositoryService.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace API.RepositoryService.Service
{
    public interface IThanhToanServices
    {
        Task<ThongTinKhachHangDTO?> GetThongTinKhachHang();
        Task<ThanhToanViewDTO> GetGioHangThanhToan();
        Task<ThanhToanResultDTO> ThanhToan(ThanhToanDTO dto);
    }
    public class ThanhToanServices : IThanhToanServices
    {
        private readonly QlbanSachContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IVietQRService _vietQRService;
        public ThanhToanServices(QlbanSachContext context,IHttpContextAccessor httpContextAccessor, IVietQRService vietQRService)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
            _vietQRService = vietQRService;
        }
        private int GetMaKhachHang()
        {
            var context = _httpContextAccessor.HttpContext;

            if (context == null)
                throw new Exception("HttpContext không tồn tại!");

            var session = context.Session;

            Console.WriteLine(
                $"[THANHTOAN] Session ID: {session.Id}"
            );

            Console.WriteLine(
                $"[THANHTOAN] Cookie Session: " +
                $"{context.Request.Cookies.ContainsKey(".API.Session")}"
            );

            var maKhachHang =
                session.GetInt32(mySetting.MaKhachHang);

            Console.WriteLine(
                $"[THANHTOAN] MaKhachHang trong Session: " +
                $"{maKhachHang?.ToString() ?? "NULL"}"
            );

            if (!maKhachHang.HasValue || maKhachHang.Value <= 0)
            {
                throw new Exception(
                    "Không tìm thấy mã khách hàng trong Session. " +
                    "Vui lòng đăng nhập lại!"
                );
            }

            return maKhachHang.Value;
        }


        public async Task<ThongTinKhachHangDTO?> GetThongTinKhachHang()
        {
            var session = _httpContextAccessor.HttpContext?.Session;

            if (session == null)
                return null;

            var maKhachHang =
                session.GetInt32(mySetting.MaKhachHang);

            // Chưa đăng nhập
            if (!maKhachHang.HasValue)
                return null;

            var khachHang = await _context.KhachHangs
                .FirstOrDefaultAsync(x =>
                    x.MaKhachHang == maKhachHang.Value);

            if (khachHang == null)
                return null;

            return new ThongTinKhachHangDTO
            {
                TenKhachHang = khachHang.TenKhachHang,
                SoDienThoai = khachHang.SoDienThoai,
                DiaChi = khachHang.DiaChi
            };
        }

        public async Task<ThanhToanViewDTO> GetGioHangThanhToan()
        {
            var session = _httpContextAccessor.HttpContext?.Session;
            var maKhachHang = session?.GetInt32(mySetting.MaKhachHang);

            var result = new ThanhToanViewDTO();

            if (maKhachHang.HasValue)
            {
                // Khách đã đăng nhập: lấy giỏ hàng trong database
                var gioHang = await _context.GioHangs
                    .Where(x =>
                        x.MaKhachHang == maKhachHang.Value &&
                        x.Isdelete == false)
                    .ToListAsync();

                if (!gioHang.Any())
                    return result;

                var maSachList = gioHang
                    .Select(x => x.MaSach)
                    .Distinct()
                    .ToList();

                var sachList = await _context.Saches
                    .Where(x => maSachList.Contains(x.MaSach))
                    .ToListAsync();

                foreach (var item in gioHang)
                {
                    var sach = sachList.FirstOrDefault(
                        x => x.MaSach == item.MaSach);

                    if (sach == null)
                        continue;

                    var donGia = Convert.ToDecimal(sach.Gia);
                    var thanhTien = donGia * item.SoLuong;

                    result.Items.Add(new ThanhToanItemDTO
                    {
                        MaSach = sach.MaSach,
                        TenSach = sach.TenSach,
                        AnhBia = sach.AnhBia,
                        SoLuong = item.SoLuong,
                        DonGia = donGia,
                        ThanhTien = thanhTien
                    });

                    result.TongTien += thanhTien;
                }

                return result;
            }

            // Khách chưa đăng nhập: lấy giỏ hàng trong Session
            var sessionCart =
                session?.Get<List<CartItemDTO>>(mySetting.CART_KEY)
                ?? new List<CartItemDTO>();

            if (!sessionCart.Any())
                return result;

            var maSachSession = sessionCart
                .Select(x => x.MaSach)
                .Distinct()
                .ToList();

            var sachSession = await _context.Saches
                .Where(x => maSachSession.Contains(x.MaSach))
                .ToListAsync();

            foreach (var item in sessionCart)
            {
                var sach = sachSession.FirstOrDefault(
                    x => x.MaSach == item.MaSach);

                if (sach == null)
                    continue;

                var donGia = Convert.ToDecimal(sach.Gia);
                var thanhTien = donGia * item.SoLuong;

                result.Items.Add(new ThanhToanItemDTO
                {
                    MaSach = sach.MaSach,
                    TenSach = sach.TenSach,
                    AnhBia = sach.AnhBia,
                    SoLuong = item.SoLuong,
                    DonGia = donGia,
                    ThanhTien = thanhTien
                });

                result.TongTien += thanhTien;
            }

            return result;
        }   

        public async Task<ThanhToanResultDTO> ThanhToan(ThanhToanDTO dto)
        {
            var maKhachHang = GetMaKhachHang();
            if (dto.PhuongThucThanhToan != "COD" &&
                dto.PhuongThucThanhToan != "ChuyenKhoan")
            {
                throw new Exception(
                    "Phương thức thanh toán không hợp lệ!");
            }

            var gioHang = await _context.GioHangs
                .Where(x =>
                    x.MaKhachHang == maKhachHang &&
                    x.Isdelete == false)
                .ToListAsync();

            if (!gioHang.Any())
            {
                throw new Exception(
                    "Giỏ hàng đang trống!");
            }


            var maSachList = gioHang
                .Select(x => x.MaSach)
                .ToList();

            var sachList = await _context.Saches
                .Where(x => maSachList.Contains(x.MaSach))
                .ToListAsync();


            foreach (var item in gioHang)
            {
                var sach = sachList
                    .FirstOrDefault(x =>
                        x.MaSach == item.MaSach);

                if (sach == null)
                {
                    throw new Exception(
                        $"Sách có mã {item.MaSach} không tồn tại!");
                }
            }


            decimal tongTien = 0;

            foreach (var item in gioHang)
            {
                var sach = sachList
                    .First(x => x.MaSach == item.MaSach);

                tongTien +=
                    Convert.ToDecimal(sach.Gia)
                    * item.SoLuong;
            }


            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {

                var hoaDon = new Models.HoaDon
                {
                    MaKhachHang = maKhachHang,
                    NgayLap = DateTime.Now,
                    TongTien = tongTien,
                    SoDienThoai = dto.SoDienThoai,
                    DiaChi = dto.DiaChi,
                    TenNguoiNhan = dto.TenNguoiNhan,
                    GhiChu = dto.GhiChu,

                    PhuongThucThanhToan =dto.PhuongThucThanhToan,
                    TrangThaiThanhToan = false,

                    Isdelete = false
                };

                _context.HoaDons.Add(hoaDon);

                await _context.SaveChangesAsync();

                foreach (var item in gioHang)
                {
                    var sach = sachList
                        .First(x =>
                            x.MaSach == item.MaSach);

                    decimal donGia =
                        Convert.ToDecimal(sach.Gia);

                    decimal thanhTien =
                        donGia * item.SoLuong;

                    var chiTiet = new Models.ChiTietHoaDon
                    {
                        MaHoaDon = hoaDon.MaHoaDon,
                        MaSach = item.MaSach,
                        SoLuong = item.SoLuong,
                        DonGia = donGia,
                        ThanhTien = thanhTien,
                        Isdelete = false
                    };

                    _context.ChiTietHoaDons.Add(chiTiet);
                }

                await _context.SaveChangesAsync();

                var sachYeuThichList =
                    await _context.SachYeuThiches
                        .Where(x =>
                            x.MaKhachHang == maKhachHang &&
                            maSachList.Contains(x.MaSach))
                        .ToListAsync();

                foreach (var sachYeuThich in sachYeuThichList)
                {
                    // 1 = Đã mua
                    sachYeuThich.TrangThai = true;
                }

                await _context.SaveChangesAsync();
                foreach (var item in gioHang)
                {
                    item.Isdelete = true;
                }

                await _context.SaveChangesAsync();

                string? qrCode = null;

                if (dto.PhuongThucThanhToan == "ChuyenKhoan")
                {
                    qrCode = _vietQRService.CreateQRCode(
                        tongTien,
                        hoaDon.MaHoaDon);
                }

                await transaction.CommitAsync();

                return new ThanhToanResultDTO
                {
                    MaHoaDon = hoaDon.MaHoaDon,
                    TongTien = tongTien,
                    PhuongThucThanhToan = dto.PhuongThucThanhToan,
                    QRCode = qrCode
                };
            }
            catch
            {
                if (transaction.GetDbTransaction().Connection != null)
                {
                    await transaction.RollbackAsync();
                }

                throw;
            }
        }
    }
}