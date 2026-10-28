using System;
using System.Collections.Generic;

namespace API.Models;

public partial class DanhGiaSach
{
    public int MaDanhGia { get; set; }

    public int MaSach { get; set; }

    public int? MaKhachHang { get; set; }

    public int SoSao { get; set; }

    public string? NoiDung { get; set; }

    public DateTime? NgayDanhGia { get; set; }

    public bool Isdelete { get; set; }

    public virtual KhachHang? MaKhachHangNavigation { get; set; }

    public virtual Sach MaSachNavigation { get; set; } = null!;
}
