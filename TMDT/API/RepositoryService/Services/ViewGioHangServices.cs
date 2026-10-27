using API.Models;
using System.Linq.Expressions;
using API.Repository;

namespace API.RepositoryService.Service
{
    public interface IViewGioHangServices
    {
        Task<IEnumerable<ViewGioHang>> GetListAsync(Expression<Func<ViewGioHang, bool>> expression);
        Task<ViewGioHang> GetByIdAsync(int id);
        Task<int> CreateAsync(ViewGioHang ViewGioHang);
        Task<int> UpdateAsync(ViewGioHang ViewGioHang);
        Task<int> DeleteAsync(ViewGioHang ViewGioHang);
    }
    public class ViewGioHangServices : IViewGioHangServices
    {
        private readonly IRepository<ViewGioHang> _ViewGioHangRepository;
        public ViewGioHangServices(IRepository<ViewGioHang> ViewGioHangRepository)
        {
            _ViewGioHangRepository = ViewGioHangRepository;
        }
        public async Task<IEnumerable<ViewGioHang>> GetListAsync(Expression<Func<ViewGioHang, bool>> expression)
        {
            return await _ViewGioHangRepository.GetListAsync(expression);
        }
        public async Task<ViewGioHang> GetByIdAsync(int id)
        {
            return await _ViewGioHangRepository.GetByIdAsync(id);
        }
        public async Task<int> CreateAsync(ViewGioHang ViewGioHang)
        {
            return await _ViewGioHangRepository.CreateAsync(ViewGioHang);
        }
        public async Task<int> UpdateAsync(ViewGioHang ViewGioHang)
        {
            return await _ViewGioHangRepository.UpdateAsync(ViewGioHang);
        }
        public async Task<int> DeleteAsync(ViewGioHang ViewGioHang)
        {
            return await _ViewGioHangRepository.DeleteAsync(ViewGioHang);
        }
    }
}
