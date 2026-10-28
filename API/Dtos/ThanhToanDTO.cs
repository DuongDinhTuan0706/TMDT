using System.ComponentModel.DataAnnotations;

namespace API.Dtos
{
    public class ThanhToanDTO
    {
        [Required(ErrorMessage = "Tên người nhận không được để trống")]
        public string TenNguoiNhan { get; set; } = null!;

        [Required(ErrorMessage = "Số điện thoại không được để trống")]
        public string SoDienThoai { get; set; } = null!;

        [Required(ErrorMessage = "Địa chỉ không được để trống")]
        public string DiaChi { get; set; } = null!;

        public string? GhiChu { get; set; }

        [Required(ErrorMessage = "Phương thức thanh toán không được để trống")]
        public string PhuongThucThanhToan { get; set; } = null!;

        public string? MaGiamGia { get; set; }
    }
}