using Microsoft.Extensions.Caching.Memory;

namespace API.RepositoryService.Service
{
    public interface IOTPService
    {
        string GenerateOTP(int maKhachHang);

        bool VerifyOTP(
            int maKhachHang,
            string otp);

        void RemoveOTP(int maKhachHang);
    }

    public class OTPService : IOTPService
    {
        private readonly IMemoryCache _cache;

        public OTPService(IMemoryCache cache)
        {
            _cache = cache;
        }

        public string GenerateOTP(int maKhachHang)
        {
            var otp = Random.Shared
                .Next(100000, 999999)
                .ToString();

            string key = $"OTP_{maKhachHang}";

            _cache.Set(
                key,
                otp,
                TimeSpan.FromMinutes(5));

            return otp;
        }

        public bool VerifyOTP(
            int maKhachHang,
            string otp)
        {
            string key = $"OTP_{maKhachHang}";

            if (!_cache.TryGetValue(
                key,
                out string? storedOtp))
            {
                return false;
            }

            if (storedOtp != otp)
            {
                return false;
            }

            // OTP chỉ sử dụng một lần
            _cache.Remove(key);

            return true;
        }

        public void RemoveOTP(int maKhachHang)
        {
            string key = $"OTP_{maKhachHang}";

            _cache.Remove(key);
        }
    }
}