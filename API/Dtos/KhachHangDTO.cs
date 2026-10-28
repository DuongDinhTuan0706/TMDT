namespace API.Dtos
{
    public class KhachHangDTO
    {
        public int MaKhachHang { get; set; }

        public string TenDangNhap { get; set; } = null!;

        public string TenKhachHang { get; set; } = null!;

        public string Email { get; set; } = null!;

        public string SoDienThoai { get; set; } = null!;

        public string? DiaChi { get; set; }

        public string MatKhau { get; set; } = null!;

        public string Role { get; set; } = null!;

        public bool Isdelete { get; set; }
    }
    public class TinNhanDTO
    {
        public int MaTinNhan { get; set; }
        public int NguoiGui { get; set; }
        public int NguoiNhan { get; set; }
        public string NoiDung { get; set; }
        public DateTime ThoiGianGui { get; set; }
        public bool TrangThaiDaDoc { get; set; }
    }

    public class CreateTinNhanDTO
    {
        public int NguoiGui { get; set; }
        public int NguoiNhan { get; set; }
        public string NoiDung { get; set; }
    }
}
