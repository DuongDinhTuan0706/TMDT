using API.Dtos;
using API.Models;
using AutoMapper;
using API.Repository;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace API.Services
{
    public interface ITinNhanService
    {
        Task<IEnumerable<TinNhanDTO>> GetChatHistoryAsync(int userId1, int userId2);
        Task<TinNhanDTO> SendMessageAsync(CreateTinNhanDTO createDto);
        Task MarkAsReadAsync(int maTinNhan);
        Task DeleteMessageAsync(int maTinNhan);
    }
    public class TinNhanService : ITinNhanService
    {
        private readonly IRepository<TinNhan> _repository;
        private readonly IMapper _mapper;

        public TinNhanService(IRepository<TinNhan> repository, IMapper mapper)
        {
            _repository = repository;
            _mapper = mapper;
        }

        public async Task<IEnumerable<TinNhanDTO>> GetChatHistoryAsync(int userId1, int userId2)
        {
            var chatHistory = await _repository.GetListAsync(x =>
                (x.NguoiGui == userId1 && x.NguoiNhan == userId2) ||
                (x.NguoiGui == userId2 && x.NguoiNhan == userId1));

            // Sắp xếp theo thời gian và map sang DTO
            var sortedHistory = chatHistory.OrderBy(x => x.ThoiGianGui).ToList();
            return _mapper.Map<IEnumerable<TinNhanDTO>>(sortedHistory);
        }

        public async Task<TinNhanDTO> SendMessageAsync(CreateTinNhanDTO createDto)
        {
            var tinNhan = _mapper.Map<TinNhan>(createDto);

            tinNhan.ThoiGianGui = DateTime.Now;
            tinNhan.TrangThaiDaDoc = false;

            await _repository.CreateAsync(tinNhan); 

            return _mapper.Map<TinNhanDTO>(tinNhan);
        }

        public async Task MarkAsReadAsync(int maTinNhan)
        {
            var tinNhan = await _repository.GetByIdAsync(maTinNhan);
            if (tinNhan != null)
            {
                tinNhan.TrangThaiDaDoc = true;
                await _repository.UpdateAsync(tinNhan); 
            }
        }

        public async Task DeleteMessageAsync(int maTinNhan)
        {
            var tinNhan = await _repository.GetByIdAsync(maTinNhan);
            if (tinNhan != null)
            {
                // DeleteAsync của bạn nhận vào Entity và tự động chuyển Isdelete = true rồi lưu lại
                await _repository.DeleteAsync(tinNhan);
            }
        }
    }
}