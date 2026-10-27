using System.ComponentModel.DataAnnotations;

namespace API.Dtos
{
    public class LogInDTO
    {
        [Display(Name = "Tên đăng nhập")]
        [Required(ErrorMessage = "*")]
        [StringLength(20, MinimumLength = 3, ErrorMessage = "Trong khoảng 3 đến 20 kí tự!")]
        public string UserName { get; set; }


        [Display(Name = "Mật khẩu")]
        [Required(ErrorMessage = "*")]
        [DataType(DataType.Password)]
        public string Password { get; set; }
    }
}