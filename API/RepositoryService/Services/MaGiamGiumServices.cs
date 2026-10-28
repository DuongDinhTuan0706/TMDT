using API.Repository;
using API.Models;

namespace API.RepositoryService.Service
{
    public interface IMaGiamGiumServices
    {
        Task<IEnumerable<MaGiamGium>> GetListAsync();
        Task<MaGiamGium> GetByIdAsync(int id);
        Task<int> CreateAsync(MaGiamGium MaGiamGium);
        Task<int> UpdateAsync(MaGiamGium MaGiamGium);
        Task<int> DeleteAsync(MaGiamGium MaGiamGium);
    }
    public class MaGiamGiumServices : IMaGiamGiumServices
    {
        private readonly IRepository<MaGiamGium> _MaGiamGiumRepository;
        public MaGiamGiumServices(IRepository<MaGiamGium> MaGiamGiumRepository)
        {
            _MaGiamGiumRepository = MaGiamGiumRepository;
        }
        public async Task<IEnumerable<MaGiamGium>> GetListAsync()
        {
            return await _MaGiamGiumRepository.GetListAsync();
        }
        public async Task<MaGiamGium> GetByIdAsync(int id)
        {
            return await _MaGiamGiumRepository.GetByIdAsync(id);
        }
        public async Task<int> CreateAsync(MaGiamGium MaGiamGium)
        {
            return await _MaGiamGiumRepository.CreateAsync(MaGiamGium);
        }
        public async Task<int> UpdateAsync(MaGiamGium MaGiamGium)
        {
            return await _MaGiamGiumRepository.UpdateAsync(MaGiamGium);
        }
        public async Task<int> DeleteAsync(MaGiamGium MaGiamGium)
        {
            return await _MaGiamGiumRepository.DeleteAsync(MaGiamGium);
        }
    }
}
