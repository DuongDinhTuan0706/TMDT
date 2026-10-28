namespace API.Dtos
{
    public class LoginResponseDTO
    {
        public int MaKhachHang { get; set; }

        public string TenKhachHang { get; set; } = "";

        public string Email { get; set; } = "";

        public string Role { get; set; } = "";

        public bool IsVerified { get; set; }
    }
}