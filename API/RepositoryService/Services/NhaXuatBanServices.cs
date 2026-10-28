using API.Models;
using API.Repository;

namespace API.RepositoryService.Service
{
    public interface INhaXuatBanServices
    {
        Task<IEnumerable<NhaXuatBan>> GetListAsync();
        Task<NhaXuatBan?> GetByIdAsync(int id);
        Task<int> CreateAsync(NhaXuatBan nhaXuatBan);
        Task<int> UpdateAsync(NhaXuatBan nhaXuatBan);
        Task<int> DeleteAsync(NhaXuatBan nhaXuatBan);
    }

    public class NhaXuatBanServices : INhaXuatBanServices
    {
        private readonly IRepository<NhaXuatBan> _repository;

        public NhaXuatBanServices(
            IRepository<NhaXuatBan> repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<NhaXuatBan>>
            GetListAsync()
        {
            return await _repository.GetListAsync();
        }

        public async Task<NhaXuatBan?>
            GetByIdAsync(int id)
        {
            return await _repository.GetByIdAsync(id);
        }

        public async Task<int> CreateAsync(
            NhaXuatBan nhaXuatBan)
        {
            return await _repository.CreateAsync(
                nhaXuatBan);
        }

        public async Task<int> UpdateAsync(
            NhaXuatBan nhaXuatBan)
        {
            return await _repository.UpdateAsync(
                nhaXuatBan);
        }

        public async Task<int> DeleteAsync(
            NhaXuatBan nhaXuatBan)
        {
            return await _repository.DeleteAsync(
                nhaXuatBan);
        }
    }
}