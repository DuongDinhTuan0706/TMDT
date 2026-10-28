namespace API.Dtos
{
    public class GioHangDTO
    {
        public int GioHangId { get; set; }

        public int MaKhachHang { get; set; }

        public int MaSach { get; set; }

        public int SoLuong { get; set; }

        public DateOnly? Ngay { get; set; }

        public bool Isdelete { get; set; }
    }
}
