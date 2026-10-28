namespace API.Dtos
{
    public class CartItemDTO
    {
        public int MaSach { get; set; }
        public string? Hinh { get; set; }
        public string? TenSach { get; set; }
        public double Gia { get; set; }
        public int SoLuong { get; set; }
        public double ThanhTien => SoLuong * Gia;
    }
}
