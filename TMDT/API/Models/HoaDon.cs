using System;
using System.Collections.Generic;

namespace API.Models;

public partial class HoaDon
{
    public int MaHoaDon { get; set; }

    public int MaKhachHang { get; set; }

    public DateTime? NgayLap { get; set; }

    public decimal TongTien { get; set; }

    public string SoDienThoai { get; set; } = null!;

    public string DiaChi { get; set; } = null!;

    public string? TenNguoiNhan { get; set; }

    public string? GhiChu { get; set; }

    public string? PhuongThucThanhToan { get; set; }

    public bool Isdelete { get; set; }

    public string? MaGiamGia { get; set; }

    public bool TrangThaiThanhToan { get; set; }

    public virtual ICollection<ChiTietHoaDon> ChiTietHoaDons { get; set; } = new List<ChiTietHoaDon>();

    public virtual MaGiamGium? MaGiamGiaNavigation { get; set; }

    public virtual KhachHang MaKhachHangNavigation { get; set; } = null!;
}
