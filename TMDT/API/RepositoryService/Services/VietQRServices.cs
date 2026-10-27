using API.Extension;
using API.RepositoryService.Service;
using Microsoft.Extensions.Options;

namespace API.RepositoryService.Services
{
    public interface IVietQRService
    {
        string CreateQRCode(decimal amount, int maHoaDon);
    }
    public class VietQRService : IVietQRService
    {
        private readonly PaymentSettings _paymentSettings;

        public VietQRService(
            IOptions<PaymentSettings> paymentSettings)
        {
            _paymentSettings = paymentSettings.Value;
        }

        public string CreateQRCode(decimal amount, int maHoaDon)
        {
            if (amount <= 0)
                throw new ArgumentException("Số tiền phải lớn hơn 0.");

            if (maHoaDon <= 0)
                throw new ArgumentException("Mã hóa đơn không hợp lệ.");

            string noiDung = $"THANHTOAN_HD_{maHoaDon}";
            string soTien = decimal.ToInt64(
                decimal.Round(amount, 0, MidpointRounding.AwayFromZero)
            ).ToString();

            string url =
                $"https://img.vietqr.io/image/" +
                $"{_paymentSettings.BankCode}-" +
                $"{_paymentSettings.AccountNumber}-compact2.png" +
                $"?amount={soTien}" +
                $"&addInfo={Uri.EscapeDataString(noiDung)}" +
                $"&accountName={Uri.EscapeDataString(_paymentSettings.AccountName)}";

            return url;
        }
    }
}