namespace API.Dtos
{
    public class ChiTietHoaDonDTO
    {
        public int MaHoaDon { get; set; }

        public int MaSach { get; set; }

        public int SoLuong { get; set; }

        public decimal DonGia { get; set; }

        public decimal? ThanhTien { get; set; }

        public bool Isdelete { get; set; }
    }
}
