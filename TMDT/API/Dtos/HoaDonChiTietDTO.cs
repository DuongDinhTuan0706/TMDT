namespace API.Dtos
{
    public class HoaDonChiTietDTO
    {
        public int MaHoaDon { get; set; }
        public int MaKhachHang { get; set; }

        public DateTime? NgayLap { get; set; }

        public decimal TongTien { get; set; }

        public string? TenNguoiNhan { get; set; }
        public string SoDienThoai { get; set; } = null!;
        public string DiaChi { get; set; } = null!;
        public string? GhiChu { get; set; }

        public string? PhuongThucThanhToan { get; set; }

        public bool TrangThaiThanhToan { get; set; }

        public string? MaGiamGia { get; set; }

        public List<HoaDonItemDTO> ChiTiet { get; set; } = new();
    }

    public class HoaDonItemDTO
    {
        public int MaSach { get; set; }

        public string TenSach { get; set; } = null!;

        public string? AnhBia { get; set; }

        public int SoLuong { get; set; }

        public decimal DonGia { get; set; }

        public decimal ThanhTien { get; set; }
    }
}