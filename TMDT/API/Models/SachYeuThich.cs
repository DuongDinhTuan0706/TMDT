using System;
using System.Collections.Generic;

namespace API.Models;

public partial class SachYeuThich
{
    public int MaKhachHang { get; set; }

    public int MaSach { get; set; }

    public bool? Isdelete { get; set; }

    public bool TrangThai { get; set; }

    public virtual KhachHang MaKhachHangNavigation { get; set; } = null!;

    public virtual Sach MaSachNavigation { get; set; } = null!;
}
