using System;
using System.Collections.Generic;

namespace API.Models;

public partial class KhachHangMaGiamGium
{
    public int MaKhachHang { get; set; }

    public string MaGiamGia { get; set; } = null!;

    public DateTime? NgaySuDung { get; set; }

    public bool DaSuDung { get; set; }

    public bool Isdelete { get; set; }

    public virtual MaGiamGium MaGiamGiaNavigation { get; set; } = null!;

    public virtual KhachHang MaKhachHangNavigation { get; set; } = null!;
}
