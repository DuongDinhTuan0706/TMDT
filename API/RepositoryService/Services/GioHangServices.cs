using API.Models;
using System.Linq.Expressions;
using API.Repository;

namespace API.RepositoryService.Service
{
    public interface IGioHangServices
    {
        Task<IEnumerable<GioHang>> GetListAsync(Expression<Func<GioHang, bool>> expression);
        Task<GioHang> GetByIdAsync(int id);
        Task<int> CreateAsync(GioHang GioHang);
        Task<int> UpdateAsync(GioHang GioHang);
        Task<int> DeleteAsync(GioHang GioHang);
    }
    public class GioHangServices : IGioHangServices
    {
        private readonly IRepository<GioHang> _GioHangRepository;
        public GioHangServices(IRepository<GioHang> GioHangRepository)
        {
            _GioHangRepository = GioHangRepository;
        }
        public async Task<IEnumerable<GioHang>> GetListAsync(Expression<Func<GioHang, bool>> expression)
        {
            return await _GioHangRepository.GetListAsync(expression);
        }
        public async Task<GioHang> GetByIdAsync(int id)
        {
            return await _GioHangRepository.GetByIdAsync(id);
        }
        public async Task<int> CreateAsync(GioHang GioHang)
        {
            return await _GioHangRepository.CreateAsync(GioHang);
        }
        public async Task<int> UpdateAsync(GioHang GioHang)
        {
            return await _GioHangRepository.UpdateAsync(GioHang);
        }
        public async Task<int> DeleteAsync(GioHang GioHang)
        {
            return await _GioHangRepository.DeleteAsync(GioHang);
        }
    }
}
