using API.Extension;
using API.RepositoryService.Service;
using API.RepositoryService.Services;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [Route("api/sach-yeu-thich")]
    [ApiController]
    public class SachYeuThichController : ControllerBase
    {
        private readonly ISachYeuThichServices _service;

        public SachYeuThichController(ISachYeuThichServices service)
        {
            _service = service;
        }


        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var maKhachHang = HttpContext.Session
                .GetInt32(mySetting.MaKhachHang);

            if (!maKhachHang.HasValue)
            {
                return Unauthorized(new
                {
                    message = "Bạn chưa đăng nhập!"
                });
            }

            var result = await _service
                .GetByKhachHangAsync(maKhachHang.Value);

            return Ok(result);
        }


        [HttpPost("{maSach}")]
        public async Task<IActionResult> Them(int maSach)
        {
            var maKhachHang = HttpContext.Session
                .GetInt32(mySetting.MaKhachHang);

            if (!maKhachHang.HasValue)
            {
                return Unauthorized(new
                {
                    message = "Bạn chưa đăng nhập!"
                });
            }

            var result = await _service
                .ThemAsync(maKhachHang.Value, maSach);

            if (!result)
            {
                return BadRequest(new
                {
                    message = "Sách đã có trong danh sách yêu thích!"
                });
            }

            return Ok(new
            {
                message = "Thêm sách yêu thích thành công!"
            });
        }

        [HttpDelete("{maSach}")]
        public async Task<IActionResult> Xoa(int maSach)
        {
            var maKhachHang = HttpContext.Session
                .GetInt32(mySetting.MaKhachHang);

            if (!maKhachHang.HasValue)
            {
                return Unauthorized(new
                {
                    message = "Bạn chưa đăng nhập!"
                });
            }

            var result = await _service
                .XoaAsync(maKhachHang.Value, maSach);

            if (!result)
            {
                return NotFound(new
                {
                    message = "Sách không tồn tại trong danh sách yêu thích!"
                });
            }

            return Ok(new
            {
                message = "Xóa sách yêu thích thành công!"
            });
        }
    }
}