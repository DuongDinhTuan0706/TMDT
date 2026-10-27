using API.Dtos;
using API.Extension;
using API.Models;
using API.RepositoryService.Service;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [Route("api/hoa-don")]
    [ApiController]
    [AdminOnly]
    public class AdminHoaDonController : ControllerBase
    {
        private readonly IHoaDonServices _hoaDonServices;

        public AdminHoaDonController(
            IHoaDonServices hoaDonServices)
        {
            _hoaDonServices = hoaDonServices;
        }


        [HttpGet]
        public async Task<IActionResult> GetList()
        {
            var result =
                await _hoaDonServices.GetListAsync();

            return Ok(new
            {
                success = true,
                data = result
            });
        }


        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var result =
                await _hoaDonServices.GetChiTietHoaDonAdminAsync(id);

            if (result == null)
            {
                return NotFound(new
                {
                    success = false,
                    message = "Không tìm thấy hóa đơn!"
                });
            }

            return Ok(new
            {
                success = true,
                data = result
            });
        }


        [HttpPut("{id}/trang-thai-thanh-toan")]
        public async Task<IActionResult>
            UpdateTrangThaiThanhToan(
                int id,
                [FromQuery] bool trangThai)
        {
            var result =
                await _hoaDonServices
                    .UpdateTrangThaiThanhToanAsync(
                        id,
                        trangThai);

            if (!result)
            {
                return NotFound(new
                {
                    success = false,
                    message = "Không tìm thấy hóa đơn!"
                });
            }

            return Ok(new
            {
                success = true,
                message = trangThai
                    ? "Đã xác nhận thanh toán!"
                    : "Đã chuyển về chưa thanh toán!"
            });
        }



        [HttpPut("{id}")]
        public async Task<IActionResult> Update(
            int id,
            [FromBody] HoaDonDTO dto)
        {
            var hoaDon =
                await _hoaDonServices.GetByIdAsync(id);

            if (hoaDon == null)
            {
                return NotFound(new
                {
                    success = false,
                    message = "Không tìm thấy hóa đơn!"
                });
            }

            hoaDon.TenNguoiNhan = dto.TenNguoiNhan;
            hoaDon.SoDienThoai = dto.SoDienThoai;
            hoaDon.DiaChi = dto.DiaChi;
            hoaDon.GhiChu = dto.GhiChu;
            hoaDon.PhuongThucThanhToan =
                dto.PhuongThucThanhToan;
            hoaDon.MaGiamGia = dto.MaGiamGia;

            var result =
                await _hoaDonServices.UpdateAsync(hoaDon);

            return Ok(new
            {
                success = result == 1,
                message = "Cập nhật hóa đơn thành công!"
            });
        }



        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var hoaDon =
                await _hoaDonServices.GetByIdAsync(id);

            if (hoaDon == null)
            {
                return NotFound(new
                {
                    success = false,
                    message = "Không tìm thấy hóa đơn!"
                });
            }

            var result =
                await _hoaDonServices.DeleteAsync(hoaDon);

            return Ok(new
            {
                success = result == 1,
                message = "Xóa hóa đơn thành công!"
            });
        }
    }
}