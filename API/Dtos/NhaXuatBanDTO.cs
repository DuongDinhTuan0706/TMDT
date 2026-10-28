namespace API.Dtos
{
    public class NhaXuatBanDTO
    {
        public int MaNhaXuatBan { get; set; }

        public string TenNhaXuatBan { get; set; } = null!;

        public string? DiaChi { get; set; }

        public bool Isdelete { get; set; }

    }
}
