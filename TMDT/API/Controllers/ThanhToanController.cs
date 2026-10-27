using API.Dtos;
using API.RepositoryService.Service;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [Route("api/thanh-toan")]
    [ApiController]
    public class ThanhToanController : ControllerBase
    {
        private readonly IThanhToanServices _thanhToanServices;

        public ThanhToanController(IThanhToanServices thanhToanServices)
        {
            _thanhToanServices = thanhToanServices;
        }

        [HttpGet("thong-tin-khach-hang")]
        public async Task<IActionResult> GetThongTinKhachHang()
        {
            var result =
                await _thanhToanServices.GetThongTinKhachHang();

            if (result == null)
            {
                return Ok(new
                {
                    message = "Khách chưa đăng nhập"
                });
            }

            return Ok(result);
        }


        [HttpGet("gio-hang")]
        public async Task<IActionResult> GetGioHangThanhToan()
        {
            var result =
                await _thanhToanServices.GetGioHangThanhToan();

            if (result.Items == null ||
                !result.Items.Any())
            {
                return BadRequest(new
                {
                    message = "Giỏ hàng đang trống!"
                });
            }

            return Ok(result);
        }


        [HttpPost]
        public async Task<IActionResult> ThanhToan(
            [FromBody] ThanhToanDTO dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var result =
                    await _thanhToanServices.ThanhToan(dto);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
        }
    }
}