using API.Data;
using API.Dtos;
using API.Models;
using AutoMapper;
using Microsoft.EntityFrameworkCore;

namespace API.RepositoryService.Services
{
    public interface ISachYeuThichServices
    {
        Task<IEnumerable<SachYeuThichDTO>> GetByKhachHangAsync(int maKhachHang);

        Task<bool> ThemAsync(int maKhachHang, int maSach);

        Task<bool> XoaAsync(int maKhachHang, int maSach);
    }
    public class SachYeuThichServices : ISachYeuThichServices
    {
        private readonly IMapper _mapper;
        private readonly QlbanSachContext _context;

        public SachYeuThichServices(QlbanSachContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        // Đọc sách yêu thích theo mã khách hàng
        // Chỉ lấy những dòng Isdelete = 0
        public async Task<IEnumerable<SachYeuThichDTO>> GetByKhachHangAsync(int maKhachHang)
        {
            var data = await _context.SachYeuThiches
                .Where(x => x.MaKhachHang == maKhachHang && x.Isdelete == false)
                .Include(x => x.MaSachNavigation)
                .ToListAsync();

            return _mapper.Map<IEnumerable<SachYeuThichDTO>>(data);
        }

        // Thêm sách yêu thích
        public async Task<bool> ThemAsync(int maKhachHang, int maSach)
        {
            var sachYeuThich = await _context.SachYeuThiches.FirstOrDefaultAsync(x =>x.MaKhachHang == maKhachHang &&x.MaSach == maSach);
            if (sachYeuThich != null)
            {
                if ((bool)sachYeuThich.Isdelete)
                {
                    sachYeuThich.Isdelete = false;
                    await _context.SaveChangesAsync();
                    return true;
                }
                return false;
            }
            // Chưa tồn tại -> thêm mới
            var newItem = new SachYeuThich
            {
                MaKhachHang = maKhachHang,
                MaSach = maSach,
                TrangThai = false,
                Isdelete = false
            };

            _context.SachYeuThiches.Add(newItem);

            await _context.SaveChangesAsync();

            return true;
        }
        // Xóa mềm sách yêu thích
        public async Task<bool> XoaAsync(int maKhachHang, int maSach)
        {
            var sachYeuThich = await _context.SachYeuThiches
                .FirstOrDefaultAsync(x =>
                    x.MaKhachHang == maKhachHang &&
                    x.MaSach == maSach &&
                    x.Isdelete == false);

            if (sachYeuThich == null)
            {
                return false;
            }
            sachYeuThich.Isdelete = true;
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
