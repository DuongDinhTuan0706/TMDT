using API.Data;
using API.Dtos;
using API.Extension;
using API.Models;
using API.RepositoryService.Service;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class KhachHangController : ControllerBase
    {
        private readonly IKhachHangServices
            _khachHangServices;

        private readonly QlbanSachContext
            _context;


        public KhachHangController(
            IKhachHangServices khachHangServices,
            QlbanSachContext context)
        {
            _khachHangServices =
                khachHangServices;

            _context = context;
        }


        // =========================================================
        // ADMIN - DANH SÁCH KHÁCH HÀNG
        // =========================================================

        [HttpGet("DanhSachTaiKhoan")]
        [AdminOnly]
        public async Task<IActionResult>
            DanhSachTaiKhoan()
        {
            try
            {
                var result =
                    await _khachHangServices
                        .GetListAsync();


                return Ok(
                    ApiResponse<
                        IEnumerable<KhachHangResponseDTO>
                    >.Ok(
                        result,
                        "Lấy danh sách khách hàng thành công!"
                    )
                );
            }
            catch (Exception ex)
            {
                return BadRequest(
                    ApiResponse<object>.Fail(
                        ex.Message
                    )
                );
            }
        }


        // =========================================================
        // ADMIN - LẤY KHÁCH HÀNG THEO ID
        // =========================================================

        [HttpGet("{id}")]
        [AdminOnly]
        public async Task<IActionResult>
            GetById(int id)
        {
            try
            {
                var result =
                    await _khachHangServices
                        .GetByIdAsync(id);


                if (result == null)
                {
                    return NotFound(
                        ApiResponse<object>.Fail(
                            "Không tìm thấy khách hàng!"
                        )
                    );
                }


                return Ok(
                    ApiResponse<
                        KhachHangResponseDTO
                    >.Ok(
                        result,
                        "Lấy thông tin khách hàng thành công!"
                    )
                );
            }
            catch (Exception ex)
            {
                return BadRequest(
                    ApiResponse<object>.Fail(
                        ex.Message
                    )
                );
            }
        }


        // =========================================================
        // ĐĂNG KÝ
        // =========================================================

        [HttpPost("signin")]
        public async Task<IActionResult>
            SighIn(
                [FromBody] SighInDTO dto)
        {
            try
            {
                var result =
                    await _khachHangServices
                        .SighIn(dto);


                return Ok(
                    ApiResponse<
                        RegisterResponseDTO
                    >.Ok(
                        result,
                        "Đăng ký thành công! OTP đã được gửi vào email."
                    )
                );
            }
            catch (Exception ex)
            {
                return BadRequest(
                    ApiResponse<object>.Fail(
                        ex.Message
                    )
                );
            }
        }


        // =========================================================
        // ĐĂNG NHẬP
        // =========================================================

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LogInDTO dto)
        {
            try
            {
                var result = await _khachHangServices.Login(dto);

                // Lấy mã khách hàng từ kết quả xác thực trong service
                HttpContext.Session.SetInt32(
                    mySetting.MaKhachHang,
                    result.MaKhachHang
                );

                return Ok(
                    ApiResponse<LoginResponseDTO>.Ok(
                        result,
                        "Đăng nhập thành công!"
                    )
                );
            }
            catch (Exception ex)
            {
                return Unauthorized(
                    ApiResponse<object>.Fail(ex.Message)
                );
            }
        }


        // =========================================================
        // ĐĂNG XUẤT
        // =========================================================

        [HttpPost("logout")]
        public async Task<IActionResult>
            Logout()
        {
            try
            {
                await _khachHangServices
                    .Logout();


                return Ok(
                    ApiResponse<object>.Ok(
                        null,
                        "Đăng xuất thành công!"
                    )
                );
            }
            catch (Exception ex)
            {
                return BadRequest(
                    ApiResponse<object>.Fail(
                        ex.Message
                    )
                );
            }
        }


        // =========================================================
        // XÁC THỰC OTP
        // =========================================================

        [HttpPost("verify-otp/{maKhachHang}")]
        public async Task<IActionResult>
            VerifyOTP(
                int maKhachHang,
                [FromBody] VerifyOTPDTO dto)
        {
            try
            {
                var result =
                    await _khachHangServices
                        .VerifyOTPAsync(
                            maKhachHang,
                            dto.OTP);


                if (!result)
                {
                    return BadRequest(
                        ApiResponse<object>.Fail(
                            "OTP không đúng hoặc đã hết hạn!"
                        )
                    );
                }


                return Ok(
                    ApiResponse<object>.Ok(
                        null,
                        "Xác thực email thành công!"
                    )
                );
            }
            catch (Exception ex)
            {
                return BadRequest(
                    ApiResponse<object>.Fail(
                        ex.Message
                    )
                );
            }
        }


        // =========================================================
        // GỬI LẠI OTP
        // =========================================================

        [HttpPost("resend-otp/{maKhachHang}")]
        public async Task<IActionResult>
            ResendOTP(int maKhachHang)
        {
            try
            {
                var result =
                    await _khachHangServices
                        .ResendOTPAsync(
                            maKhachHang);


                if (!result)
                {
                    return BadRequest(
                        ApiResponse<object>.Fail(
                            "Không thể gửi lại OTP. Tài khoản không tồn tại hoặc đã được xác thực!"
                        )
                    );
                }


                return Ok(
                    ApiResponse<object>.Ok(
                        null,
                        "OTP mới đã được gửi vào email!"
                    )
                );
            }
            catch (Exception ex)
            {
                return BadRequest(
                    ApiResponse<object>.Fail(
                        ex.Message
                    )
                );
            }
        }


        // =========================================================
        // XEM THÔNG TIN CÁ NHÂN
        // =========================================================

        [HttpGet("my-info")]
        public async Task<IActionResult>
            GetMyInfo()
        {
            try
            {
                var maKH =
                    HttpContext.Session
                        .GetInt32(
                            mySetting.MaKhachHang);


                if (!maKH.HasValue)
                {
                    return Unauthorized(
                        ApiResponse<object>.Fail(
                            "Bạn chưa đăng nhập!"
                        )
                    );
                }


                var khachHang =
                    await _context.KhachHangs
                        .FirstOrDefaultAsync(
                            x =>
                                x.MaKhachHang ==
                                maKH.Value);


                if (khachHang == null)
                {
                    return Unauthorized(
                        ApiResponse<object>.Fail(
                            "Không tìm thấy khách hàng!"
                        )
                    );
                }


                if (!khachHang.IsVerified)
                {
                    return StatusCode(
                        StatusCodes.Status403Forbidden,

                        ApiResponse<object>.Fail(
                            "Bạn cần xác thực email trước khi xem thông tin cá nhân!"
                        )
                    );
                }


                var result =
                    await _khachHangServices
                        .GetMyInfo();


                return Ok(
                    ApiResponse<
                        KhachHangResponseDTO
                    >.Ok(
                        result,
                        "Lấy thông tin cá nhân thành công!"
                    )
                );
            }
            catch (Exception ex)
            {
                return BadRequest(
                    ApiResponse<object>.Fail(
                        ex.Message
                    )
                );
            }
        }


        // =========================================================
        // SỬA THÔNG TIN CÁ NHÂN
        // =========================================================

        [HttpPut("my-info")]
        public async Task<IActionResult> UpdateMyInfo(
    [FromBody] ThongTinKhachHangDTO dto)
        {
            try
            {
                var maKH =
                    HttpContext.Session
                        .GetInt32(
                            mySetting.MaKhachHang);


                if (!maKH.HasValue)
                {
                    return Unauthorized(
                        ApiResponse<object>.Fail(
                            "Bạn chưa đăng nhập!"
                        )
                    );
                }


                var khachHang =
                    await _context.KhachHangs
                        .FirstOrDefaultAsync(
                            x =>
                                x.MaKhachHang ==
                                maKH.Value);


                if (khachHang == null)
                {
                    return Unauthorized(
                        ApiResponse<object>.Fail(
                            "Không tìm thấy khách hàng!"
                        )
                    );
                }


                if (!khachHang.IsVerified)
                {
                    return StatusCode(
                        StatusCodes.Status403Forbidden,

                        ApiResponse<object>.Fail(
                            "Bạn cần xác thực email trước khi chỉnh sửa thông tin!"
                        )
                    );
                }


                var result =
                    await _khachHangServices
                        .UpdateMyInfo(dto);


                return Ok(
                    ApiResponse<
                        KhachHangResponseDTO
                    >.Ok(
                        result,
                        "Cập nhật thông tin thành công!"
                    )
                );
            }
            catch (Exception ex)
            {
                return BadRequest(
                    ApiResponse<object>.Fail(
                        ex.Message
                    )
                );
            }
        }
    }
}