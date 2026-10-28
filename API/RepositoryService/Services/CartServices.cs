using API.Data;
using API.Dtos;
using API.Extension;
using API.Models;
using API.RepositoryService.Service;
using Microsoft.EntityFrameworkCore;

namespace API.RepositoryService.Services
{
    public interface ICartService
    {
        Task<IEnumerable<ViewGioHang>> LayGioHang(int maKhachHang);

        Task ThemCardVaoGioHang(int maKhachHang,AddCartDTO item);
        List<CartItemDTO> LayGioHangSession();
        void ThemVaoGioHangSession(AddCartDTO item);
        Task ThemVaoGioHangTuSession(int maKhachHang,List<CartItemDTO> sessionCart);
        Task<object> CapNhatSoLuong(
            int maSach,
            int quantity,
            int? maKhachHang);
        Task<bool> XoaCart(int maSach, int? maKhachHang);
    }


    public class CartServices : ICartService
    {
        private readonly IGioHangServices _gioHangServices;
        private readonly QlbanSachContext _context;
        private readonly IViewGioHangServices _viewGioHangServices;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CartServices(IGioHangServices gioHangServices,QlbanSachContext context,IViewGioHangServices viewGioHangServices, IHttpContextAccessor httpContextAccessor)
        {
            _gioHangServices = gioHangServices;
            _context = context;
            _viewGioHangServices = viewGioHangServices;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<IEnumerable<ViewGioHang>> LayGioHang(int maKhachHang)
        {
            return await _viewGioHangServices.GetListAsync(
                v => v.MaKhachHang == maKhachHang
            );
        }

        public List<CartItemDTO> LayGioHangSession()
        {
            var session = _httpContextAccessor.HttpContext?.Session;

            if (session == null)
                return new List<CartItemDTO>();

            return session.Get<List<CartItemDTO>>(mySetting.CART_KEY) ?? new List<CartItemDTO>();
        }
        public void ThemVaoGioHangSession(AddCartDTO item)
        {
            var session = _httpContextAccessor.HttpContext?.Session;

            if (session == null)
                return;

            var cart = session.Get<List<CartItemDTO>>( mySetting.CART_KEY) ?? new List<CartItemDTO>();
            var sachItem = cart.FirstOrDefault(x => x.MaSach == item.MaSach);
            if (sachItem != null)
            {
                sachItem.SoLuong += 1;
            }
            else
            {
                var sach = _context.Saches
                    .Where(s => s.MaSach == item.MaSach)
                    .Select(s => new
                    {
                        s.MaSach,
                        s.TenSach,
                        s.AnhBia,
                        s.Gia
                    }).FirstOrDefault();
                if (sach == null)
                    return;
                double gia = (double)sach.Gia;
                cart.Add(new CartItemDTO
                {
                    MaSach = sach.MaSach,
                    TenSach = sach.TenSach,
                    Hinh = sach.AnhBia,
                    Gia = gia,
                    SoLuong = 1
                });
            }
            session.Set(
                mySetting.CART_KEY,
                cart
            );
        }
        public async Task ThemCardVaoGioHang( int maKhachHang, AddCartDTO item)
        {
            var itemInDb = (await _gioHangServices.GetListAsync( g => g.MaKhachHang == maKhachHang && g.MaSach == item.MaSach)).FirstOrDefault();
            if (itemInDb != null)
            {
                itemInDb.SoLuong += 1;
                await _gioHangServices.UpdateAsync(
                    itemInDb
                );
            }

            else
            {
                var newCartItem = new GioHang
                {
                    MaKhachHang = maKhachHang,
                    MaSach = item.MaSach,
                    SoLuong = 1,
                    Ngay = DateOnly.FromDateTime(DateTime.Now)
                };
                await _gioHangServices.CreateAsync(newCartItem);
            }
        }

        public async Task ThemVaoGioHangTuSession( int maKhachHang,List<CartItemDTO> sessionCart)
        {
            if (sessionCart == null ||!sessionCart.Any())
            {
                return;
            }
            foreach (var sachItem in sessionCart)
            {  
                var newCartItem = new GioHang
                {
                    MaKhachHang = maKhachHang,
                    MaSach = sachItem.MaSach,
                    SoLuong = sachItem.SoLuong,
                    Ngay = DateOnly.FromDateTime(DateTime.Now)
                };
                await _gioHangServices.CreateAsync(newCartItem); 
            }
            _httpContextAccessor.HttpContext?.Session.Remove(mySetting.CART_KEY);
        }

        public async Task<object> CapNhatSoLuong(
                                                int maSach,
                                                int quantity,
                                                int? maKhachHang)
        {
            var session = _httpContextAccessor.HttpContext?.Session;

            if (session == null)
                throw new Exception("Không tìm thấy Session!");

            var maKH = maKhachHang
                ?? session.GetInt32(mySetting.MaKhachHang);

            // Trường hợp khách hàng đã đăng nhập: cập nhật database
            if (maKH.HasValue)
            {
                var itemDB = await _context.GioHangs
                    .FirstOrDefaultAsync(x =>
                        x.MaKhachHang == maKH.Value &&
                        x.MaSach == maSach &&
                        !x.Isdelete);

                if (itemDB == null)
                {
                    throw new Exception(
                        $"Không tìm thấy sách có mã {maSach} trong giỏ hàng " +
                        $"của khách hàng {maKH.Value}."
                    );
                }

                itemDB.SoLuong += quantity;

                // Nếu giảm xuống 0 thì xóa mềm
                if (itemDB.SoLuong <= 0)
                {
                    itemDB.SoLuong = 0;
                    itemDB.Isdelete = true;
                }

                await _context.SaveChangesAsync();

                var cartQuantity = await _context.GioHangs
                    .Where(x =>
                        x.MaKhachHang == maKH.Value &&
                        !x.Isdelete)
                    .SumAsync(x => (int?)x.SoLuong) ?? 0;

                return new
                {
                    success = true,
                    maSach,
                    soLuong = itemDB.Isdelete ? 0 : itemDB.SoLuong,
                    cartQuantity
                };
            }

            // Trường hợp khách chưa đăng nhập: cập nhật giỏ hàng Session
            var cart = session.Get<List<CartItemDTO>>(mySetting.CART_KEY)
                       ?? new List<CartItemDTO>();

            var item = cart.FirstOrDefault(x => x.MaSach == maSach);

            if (item == null)
            {
                throw new Exception(
                    $"Không tìm thấy sách có mã {maSach} trong giỏ hàng Session. " +
                    "Hãy tải lại giỏ hàng hoặc thêm sách vào giỏ trước."
                );
            }

            item.SoLuong += quantity;

            if (item.SoLuong <= 0)
            {
                cart.Remove(item);
            }

            session.Set(mySetting.CART_KEY, cart);

            return new
            {
                success = true,
                maSach,
                soLuong = cart.FirstOrDefault(x => x.MaSach == maSach)?.SoLuong ?? 0,
                cartQuantity = cart.Sum(x => x.SoLuong)
            };
        }



        public async Task<bool> XoaCart(int maSach, int? maKhachHang)
        {
            var session = _httpContextAccessor.HttpContext?.Session;

            if (session == null)
                return false;

            // Ưu tiên mã khách hàng được truyền vào.
            // Nếu không có thì lấy từ Session.
            var maKH = maKhachHang
                ?? session.GetInt32(mySetting.MaKhachHang);

            // Khách hàng đã đăng nhập: xóa mềm trong database.
            if (maKH.HasValue)
            {
                var itemDB = await _context.GioHangs
                    .FirstOrDefaultAsync(x =>
                        x.MaKhachHang == maKH.Value &&
                        x.MaSach == maSach &&
                        x.Isdelete == false);

                if (itemDB == null)
                    return false;

                itemDB.Isdelete = true;
                itemDB.SoLuong = 0;

                await _context.SaveChangesAsync();
                return true;
            }

            // Khách chưa đăng nhập: xóa trong giỏ hàng Session.
            var cart = session.Get<List<CartItemDTO>>(mySetting.CART_KEY)
                       ?? new List<CartItemDTO>();

            var item = cart.FirstOrDefault(x => x.MaSach == maSach);

            if (item == null)
                return false;

            cart.Remove(item);
            session.Set(mySetting.CART_KEY, cart);

            return true;
        }


    }
}