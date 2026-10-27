namespace API.Dtos
{
    public class MaGiamGiumDTO
    {
        public string MaGiamGia { get; set; } = null!;

        public decimal PhanTramGiam { get; set; }

        public DateTime? NgayBatDau { get; set; }

        public DateTime? NgayKetThuc { get; set; }

        public bool Isdelete { get; set; }

    }
}
