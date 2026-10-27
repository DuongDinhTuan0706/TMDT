using API.Extension;
using API.Models;
using API.RepositoryService.Service;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [Route("api/danh-gia-sach")]
    [ApiController]
    public class DanhGiaSachController : ControllerBase
    {
        private readonly IDanhGiaSachServices _danhGiaSachServices;

        public DanhGiaSachController(
            IDanhGiaSachServices danhGiaSachServices)
        {
            _danhGiaSachServices = danhGiaSachServices;
        }

        [HttpGet("{sachId}")]
        public async Task<IActionResult> GetList(int sachId)
        {
            try
            {
                var result = await _danhGiaSachServices.GetListAsync(sachId);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create(
            [FromBody] DanhGiaSach danhGia)
        {
            try
            {
                var maKhachHang =
                    HttpContext.Session.GetInt32(mySetting.MaKhachHang);

                if (!maKhachHang.HasValue)
                {
                    return Unauthorized(new
                    {
                        success = false,
                        message = "Bạn phải đăng nhập để đánh giá sách!"
                    });
                }

                var result = await _danhGiaSachServices.CreateAsync(danhGia);

                return Ok(new
                {
                    success = true,
                    message = "Thêm đánh giá thành công!",
                    data = result
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }

        [HttpPut]
        public async Task<IActionResult> Update(
            [FromBody] DanhGiaSach danhGia)
        {
            try
            {
                var maKhachHang =
                    HttpContext.Session.GetInt32(mySetting.MaKhachHang);

                if (!maKhachHang.HasValue)
                {
                    return Unauthorized(new
                    {
                        success = false,
                        message = "Bạn phải đăng nhập!"
                    });
                }

                var result = await _danhGiaSachServices.UpdateAsync(danhGia);

                return Ok(new
                {
                    success = true,
                    message = "Cập nhật đánh giá thành công!",
                    data = result
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }

        [HttpDelete("{maDanhGia}")]
        public async Task<IActionResult> Delete(int maDanhGia)
        {
            try
            {
                var maKhachHang =
                    HttpContext.Session.GetInt32(mySetting.MaKhachHang);

                if (!maKhachHang.HasValue)
                {
                    return Unauthorized(new
                    {
                        success = false,
                        message = "Bạn phải đăng nhập!"
                    });
                }

                var result =
                    await _danhGiaSachServices.DeleteAsync(maDanhGia);

                return Ok(new
                {
                    success = true,
                    message = "Xóa đánh giá thành công!",
                    data = result
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }
    }
}