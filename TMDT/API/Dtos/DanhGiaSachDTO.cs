namespace API.Dtos
{
    public class DanhGiaSachDTO
    {
        public int MaDanhGia { get; set; }

        public int MaSach { get; set; }

        public int? MaKhachHang { get; set; }

        public int SoSao { get; set; }

        public string? NoiDung { get; set; }

        public DateTime? NgayDanhGia { get; set; }

        public bool Isdelete { get; set; }
    }
}
