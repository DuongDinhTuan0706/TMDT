using System;
using System.Collections.Generic;

namespace API.Models;

public partial class ViewGioHang
{
    public int MaKhachHang { get; set; }

    public int SoLuong { get; set; }

    public DateOnly? Ngay { get; set; }

    public string TenSach { get; set; } = null!;

    public decimal Gia { get; set; }

    public string AnhBia { get; set; } = null!;

    public int MaSach { get; set; }

    public decimal? ThanhTien { get; set; }
}
