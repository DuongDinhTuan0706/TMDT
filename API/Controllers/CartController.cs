using API.Dtos;
using API.RepositoryService.Services;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [Route("api/cart")]
    [ApiController]
    public class CartController : ControllerBase
    {
        private readonly ICartService _cartService;

        public CartController(ICartService cartService)
        {
            _cartService = cartService;
        }
        [HttpGet("customer/{maKhachHang}")]
        public async Task<IActionResult> LayGioHang(int maKhachHang)
        {
            try
            {
                var result = await _cartService.LayGioHang(maKhachHang);

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

        [HttpPost("customer/add")]
        public async Task<IActionResult> ThemCardVaoGioHang(
            int maKhachHang,
            [FromBody] AddCartDTO item)
        {
            try
            {
                await _cartService.ThemCardVaoGioHang(
                    maKhachHang,
                    item
                );

                return Ok(new
                {
                    success = true,
                    message = "Đã thêm sản phẩm vào giỏ hàng!"
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


        [HttpGet("guest")]
        public IActionResult LayGioHangSession()
        {
            try
            {
                var cart = _cartService.LayGioHangSession();

                return Ok(new
                {
                    success = true,
                    cart = cart
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

        [HttpPost("guest/add")]
        public IActionResult ThemVaoGioHangSession(
            [FromBody] AddCartDTO item)
        {
            try
            {
                _cartService.ThemVaoGioHangSession(item);

                return Ok(new
                {
                    success = true,
                    message = "Đã thêm sản phẩm vào giỏ hàng Session!",
                    cart = _cartService.LayGioHangSession()
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


        [HttpPost("guest/to-db/{maKhachHang}")]
        public async Task<IActionResult> ThemVaoGioHangTuSession(
            int maKhachHang)
        {
            try
            {
                var sessionCart = _cartService.LayGioHangSession();

                if (sessionCart == null || !sessionCart.Any())
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Giỏ hàng Session đang trống!"
                    });
                }

                await _cartService.ThemVaoGioHangTuSession(
                    maKhachHang,
                    sessionCart
                );

                return Ok(new
                {
                    success = true,
                    message = "Đã chuyển giỏ hàng từ Session vào Database!"
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



        [HttpPut("capnhatsoluong")]
        public async Task<IActionResult> CapNhatSoLuong(
            int maSach,
            int quantity,
            int? maKhachHang)
        {
            try
            {
                var result = await _cartService.CapNhatSoLuong(
                    maSach,
                    quantity,
                    maKhachHang
                );

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




        [HttpDelete("delete/{maSach}")]
        public async Task<IActionResult> XoaCart(
            int maSach,
            [FromQuery] int? maKhachHang)
        {
            try
            {
                var result = await _cartService.XoaCart(maSach, maKhachHang);

                if (!result)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Không tìm thấy sản phẩm trong giỏ hàng!"
                    });
                }

                return Ok(new
                {
                    success = true,
                    message = "Đã xóa sản phẩm khỏi giỏ hàng!"
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