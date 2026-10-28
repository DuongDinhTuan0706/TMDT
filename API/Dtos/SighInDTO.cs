using System.ComponentModel.DataAnnotations;

namespace API.Dtos
{
    public class SighInDTO
    {

        [StringLength(20, MinimumLength = 3, ErrorMessage = "Tên đăng nhập ít nhất 3 kí tự và tối đa 20 kí tự!")]
        public string TenDangNhap { get; set; }

        [Required(ErrorMessage = "Không được để trống tên nguòi dùng")]
        [StringLength(20, MinimumLength = 3)]
        [RegularExpression(@"^[a-zA-ZÀ-ỹ\s]+$", ErrorMessage = "Chỉ được nhập chữ cái và khoảng trắng")]
        public string TenKhachHang { get; set; }
        [Required(ErrorMessage = "Vui lòng nhập Email")]
        [Display(Name = "Email address")]
        [RegularExpression(@"^[a-zA-z0-9._-]+@[a-zA-z0-9]+\.[a-zA-Z0-9._-]+$", ErrorMessage = "Email không hợp lệ!")]
        public string Email { get; set; }
        [Required(ErrorMessage = "Vui lòng nhập số điện thoại")]
        [Display(Name = "Your Phone Number")]
        [RegularExpression(@"0[3578]\d{8}", ErrorMessage = "Số điện thoại không phù hợp với Quốc Gia Việt Nam!")]
        public string SoDienThoai { get; set; }

        [Required(ErrorMessage = "Mật khẩu là bắt buộc")]
        [MinLength(6, ErrorMessage = "Mật khẩu ít nhất 6 kí tự!")]
        [DataType(DataType.Password)]
        public string MatKhau { get; set; }

        [Required(ErrorMessage = "Vui lòng nhập lại mật khẩu")]
        [DataType(DataType.Password)]
        [Compare("MatKhau", ErrorMessage = "Mật khẩu không trùng khớp")]
        public string KiemTraMatKhau { get; set; }
    }
}
