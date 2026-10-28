using API.Data;
using API.Dtos;
using API.Models;
using Microsoft.EntityFrameworkCore;
using API.Repository;

namespace API.RepositoryService.Service
{
    public interface ISachServices
    {
        Task<IEnumerable<SachDTO>> GetListAsync();
        Task<SachDTO?> GetByIdAsync(int id);
        Task<IEnumerable<SachDTO>> GetListByConditionAsync(SearchDTO searchDto);
        Task<int> CreateAsync(Sach sach);
        Task<int> UpdateAsync(Sach sach);
        Task<int> DeleteAsync(Sach sach);
    }

    public class SachServices : ISachServices
    {
        private readonly IRepository<Sach> _sachRepository;
        private readonly QlbanSachContext _context;

        public SachServices(
            IRepository<Sach> sachRepository,
            QlbanSachContext context)
        {
            _sachRepository = sachRepository;
            _context = context;
        }
        public async Task<IEnumerable<SachDTO>> GetListAsync()
        {
            var result = await _context.Saches
                .Select(x => new SachDTO
                {
                    MaSach = x.MaSach,
                    TenSach = x.TenSach,
                    Gia = Convert.ToDouble(x.Gia),
                    AnhBia = x.AnhBia,

                    TenNhaXuatBan = x.MaNhaXuatBanNavigation != null
                        ? x.MaNhaXuatBanNavigation.TenNhaXuatBan
                        : null,

                    TenTacGia = x.MaTacGiaNavigation != null
                        ? x.MaTacGiaNavigation.TenTacGia
                        : null,

                    TenTheLoai = x.MaTheLoaiNavigation != null
                        ? x.MaTheLoaiNavigation.TenTheLoai
                        : null
                })
                .ToListAsync();

            return result;
        }

        public async Task<SachDTO?> GetByIdAsync(int id)
        {
            var result = await _context.Saches
                .Where(x => x.MaSach == id)
                .Select(x => new SachDTO
                {
                    MaSach = x.MaSach,
                    TenSach = x.TenSach,
                    Gia = Convert.ToDouble(x.Gia),
                    AnhBia = x.AnhBia,

                    TenNhaXuatBan = x.MaNhaXuatBanNavigation != null
                        ? x.MaNhaXuatBanNavigation.TenNhaXuatBan
                        : null,

                    TenTacGia = x.MaTacGiaNavigation != null
                        ? x.MaTacGiaNavigation.TenTacGia
                        : null,

                    TenTheLoai = x.MaTheLoaiNavigation != null
                        ? x.MaTheLoaiNavigation.TenTheLoai
                        : null
                })
                .FirstOrDefaultAsync();

            return result;
        }
        public async Task<IEnumerable<SachDTO>> GetListByConditionAsync(SearchDTO searchDto)
        {
            var query = _context.Saches.AsQueryable();
            if (!string.IsNullOrEmpty(searchDto.TenSach))
            {
                query = query.Where(x => x.TenSach.Contains(searchDto.TenSach));
            }
            if (searchDto.MaTheLoai != null)
            {
                query = query.Where(x => x.MaTheLoai == searchDto.MaTheLoai);
            }

            if (searchDto.MaTacGia != null)
            {
                query = query.Where(x =>x.MaTacGia == searchDto.MaTacGia);
            }
            if (searchDto.GiaMin.HasValue)
            {
                query = query.Where(x =>x.Gia >= (decimal)searchDto.GiaMin.Value);
            }
            if (searchDto.GiaMax.HasValue)
            {
                query = query.Where(x =>x.Gia <= (decimal)searchDto.GiaMax.Value);
            }

            var result = await query
                .Select(x => new SachDTO
                {
                    MaSach = x.MaSach,
                    TenSach = x.TenSach,
                    Gia = Convert.ToDouble(x.Gia),
                    AnhBia = x.AnhBia,
                    TenNhaXuatBan = x.MaNhaXuatBanNavigation != null
                        ? x.MaNhaXuatBanNavigation.TenNhaXuatBan
                        : null,

                    TenTacGia = x.MaTacGiaNavigation != null
                        ? x.MaTacGiaNavigation.TenTacGia
                        : null,

                    TenTheLoai = x.MaTheLoaiNavigation != null
                        ? x.MaTheLoaiNavigation.TenTheLoai
                        : null
                })
                .ToListAsync();

            return result;
        }

        public async Task<int> CreateAsync(Sach sach)
        {
            if (sach == null) return 0;
            sach.MaTacGiaNavigation = null!;
            sach.MaTheLoaiNavigation = null!;
            sach.MaNhaXuatBanNavigation = null!;
            return await _sachRepository.CreateAsync(sach);
        }
        public async Task<int> UpdateAsync(Sach sach)
        {
            if (sach == null) return 0;
            sach.MaTacGiaNavigation = null!;
            sach.MaTheLoaiNavigation = null!;
            sach.MaNhaXuatBanNavigation = null!;
            return await _sachRepository.UpdateAsync(sach);
        }
        public async Task<int> DeleteAsync(Sach sach)
        {
            return await _sachRepository.DeleteAsync(sach);
        }
    }
}