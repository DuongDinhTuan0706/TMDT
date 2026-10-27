using API.Repository;
using API.Models;

namespace API.RepositoryService.Service
{
    public interface ITacGiumServices
    {
        Task<IEnumerable<TacGium>> GetListAsync();
        Task<TacGium> GetByIdAsync(int id);
        Task<int> CreateAsync(TacGium TacGium);
        Task<int> UpdateAsync(TacGium TacGium);
        Task<int> DeleteAsync(TacGium TacGium);
    }
    public class TacGiumServices : ITacGiumServices
    {
        private readonly IRepository<TacGium> _TacGiumRepository;
        public TacGiumServices(IRepository<TacGium> TacGiumRepository)
        {
            _TacGiumRepository = TacGiumRepository;
        }
        public async Task<IEnumerable<TacGium>> GetListAsync()
        {
            return await _TacGiumRepository.GetListAsync();
        }
        public async Task<TacGium> GetByIdAsync(int id)
        {
            return await _TacGiumRepository.GetByIdAsync(id);
        }
        public async Task<int> CreateAsync(TacGium TacGium)
        {
            return await _TacGiumRepository.CreateAsync(TacGium);
        }
        public async Task<int> UpdateAsync(TacGium TacGium)
        {
            return await _TacGiumRepository.UpdateAsync(TacGium);
        }
        public async Task<int> DeleteAsync(TacGium TacGium)
        {
            return await _TacGiumRepository.DeleteAsync(TacGium);
        }
    }
}
