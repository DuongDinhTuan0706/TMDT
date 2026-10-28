using System;
using System.Collections.Generic;

namespace API.Models;

public partial class ChiTietHoaDon
{
    public int MaHoaDon { get; set; }

    public int MaSach { get; set; }

    public int SoLuong { get; set; }

    public decimal DonGia { get; set; }

    public decimal? ThanhTien { get; set; }

    public bool Isdelete { get; set; }

    public virtual HoaDon MaHoaDonNavigation { get; set; } = null!;

    public virtual Sach MaSachNavigation { get; set; } = null!;
}
