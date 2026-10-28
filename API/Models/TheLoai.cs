using System;
using System.Collections.Generic;

namespace API.Models;

public partial class TheLoai
{
    public int MaTheLoai { get; set; }

    public string TenTheLoai { get; set; } = null!;

    public bool Isdelete { get; set; }

    public virtual ICollection<Sach> Saches { get; set; } = new List<Sach>();
}
