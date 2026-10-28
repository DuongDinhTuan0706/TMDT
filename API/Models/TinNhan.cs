using System;
using System.Collections.Generic;

namespace API.Models;

public partial class TinNhan
{
    public int MaTinNhan { get; set; }

    public int NguoiGui { get; set; }

    public int NguoiNhan { get; set; }

    public string NoiDung { get; set; } = null!;

    public DateTime? ThoiGianGui { get; set; }

    public bool TrangThaiDaDoc { get; set; }

    public bool Isdelete { get; set; }

    public virtual KhachHang NguoiGuiNavigation { get; set; } = null!;

    public virtual KhachHang NguoiNhanNavigation { get; set; } = null!;
}
