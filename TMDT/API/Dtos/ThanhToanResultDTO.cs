namespace API.Dtos
{
    public class ThanhToanResultDTO
    {
        public int MaHoaDon { get; set; }

        public decimal TongTien { get; set; }

        public string PhuongThucThanhToan { get; set; } = null!;

        public string? QRCode { get; set; }
    }
}