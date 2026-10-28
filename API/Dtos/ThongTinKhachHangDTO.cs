
using System.ComponentModel.DataAnnotations;

namespace API.Dtos
{
    public class ThongTinKhachHangDTO
    {
        [Required(ErrorMessage = "Họ tên không được để trống")]
        public string? TenKhachHang { get; set; }

        [Required(ErrorMessage = "Số điện thoại không được để trống")]
        public string? SoDienThoai { get; set; }

        [Required(ErrorMessage = "Email không được để trống")]
        [EmailAddress(ErrorMessage = "Email không hợp lệ")]
        public string Email { get; set; } = string.Empty;

        public string? DiaChi { get; set; }
    }
}
