namespace API.Dtos
{
    public class HoaDonDTO
    {
        public int MaHoaDon { get; set; }

        public int MaKhachHang { get; set; }

        public DateTime? NgayLap { get; set; }

        public decimal TongTien { get; set; }

        public string SoDienThoai { get; set; } = null!;

        public string DiaChi { get; set; } = null!;

        public string? TenNguoiNhan { get; set; }

        public string? GhiChu { get; set; }

        public string? PhuongThucThanhToan { get; set; }

        public bool Isdelete { get; set; }

        public string? MaGiamGia { get; set; }

    }
}
