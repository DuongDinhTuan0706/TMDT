using System;
using System.Collections.Generic;

namespace API.Models;

public partial class MaGiamGium
{
    public string MaGiamGia { get; set; } = null!;

    public decimal PhanTramGiam { get; set; }

    public DateTime? NgayBatDau { get; set; }

    public DateTime? NgayKetThuc { get; set; }

    public bool Isdelete { get; set; }

    public virtual ICollection<HoaDon> HoaDons { get; set; } = new List<HoaDon>();

    public virtual ICollection<KhachHangMaGiamGium> KhachHangMaGiamGia { get; set; } = new List<KhachHangMaGiamGium>();
}
