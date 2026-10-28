using API.RepositoryService.Service;
using API.RepositoryService.Services;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [Route("api/vietqr")]
    [ApiController]
    public class VietQRController : ControllerBase
    {
        private readonly IVietQRService _vietQRService;

        public VietQRController(IVietQRService vietQRService)
        {
            _vietQRService = vietQRService;
        }

        [HttpGet("test")]
        public IActionResult TestQR(decimal amount, int maHoaDon)
        {
            string qrUrl = _vietQRService.CreateQRCode(amount, maHoaDon);

            return Ok(new
            {
                MaHoaDon = maHoaDon,
                SoTien = amount,
                QRCode = qrUrl
            });
        }
    }
}