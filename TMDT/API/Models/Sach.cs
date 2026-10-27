using System;
using System.Collections.Generic;

namespace API.Models;

public partial class Sach
{
    public int MaSach { get; set; }

    public string TenSach { get; set; } = null!;

    public int MaTacGia { get; set; }

    public string AnhBia { get; set; } = null!;

    public decimal Gia { get; set; }

    public int MaTheLoai { get; set; }

    public int MaNhaXuatBan { get; set; }

    public bool Isdelete { get; set; }

    public virtual ICollection<ChiTietHoaDon> ChiTietHoaDons { get; set; } = new List<ChiTietHoaDon>();

    public virtual ICollection<DanhGiaSach> DanhGiaSaches { get; set; } = new List<DanhGiaSach>();

    public virtual NhaXuatBan MaNhaXuatBanNavigation { get; set; } = null!;

    public virtual TacGium MaTacGiaNavigation { get; set; } = null!;

    public virtual TheLoai MaTheLoaiNavigation { get; set; } = null!;

    public virtual ICollection<SachYeuThich> SachYeuThiches { get; set; } = new List<SachYeuThich>();
}
