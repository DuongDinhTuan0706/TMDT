using API.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Linq;

namespace API.Extension
{
    public class AdminOnlyAttribute : Attribute, IAuthorizationFilter
    {
        public void OnAuthorization(AuthorizationFilterContext context)
        {
            var session = context.HttpContext.Session;
            var role = session.GetString(mySetting.Role);

            if (string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase))
            {
                return;
            }

            // Fallback khi Session bộ nhớ bị mất (do server restart hoặc cookie cross-site bị trình duyệt chặn)
            var req = context.HttpContext.Request;
            var userIdStr = req.Headers["X-User-Id"].ToString();
            if (!string.IsNullOrEmpty(userIdStr) && int.TryParse(userIdStr, out int userId) && userId > 0)
            {
                var db = context.HttpContext.RequestServices.GetService<QlbanSachContext>();
                if (db != null)
                {
                    var user = db.KhachHangs.FirstOrDefault(u => u.MaKhachHang == userId && !u.Isdelete);
                    if (user != null && string.Equals(user.Role, "Admin", StringComparison.OrdinalIgnoreCase))
                    {
                        session.SetString(mySetting.Role, user.Role);
                        session.SetInt32(mySetting.MaKhachHang, user.MaKhachHang);
                        return;
                    }
                }
            }

            if (string.IsNullOrEmpty(role))
            {
                context.Result = new UnauthorizedObjectResult(new
                {
                    success = false,
                    message = "Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn. Vui lòng đăng nhập lại!"
                });

                return;
            }

            context.Result = new ObjectResult(new
            {
                success = false,
                message = "Bạn không có quyền Admin!"
            })
            {
                StatusCode = StatusCodes.Status403Forbidden
            };
        }
    }
}