using System.ComponentModel.DataAnnotations;

namespace API.Dtos
{
    public class CapNhatThongTinDTO
    {
        [Required(ErrorMessage = "Tên khách hàng không được để trống")]
        public string TenKhachHang { get; set; }

        [Required(ErrorMessage = "Email không được để trống")]
        [EmailAddress(ErrorMessage = "Email không hợp lệ")]
        public string Email { get; set; }

        [Required(ErrorMessage = "Số điện thoại không được để trống")]
        public string SoDienThoai { get; set; }

        public string? DiaChi { get; set; }
    }
}