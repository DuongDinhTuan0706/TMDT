
using Microsoft.AspNetCore.Mvc;
using API.Models;
using API.RepositoryService.Service;

namespace API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TheLoaiController : ControllerBase
    {
        private readonly ITheLoaiServices _theLoaiServices;

        public TheLoaiController(ITheLoaiServices theLoaiServices)
        {
            _theLoaiServices = theLoaiServices;
        }

        // GET: api/TheLoai
        [HttpGet]
        public async Task<IActionResult> GetList()
        {
            var result = await _theLoaiServices.GetListAsync();
            return Ok(result);
        }

        // GET: api/TheLoai/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _theLoaiServices.GetByIdAsync(id);

            if (result == null)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy thể loại."
                });
            }

            return Ok(result);
        }

        // POST: api/TheLoai
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] TheLoai theLoai)
        {
            if (theLoai == null)
            {
                return BadRequest(new
                {
                    message = "Dữ liệu thể loại không hợp lệ."
                });
            }

            var result = await _theLoaiServices.CreateAsync(theLoai);

            if (result > 0)
            {
                return Ok(new
                {
                    message = "Thêm thể loại thành công.",
                    data = theLoai
                });
            }

            return BadRequest(new
            {
                message = "Thêm thể loại thất bại."
            });
        }

        // PUT: api/TheLoai/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(
            int id, [FromBody] TheLoai theLoai)
        {
            if (theLoai == null)
            {
                return BadRequest(new
                {
                    message = "Dữ liệu thể loại không hợp lệ."
                });
            }

            // Nếu khóa chính trong model là MaTheLoai
            if (theLoai.MaTheLoai != id)
            {
                return BadRequest(new
                {
                    message = "ID trên URL không khớp với ID thể loại."
                });
            }

            var existing = await _theLoaiServices.GetByIdAsync(id);

            if (existing == null)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy thể loại cần sửa."
                });
            }

            var result = await _theLoaiServices.UpdateAsync(theLoai);

            if (result > 0)
            {
                return Ok(new
                {
                    message = "Cập nhật thể loại thành công.",
                    data = theLoai
                });
            }

            return BadRequest(new
            {
                message = "Cập nhật thể loại thất bại."
            });
        }

        // DELETE: api/TheLoai/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var existing = await _theLoaiServices.GetByIdAsync(id);

            if (existing == null)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy thể loại cần xóa."
                });
            }

            var result = await _theLoaiServices.DeleteAsync(existing);

            if (result > 0)
            {
                return Ok(new
                {
                    message = "Xóa thể loại thành công."
                });
            }

            return BadRequest(new
            {
                message = "Xóa thể loại thất bại."
            });
        }
    }
}
