using API.Repository;
using API.Models;

namespace API.RepositoryService.Service
{
    public interface ITheLoaiServices
    {
        Task<IEnumerable<TheLoai>> GetListAsync();
        Task<TheLoai> GetByIdAsync(int id);
        Task<int> CreateAsync(TheLoai TheLoai);
        Task<int> UpdateAsync(TheLoai TheLoai);
        Task<int> DeleteAsync(TheLoai TheLoai);
    }
    public class TheLoaiServices : ITheLoaiServices
    {
        private readonly IRepository<TheLoai> _TheLoaiRepository;
        public TheLoaiServices(IRepository<TheLoai> TheLoaiRepository)
        {
            _TheLoaiRepository = TheLoaiRepository;
        }
        public async Task<IEnumerable<TheLoai>> GetListAsync()
        {
            return await _TheLoaiRepository.GetListAsync();
        }
        public async Task<TheLoai> GetByIdAsync(int id)
        {
            return await _TheLoaiRepository.GetByIdAsync(id);
        }
        public async Task<int> CreateAsync(TheLoai TheLoai)
        {
            return await _TheLoaiRepository.CreateAsync(TheLoai);
        }
        public async Task<int> UpdateAsync(TheLoai TheLoai)
        {
            return await _TheLoaiRepository.UpdateAsync(TheLoai);
        }
        public async Task<int> DeleteAsync(TheLoai TheLoai)
        {
            return await _TheLoaiRepository.DeleteAsync(TheLoai);
        }
    }
}
