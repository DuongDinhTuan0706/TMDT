using API.Data;
using API.Dtos;
using API.Extension;
using API.RepositoryService.Service;
using API.RepositoryService.Services;
using API.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
var myConnectionString = builder.Configuration.GetConnectionString("MyConnectString");
builder.Services.AddDbContext<QlbanSachContext>(option => option.UseSqlServer(myConnectionString));
builder.Services.AddHttpContextAccessor();
builder.Services.Configure<PaymentSettings>(
builder.Configuration.GetSection("PaymentSettings"));
builder.Services.AddAutoMapper(cfg =>  // new version  16.x
{
    cfg.AddMaps(typeof(AutoMapperProfile).Assembly);
});
builder.Services.AddDistributedMemoryCache();
builder.Services.AddMemoryCache();
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromMinutes(30);

    options.Cookie.Name = ".API.Session";
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
    options.Cookie.SameSite = SameSiteMode.None;
    options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
});
builder.Services.Configure<MailSettings>(
builder.Configuration.GetSection("MailSettings"));

builder.Services.AddScoped<SendMailService>();
builder.Services.AddScoped(typeof(API.Repository.IRepository<>), typeof(API.Repository.Repository<>));
builder.Services.AddScoped<ISachServices, SachServices>();
builder.Services.AddScoped<ICartService, CartServices>();
builder.Services.AddScoped<IGioHangServices, GioHangServices>();
builder.Services.AddScoped<IViewGioHangServices, ViewGioHangServices>();
builder.Services.AddScoped<IKhachHangServices, KhachHangServices>();
builder.Services.AddScoped<IDanhGiaSachServices, DanhGiaSachServices>();
builder.Services.AddScoped<IVietQRService, VietQRService>();
builder.Services.AddScoped<IThanhToanServices, ThanhToanServices>();
builder.Services.AddScoped<ISachYeuThichServices, SachYeuThichServices>();
builder.Services.AddScoped<IHoaDonServices, HoaDonServices>();
builder.Services.AddScoped<ITheLoaiServices, TheLoaiServices>();
builder.Services.AddScoped<ITacGiumServices, TacGiumServices>();
builder.Services.AddScoped<INhaXuatBanServices, NhaXuatBanServices>();
builder.Services.AddScoped<IOTPService, OTPService>();
builder.Services.AddScoped<ITheLoaiServices, TheLoaiServices>();
builder.Services.AddScoped<ITinNhanService, TinNhanService>();

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy => policy
        .SetIsOriginAllowed(origin =>
        {
            if (string.IsNullOrEmpty(origin)) return false;
            try
            {
                var host = new Uri(origin).Host;
                return host == "localhost" || host == "127.0.0.1";
            }
            catch
            {
                return false;
            }
        })
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials());
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseRouting();

app.UseCors("Frontend");

app.UseSession();

app.UseAuthorization();

app.MapControllers();

app.Run();