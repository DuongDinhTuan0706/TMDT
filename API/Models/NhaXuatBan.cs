using System;
using System.Collections.Generic;

namespace API.Models;

public partial class NhaXuatBan
{
    public int MaNhaXuatBan { get; set; }

    public string TenNhaXuatBan { get; set; } = null!;

    public string? DiaChi { get; set; }

    public bool Isdelete { get; set; }

    public virtual ICollection<Sach> Saches { get; set; } = new List<Sach>();
}
