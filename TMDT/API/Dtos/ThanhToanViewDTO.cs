namespace API.Dtos
{
    public class ThanhToanViewDTO
    {
        public List<ThanhToanItemDTO> Items { get; set; }
            = new List<ThanhToanItemDTO>();

        public decimal TongTien { get; set; }
    }
}