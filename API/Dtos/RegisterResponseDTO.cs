namespace API.Dtos
{
    public class RegisterResponseDTO
    {
        public int MaKhachHang { get; set; }

        public string Email { get; set; } = "";

        public bool IsVerified { get; set; }
    }
}