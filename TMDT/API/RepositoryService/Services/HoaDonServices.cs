using API.Data;
using API.Dtos;
using API.Models;
using Microsoft.EntityFrameworkCore;
using API.Repository;

namespace API.RepositoryService.Service
{
    public interface IHoaDonServices
    {
        // =========================
        // ADMIN
        // =========================

        Task<IEnumerable<HoaDon>> GetListAsync();

        Task<HoaDon?> GetByIdAsync(int id);

        Task<int> CreateAsync(HoaDon hoaDon);

        Task<int> UpdateAsync(HoaDon hoaDon);

        Task<int> DeleteAsync(HoaDon hoaDon);


        // =========================
        // USER
        // =========================

        Task<IEnumerable<LichSuMuaHangDTO>>
            GetLichSuMuaHangAsync(int maKhachHang);

        Task<HoaDonChiTietDTO?>
            GetChiTietHoaDonAsync(
                int maHoaDon,
                int maKhachHang);


        // =========================
        // ADMIN - CHI TIẾT
        // =========================

        Task<HoaDonChiTietDTO?>
            GetChiTietHoaDonAdminAsync(
                int maHoaDon);


        // =========================
        // ADMIN - TRẠNG THÁI
        // =========================

        Task<bool>
            UpdateTrangThaiThanhToanAsync(
                int maHoaDon,
                bool trangThai);
    }


    public class HoaDonServices : IHoaDonServices
    {
        private readonly IRepository<HoaDon>
            _HoaDonRepository;

        private readonly QlbanSachContext
            _context;


        public HoaDonServices(
            IRepository<HoaDon> hoaDonRepository,
            QlbanSachContext context)
        {
            _HoaDonRepository = hoaDonRepository;
            _context = context;
        }


        // =====================================================
        // ADMIN
        // =====================================================

        public async Task<IEnumerable<HoaDon>>
            GetListAsync()
        {
            return await _HoaDonRepository
                .GetListAsync();
        }


        public async Task<HoaDon?>
            GetByIdAsync(int id)
        {
            return await _HoaDonRepository
                .GetByIdAsync(id);
        }


        public async Task<int>
            CreateAsync(HoaDon hoaDon)
        {
            return await _HoaDonRepository
                .CreateAsync(hoaDon);
        }


        public async Task<int>
            UpdateAsync(HoaDon hoaDon)
        {
            return await _HoaDonRepository
                .UpdateAsync(hoaDon);
        }


        public async Task<int>
            DeleteAsync(HoaDon hoaDon)
        {
            return await _HoaDonRepository
                .DeleteAsync(hoaDon);
        }


        // =====================================================
        // USER - LỊCH SỬ MUA HÀNG
        // =====================================================

        public async Task<IEnumerable<LichSuMuaHangDTO>>
            GetLichSuMuaHangAsync(
                int maKhachHang)
        {
            var hoaDons = await _context.HoaDons

                .Where(x =>
                    x.MaKhachHang == maKhachHang &&
                    x.Isdelete == false)

                .OrderByDescending(x => x.NgayLap)

                .Select(x => new LichSuMuaHangDTO
                {
                    MaHoaDon = x.MaHoaDon,

                    NgayLap =
                        x.NgayLap ?? DateTime.MinValue,

                    TongTien =
                        (double)x.TongTien,

                    DiaChi =
                        x.DiaChi,

                    SoDienThoai =
                        x.SoDienThoai,

                    PhuongThucThanhToan =
                        x.PhuongThucThanhToan ?? "",

                    GhiChu =
                        x.GhiChu ?? ""
                })

                .ToListAsync();

            return hoaDons;
        }


        // =====================================================
        // USER - CHI TIẾT HÓA ĐƠN
        // =====================================================

        public async Task<HoaDonChiTietDTO?>
            GetChiTietHoaDonAsync(
                int maHoaDon,
                int maKhachHang)
        {
            var hoaDon =
                await _context.HoaDons

                .Include(x =>
                    x.ChiTietHoaDons)

                .ThenInclude(x =>
                    x.MaSachNavigation)

                .FirstOrDefaultAsync(x =>
                    x.MaHoaDon == maHoaDon &&
                    x.MaKhachHang == maKhachHang &&
                    x.Isdelete == false);


            if (hoaDon == null)
                return null;


            return MapHoaDonChiTiet(hoaDon);
        }


        // =====================================================
        // ADMIN - CHI TIẾT HÓA ĐƠN
        // =====================================================

        public async Task<HoaDonChiTietDTO?>
            GetChiTietHoaDonAdminAsync(
                int maHoaDon)
        {
            var hoaDon =
                await _context.HoaDons

                .Include(x =>
                    x.ChiTietHoaDons)

                .ThenInclude(x =>
                    x.MaSachNavigation)

                .FirstOrDefaultAsync(x =>
                    x.MaHoaDon == maHoaDon &&
                    x.Isdelete == false);


            if (hoaDon == null)
                return null;


            return MapHoaDonChiTiet(hoaDon);
        }


        // =====================================================
        // ADMIN - CẬP NHẬT TRẠNG THÁI THANH TOÁN
        // =====================================================

        public async Task<bool>
            UpdateTrangThaiThanhToanAsync(
                int maHoaDon,
                bool trangThai)
        {
            var hoaDon =
                await _context.HoaDons

                .FirstOrDefaultAsync(x =>
                    x.MaHoaDon == maHoaDon &&
                    x.Isdelete == false);


            if (hoaDon == null)
                return false;


            hoaDon.TrangThaiThanhToan =
                trangThai;


            await _context.SaveChangesAsync();


            return true;
        }


        // =====================================================
        // MAP ENTITY -> DTO
        // =====================================================

        private HoaDonChiTietDTO
            MapHoaDonChiTiet(
                HoaDon hoaDon)
        {
            return new HoaDonChiTietDTO
            {
                MaHoaDon =
                    hoaDon.MaHoaDon,

                MaKhachHang =
                    hoaDon.MaKhachHang,

                NgayLap =
                    hoaDon.NgayLap,

                TongTien =
                    hoaDon.TongTien,

                TenNguoiNhan =
                    hoaDon.TenNguoiNhan,

                SoDienThoai =
                    hoaDon.SoDienThoai,

                DiaChi =
                    hoaDon.DiaChi,

                GhiChu =
                    hoaDon.GhiChu,

                PhuongThucThanhToan =
                    hoaDon.PhuongThucThanhToan,

                TrangThaiThanhToan =
                    hoaDon.TrangThaiThanhToan,

                MaGiamGia =
                    hoaDon.MaGiamGia,

                ChiTiet =
                    hoaDon.ChiTietHoaDons

                    .Where(x =>
                        x.Isdelete == false)

                    .Select(x =>
                        new HoaDonItemDTO
                        {
                            MaSach =
                                x.MaSach,

                            TenSach =
                                x.MaSachNavigation
                                    .TenSach,

                            AnhBia =
                                x.MaSachNavigation
                                    .AnhBia,

                            SoLuong =
                                x.SoLuong,

                            DonGia =
                                x.DonGia,

                            ThanhTien =
                                x.ThanhTien
                                ??
                                (x.DonGia * x.SoLuong)
                        })

                    .ToList()
            };
        }
    }
}