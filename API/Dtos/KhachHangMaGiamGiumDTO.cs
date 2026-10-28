namespace API.Dtos
{
    public class KhachHangMaGiamGiumDTO
    {
        public int MaKhachHang { get; set; }

        public string MaGiamGia { get; set; } = null!;

        public DateTime? NgaySuDung { get; set; }

        public bool DaSuDung { get; set; }

        public bool Isdelete { get; set; }
    }
}
