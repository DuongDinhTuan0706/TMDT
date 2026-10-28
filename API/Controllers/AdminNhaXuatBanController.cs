using API.Dtos;
using API.Extension;
using API.Models;
using API.RepositoryService.Service;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [Route("api/nha-xuat-ban")]
    [ApiController]
    [AdminOnly]
    public class AdminNhaXuatBanController : ControllerBase
    {
        private readonly INhaXuatBanServices _service;

        public AdminNhaXuatBanController(
            INhaXuatBanServices service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetList()
        {
            return Ok(await _service.GetListAsync());
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var result =
                await _service.GetByIdAsync(id);

            if (result == null)
                return NotFound(
                    "Không tìm thấy nhà xuất bản!");

            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create(
            [FromBody] NhaXuatBanDTO dto)
        {
            var nhaXuatBan = new NhaXuatBan
            {
                TenNhaXuatBan = dto.TenNhaXuatBan,
                DiaChi = dto.DiaChi,
                Isdelete = false
            };

            var result =
                await _service.CreateAsync(nhaXuatBan);

            return Ok(new
            {
                success = result == 1,
                message = "Thêm nhà xuất bản thành công!"
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(
            int id,
            [FromBody] NhaXuatBanDTO dto)
        {
            var nhaXuatBan =
                await _service.GetByIdAsync(id);

            if (nhaXuatBan == null)
                return NotFound(
                    "Không tìm thấy nhà xuất bản!");

            nhaXuatBan.TenNhaXuatBan =
                dto.TenNhaXuatBan;

            nhaXuatBan.DiaChi = dto.DiaChi;

            var result =
                await _service.UpdateAsync(nhaXuatBan);

            return Ok(new
            {
                success = result == 1,
                message =
                    "Cập nhật nhà xuất bản thành công!"
            });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var nhaXuatBan =
                await _service.GetByIdAsync(id);

            if (nhaXuatBan == null)
                return NotFound(
                    "Không tìm thấy nhà xuất bản!");

            var result =
                await _service.DeleteAsync(nhaXuatBan);

            return Ok(new
            {
                success = result == 1,
                message =
                    "Xóa nhà xuất bản thành công!"
            });
        }
    }
}