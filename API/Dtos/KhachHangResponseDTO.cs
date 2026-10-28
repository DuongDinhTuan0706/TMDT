namespace API.Dtos
{
    public class KhachHangResponseDTO
    {
        public int MaKhachHang { get; set; }

        public string TenDangNhap { get; set; } = "";

        public string TenKhachHang { get; set; } = "";

        public string Email { get; set; } = "";

        public string SoDienThoai { get; set; } = "";

        public string? DiaChi { get; set; }

        public string Role { get; set; } = "";

        public bool IsVerified { get; set; }
    }
}