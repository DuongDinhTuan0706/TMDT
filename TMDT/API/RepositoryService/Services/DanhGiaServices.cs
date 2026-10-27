using API.Data;
using API.Extension;
using API.Models;
using Microsoft.EntityFrameworkCore;
using API.Repository;

namespace API.RepositoryService.Service
{
    public interface IDanhGiaSachServices
    {
        Task<IEnumerable<DanhGiaSach>> GetListAsync(int sachId);

        Task<int> CreateAsync(DanhGiaSach danhGia);

        Task<int> UpdateAsync(DanhGiaSach danhGia);

        Task<int> DeleteAsync(int MaDanhGia);
    }

    public class DanhGiaSachServices : IDanhGiaSachServices
    {
        private readonly IRepository<DanhGiaSach> _danhGiaSachRepository;
        private readonly QlbanSachContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public DanhGiaSachServices(IRepository<DanhGiaSach> danhGiaSachRepository,QlbanSachContext context,IHttpContextAccessor httpContextAccessor)
        {
            _danhGiaSachRepository = danhGiaSachRepository;
            _context = context;
            _httpContextAccessor = httpContextAccessor;
        }
        public async Task<IEnumerable<DanhGiaSach>> GetListAsync(int sachId)
        {
            return await _context.DanhGiaSaches
                .Where(x => x.MaSach == sachId)
                .ToListAsync();
        }

        public async Task<int> CreateAsync(DanhGiaSach danhGia)
        {
            var session = _httpContextAccessor.HttpContext?.Session;

            if (session == null)
                throw new Exception("Không tìm thấy Session!");

            var maKhachHang = session.GetInt32(mySetting.MaKhachHang);

            if (!maKhachHang.HasValue)
                throw new Exception("Bạn chưa đăng nhập!");

            // Tự lấy khách hàng từ Session
            // Không cho client tự truyền MaKhachHang
            danhGia.MaKhachHang = maKhachHang.Value;
            var sachExists = await _context.Saches
                .AnyAsync(x => x.MaSach == danhGia.MaSach);

            if (!sachExists)
                throw new Exception("Sách không tồn tại!");

            return await _danhGiaSachRepository.CreateAsync(danhGia);
        }

        public async Task<int> UpdateAsync(DanhGiaSach danhGia)
        {
            var session = _httpContextAccessor.HttpContext?.Session;

            if (session == null)
                throw new Exception("Không tìm thấy Session!");

            var maKhachHang = session.GetInt32(mySetting.MaKhachHang);

            if (!maKhachHang.HasValue)
                throw new Exception("Bạn chưa đăng nhập!");

            // Lấy đánh giá trong DB
            var danhGiaDb = await _context.DanhGiaSaches
                .FirstOrDefaultAsync(x =>x.MaDanhGia == danhGia.MaDanhGia);

            if (danhGiaDb == null)
                throw new Exception("Không tìm thấy đánh giá!");

            // Kiểm tra đánh giá có phải của người đăng nhập không
            if (danhGiaDb.MaKhachHang != maKhachHang.Value)
                throw new Exception(
                    "Bạn không có quyền sửa đánh giá của người khác!");

            danhGiaDb.SoSao = danhGia.SoSao;
            danhGiaDb.NoiDung = danhGia.NoiDung;

            return await _context.SaveChangesAsync();
        }

        public async Task<int> DeleteAsync(int MaDanhGia)
        {
            var session = _httpContextAccessor.HttpContext?.Session;

            if (session == null)
                throw new Exception("Không tìm thấy Session!");

            var maKhachHang = session.GetInt32(mySetting.MaKhachHang);

            if (!maKhachHang.HasValue)
                throw new Exception("Bạn chưa đăng nhập!");

            // Tìm đánh giá
            var danhGia = await _context.DanhGiaSaches
                .FirstOrDefaultAsync(x => x.MaDanhGia == MaDanhGia);

            if (danhGia == null)
                throw new Exception("Không tìm thấy đánh giá!");

            // Kiểm tra quyền
            if (danhGia.MaKhachHang != maKhachHang.Value)
                throw new Exception(
                    "Bạn không có quyền xóa đánh giá của người khác!");

            _context.DanhGiaSaches.Remove(danhGia);

            return await _context.SaveChangesAsync();
        }
    }
}