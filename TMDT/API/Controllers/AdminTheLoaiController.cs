using API.Dtos;
using API.Extension;
using API.Models;
using API.RepositoryService.Service;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [Route("api/the-loai")]
    [ApiController]
    [AdminOnly]
    public class AdminTheLoaiController : ControllerBase
    {
        private readonly ITheLoaiServices _service;

        public AdminTheLoaiController(
            ITheLoaiServices service)
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
                return NotFound("Không tìm thấy thể loại!");

            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create(
            [FromBody] TheLoaiDTO dto)
        {
            var theLoai = new TheLoai
            {
                TenTheLoai = dto.TenTheLoai,
                Isdelete = false
            };

            var result =
                await _service.CreateAsync(theLoai);

            return Ok(new
            {
                success = result == 1,
                message = "Thêm thể loại thành công!"
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(
            int id,
            [FromBody] TheLoaiDTO dto)
        {
            var theLoai =
                await _service.GetByIdAsync(id);

            if (theLoai == null)
                return NotFound("Không tìm thấy thể loại!");

            theLoai.TenTheLoai = dto.TenTheLoai;

            var result =
                await _service.UpdateAsync(theLoai);

            return Ok(new
            {
                success = result == 1,
                message = "Cập nhật thể loại thành công!"
            });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var theLoai =
                await _service.GetByIdAsync(id);

            if (theLoai == null)
                return NotFound("Không tìm thấy thể loại!");

            var result =
                await _service.DeleteAsync(theLoai);

            return Ok(new
            {
                success = result == 1,
                message = "Xóa thể loại thành công!"
            });
        }
    }
}