using API.Dtos;
using API.Extension;
using API.Models;
using API.RepositoryService.Service;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [Route("api/tac-gia")]
    [ApiController]
    [AdminOnly]
    public class AdminTacGiaController : ControllerBase
    {
        private readonly ITacGiumServices _service;

        public AdminTacGiaController(
            ITacGiumServices service)
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
            var result = await _service.GetByIdAsync(id);

            if (result == null)
                return NotFound("Không tìm thấy tác giả!");

            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create(
            [FromBody] TacGiumDTO dto)
        {
            var tacGia = new TacGium
            {
                TenTacGia = dto.TenTacGia,
                Isdelete = false
            };

            var result =
                await _service.CreateAsync(tacGia);

            return Ok(new
            {
                success = result == 1,
                message = "Thêm tác giả thành công!"
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(
            int id,
            [FromBody] TacGiumDTO dto)
        {
            var tacGia =
                await _service.GetByIdAsync(id);

            if (tacGia == null)
                return NotFound("Không tìm thấy tác giả!");

            tacGia.TenTacGia = dto.TenTacGia;

            var result =
                await _service.UpdateAsync(tacGia);

            return Ok(new
            {
                success = result == 1,
                message = "Cập nhật tác giả thành công!"
            });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var tacGia =
                await _service.GetByIdAsync(id);

            if (tacGia == null)
                return NotFound("Không tìm thấy tác giả!");

            var result =
                await _service.DeleteAsync(tacGia);

            return Ok(new
            {
                success = result == 1,
                message = "Xóa tác giả thành công!"
            });
        }
    }
}