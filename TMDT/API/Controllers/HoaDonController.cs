using API.Data;
using API.Extension;
using API.RepositoryService.Service;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class HoaDonController : ControllerBase
    {
        private readonly IHoaDonServices _hoaDonServices;
        private readonly QlbanSachContext _context;

        public HoaDonController(
            IHoaDonServices hoaDonServices,
            QlbanSachContext context)
        {
            _hoaDonServices = hoaDonServices;
            _context = context;
        }


        // =====================================================
        // USER - LỊCH SỬ MUA HÀNG
        // =====================================================

        [HttpGet("lich-su")]
        public async Task<IActionResult>
            GetLichSuMuaHang()
        {
            var maKhachHang =
                HttpContext.Session
                    .GetInt32(mySetting.MaKhachHang);


            if (!maKhachHang.HasValue)
            {
                return Unauthorized(new
                {
                    message =
                        "Bạn chưa đăng nhập!"
                });
            }


            // Kiểm tra đã xác thực email chưa
            var khachHang =
                await _context.KhachHangs
                    .FirstOrDefaultAsync(x =>
                        x.MaKhachHang ==
                        maKhachHang.Value);


            if (khachHang == null)
            {
                return Unauthorized();
            }


            if (!khachHang.IsVerified)
            {
                return StatusCode(403, new
                {
                    message =
                        "Bạn cần xác thực email trước khi xem lịch sử mua hàng!"
                });
            }


            var result =
                await _hoaDonServices
                    .GetLichSuMuaHangAsync(
                        maKhachHang.Value);


            return Ok(result);
        }


        // =====================================================
        // USER - CHI TIẾT HÓA ĐƠN
        // =====================================================

        [HttpGet("chi-tiet/{maHoaDon}")]
        public async Task<IActionResult>
            GetChiTietHoaDon(
                int maHoaDon)
        {
            var maKhachHang =
                HttpContext.Session
                    .GetInt32(mySetting.MaKhachHang);


            if (!maKhachHang.HasValue)
            {
                return Unauthorized(new
                {
                    message =
                        "Bạn chưa đăng nhập!"
                });
            }


            // Kiểm tra xác thực email
            var khachHang =
                await _context.KhachHangs
                    .FirstOrDefaultAsync(x =>
                        x.MaKhachHang ==
                        maKhachHang.Value);


            if (khachHang == null)
            {
                return Unauthorized();
            }


            if (!khachHang.IsVerified)
            {
                return StatusCode(403, new
                {
                    message =
                        "Bạn cần xác thực email trước khi xem hóa đơn!"
                });
            }


            var result =
                await _hoaDonServices
                    .GetChiTietHoaDonAsync(
                        maHoaDon,
                        maKhachHang.Value);


            if (result == null)
            {
                return NotFound(new
                {
                    message =
                        "Không tìm thấy hóa đơn!"
                });
            }


            return Ok(result);
        }
    }
}