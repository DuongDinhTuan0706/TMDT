using System;
using System.Collections.Generic;

namespace API.Models;

public partial class KhachHang
{
    public int MaKhachHang { get; set; }

    public string TenDangNhap { get; set; } = null!;

    public string TenKhachHang { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string SoDienThoai { get; set; } = null!;

    public string? DiaChi { get; set; }

    public string MatKhau { get; set; } = null!;

    public string Role { get; set; } = null!;

    public bool Isdelete { get; set; }

    public bool IsVerified { get; set; }

    public virtual ICollection<DanhGiaSach> DanhGiaSaches { get; set; } = new List<DanhGiaSach>();

    public virtual ICollection<HoaDon> HoaDons { get; set; } = new List<HoaDon>();

    public virtual ICollection<KhachHangMaGiamGium> KhachHangMaGiamGia { get; set; } = new List<KhachHangMaGiamGium>();

    public virtual ICollection<SachYeuThich> SachYeuThiches { get; set; } = new List<SachYeuThich>();

    public virtual ICollection<TinNhan> TinNhanNguoiGuiNavigations { get; set; } = new List<TinNhan>();

    public virtual ICollection<TinNhan> TinNhanNguoiNhanNavigations { get; set; } = new List<TinNhan>();
}
