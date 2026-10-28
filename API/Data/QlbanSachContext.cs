using System;
using System.Collections.Generic;
using API.Models;
using Microsoft.EntityFrameworkCore;

namespace API.Data;

public partial class QlbanSachContext : DbContext
{
    public QlbanSachContext()
    {
    }

    public QlbanSachContext(DbContextOptions<QlbanSachContext> options)
        : base(options)
    {
    }

    public virtual DbSet<ChiTietHoaDon> ChiTietHoaDons { get; set; }

    public virtual DbSet<DanhGiaSach> DanhGiaSaches { get; set; }

    public virtual DbSet<GioHang> GioHangs { get; set; }

    public virtual DbSet<HoaDon> HoaDons { get; set; }

    public virtual DbSet<KhachHang> KhachHangs { get; set; }

    public virtual DbSet<KhachHangMaGiamGium> KhachHangMaGiamGia { get; set; }

    public virtual DbSet<MaGiamGium> MaGiamGia { get; set; }

    public virtual DbSet<NhaXuatBan> NhaXuatBans { get; set; }

    public virtual DbSet<Sach> Saches { get; set; }

    public virtual DbSet<SachYeuThich> SachYeuThiches { get; set; }

    public virtual DbSet<TacGium> TacGia { get; set; }

    public virtual DbSet<TheLoai> TheLoais { get; set; }

    public virtual DbSet<TinNhan> TinNhans { get; set; }

    public virtual DbSet<ViewGioHang> ViewGioHangs { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
        => optionsBuilder.UseSqlServer("Data Source=localhost; Initial Catalog=QLBanSach; Persist Security Info=True; User ID=sa; Password=123456; Trust Server Certificate=True;");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ChiTietHoaDon>(entity =>
        {
            entity.HasKey(e => new { e.MaHoaDon, e.MaSach });

            entity.ToTable("ChiTietHoaDon");

            entity.Property(e => e.DonGia).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Isdelete).HasColumnName("isdelete");
            entity.Property(e => e.ThanhTien)
                .HasComputedColumnSql("([DonGia]*[SoLuong])", false)
                .HasColumnType("decimal(29, 2)");

            entity.HasOne(d => d.MaHoaDonNavigation).WithMany(p => p.ChiTietHoaDons)
                .HasForeignKey(d => d.MaHoaDon)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ChiTietHoaDon_HoaDon");

            entity.HasOne(d => d.MaSachNavigation).WithMany(p => p.ChiTietHoaDons)
                .HasForeignKey(d => d.MaSach)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ChiTietHoaDon_Books");
        });

        modelBuilder.Entity<DanhGiaSach>(entity =>
        {
            entity.HasKey(e => e.MaDanhGia).HasName("PK__DanhGiaS__AA9515BF9EFEA083");

            entity.ToTable("DanhGiaSach");

            entity.Property(e => e.Isdelete).HasColumnName("isdelete");
            entity.Property(e => e.NgayDanhGia)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.NoiDung).HasMaxLength(500);

            entity.HasOne(d => d.MaKhachHangNavigation).WithMany(p => p.DanhGiaSaches)
                .HasForeignKey(d => d.MaKhachHang)
                .HasConstraintName("FK_DanhGiaSach_KhachHang");

            entity.HasOne(d => d.MaSachNavigation).WithMany(p => p.DanhGiaSaches)
                .HasForeignKey(d => d.MaSach)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_DanhGiaSach_Sach");
        });

        modelBuilder.Entity<GioHang>(entity =>
        {
            entity.HasKey(e => e.GioHangId).HasName("PK__GioHang__4242280D0103EB46");

            entity.ToTable("GioHang");

            entity.Property(e => e.GioHangId).HasColumnName("GioHangID");
            entity.Property(e => e.Isdelete).HasColumnName("isdelete");
            entity.Property(e => e.Ngay).HasDefaultValueSql("(getdate())");
        });

        modelBuilder.Entity<HoaDon>(entity =>
        {
            entity.HasKey(e => e.MaHoaDon).HasName("PK__HoaDon__835ED13B55B2A7FB");

            entity.ToTable("HoaDon");

            entity.Property(e => e.DiaChi)
                .HasMaxLength(255)
                .HasDefaultValue("", "DF_HoaDon_DiaChi");
            entity.Property(e => e.GhiChu).HasMaxLength(500);
            entity.Property(e => e.Isdelete).HasColumnName("isdelete");
            entity.Property(e => e.MaGiamGia)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.NgayLap)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.PhuongThucThanhToan).HasMaxLength(50);
            entity.Property(e => e.SoDienThoai)
                .HasMaxLength(10)
                .HasDefaultValue("", "DF_HoaDon_SDT");
            entity.Property(e => e.TenNguoiNhan).HasMaxLength(100);
            entity.Property(e => e.TongTien).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.MaGiamGiaNavigation).WithMany(p => p.HoaDons)
                .HasForeignKey(d => d.MaGiamGia)
                .HasConstraintName("FK_HoaDon_MaGiamGia");

            entity.HasOne(d => d.MaKhachHangNavigation).WithMany(p => p.HoaDons)
                .HasForeignKey(d => d.MaKhachHang)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_HoaDon_KhachHang");
        });

        modelBuilder.Entity<KhachHang>(entity =>
        {
            entity.HasKey(e => e.MaKhachHang).HasName("PK__KhachHan__88D2F0E5C1009893");

            entity.ToTable("KhachHang");

            entity.Property(e => e.DiaChi).HasMaxLength(255);
            entity.Property(e => e.Email).HasMaxLength(50);
            entity.Property(e => e.IsVerified).HasDefaultValue(true);
            entity.Property(e => e.Isdelete).HasColumnName("isdelete");
            entity.Property(e => e.MatKhau).HasMaxLength(70);
            entity.Property(e => e.Role)
                .HasMaxLength(20)
                .HasDefaultValue("User", "DF_KhachHang_Role");
            entity.Property(e => e.SoDienThoai).HasMaxLength(10);
            entity.Property(e => e.TenDangNhap).HasMaxLength(50);
            entity.Property(e => e.TenKhachHang).HasMaxLength(50);
        });

        modelBuilder.Entity<KhachHangMaGiamGium>(entity =>
        {
            entity.HasKey(e => new { e.MaKhachHang, e.MaGiamGia }).HasName("PK__KhachHan__D62BB56B3EDA29BE");

            entity.ToTable("KhachHang_MaGiamGia");

            entity.Property(e => e.MaGiamGia)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.DaSuDung).HasDefaultValue(true);
            entity.Property(e => e.Isdelete).HasColumnName("isdelete");
            entity.Property(e => e.NgaySuDung)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");

            entity.HasOne(d => d.MaGiamGiaNavigation).WithMany(p => p.KhachHangMaGiamGia)
                .HasForeignKey(d => d.MaGiamGia)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_KHMGG_MaGiamGia");

            entity.HasOne(d => d.MaKhachHangNavigation).WithMany(p => p.KhachHangMaGiamGia)
                .HasForeignKey(d => d.MaKhachHang)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_KHMGG_KhachHang");
        });

        modelBuilder.Entity<MaGiamGium>(entity =>
        {
            entity.HasKey(e => e.MaGiamGia).HasName("PK__MaGiamGi__EF9458E47BA80C14");

            entity.Property(e => e.MaGiamGia)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.Isdelete).HasColumnName("isdelete");
            entity.Property(e => e.NgayBatDau).HasColumnType("datetime");
            entity.Property(e => e.NgayKetThuc).HasColumnType("datetime");
            entity.Property(e => e.PhanTramGiam).HasColumnType("decimal(5, 2)");
        });

        modelBuilder.Entity<NhaXuatBan>(entity =>
        {
            entity.HasKey(e => e.MaNhaXuatBan).HasName("PK__NhaXuatB__1AED0BFA3F8DBA16");

            entity.ToTable("NhaXuatBan");

            entity.Property(e => e.DiaChi).HasMaxLength(255);
            entity.Property(e => e.Isdelete).HasColumnName("isdelete");
            entity.Property(e => e.TenNhaXuatBan).HasMaxLength(50);
        });

        modelBuilder.Entity<Sach>(entity =>
        {
            entity.HasKey(e => e.MaSach).HasName("PK__Sach__B235742D4CCFE704");

            entity.ToTable("Sach");

            entity.Property(e => e.AnhBia)
                .HasMaxLength(255)
                .IsUnicode(false);
            entity.Property(e => e.Gia).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Isdelete).HasColumnName("isdelete");
            entity.Property(e => e.TenSach).HasMaxLength(255);

            entity.HasOne(d => d.MaNhaXuatBanNavigation).WithMany(p => p.Saches)
                .HasForeignKey(d => d.MaNhaXuatBan)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Sach_NhaXuatBan");

            entity.HasOne(d => d.MaTacGiaNavigation).WithMany(p => p.Saches)
                .HasForeignKey(d => d.MaTacGia)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Sach_TacGia");

            entity.HasOne(d => d.MaTheLoaiNavigation).WithMany(p => p.Saches)
                .HasForeignKey(d => d.MaTheLoai)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Sach_TheLoai");
        });

        modelBuilder.Entity<SachYeuThich>(entity =>
        {
            entity.HasKey(e => new { e.MaKhachHang, e.MaSach });

            entity.ToTable("SachYeuThich");

            entity.Property(e => e.Isdelete).HasDefaultValue(false);

            entity.HasOne(d => d.MaKhachHangNavigation).WithMany(p => p.SachYeuThiches)
                .HasForeignKey(d => d.MaKhachHang)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_SachYeuThich_KhachHang");

            entity.HasOne(d => d.MaSachNavigation).WithMany(p => p.SachYeuThiches)
                .HasForeignKey(d => d.MaSach)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_SachYeuThich_Sach");
        });

        modelBuilder.Entity<TacGium>(entity =>
        {
            entity.HasKey(e => e.MaTacGia).HasName("PK__TacGia__F24E6756D24EB700");

            entity.Property(e => e.Isdelete).HasColumnName("isdelete");
            entity.Property(e => e.TenTacGia).HasMaxLength(50);
        });

        modelBuilder.Entity<TheLoai>(entity =>
        {
            entity.HasKey(e => e.MaTheLoai).HasName("PK__TheLoai__D73FF34AF12698A7");

            entity.ToTable("TheLoai");

            entity.Property(e => e.Isdelete).HasColumnName("isdelete");
            entity.Property(e => e.TenTheLoai).HasMaxLength(50);
        });

        modelBuilder.Entity<TinNhan>(entity =>
        {
            entity.HasKey(e => e.MaTinNhan).HasName("PK__TinNhan__E5B3062AC814B386");

            entity.ToTable("TinNhan");

            entity.Property(e => e.Isdelete).HasColumnName("isdelete");
            entity.Property(e => e.ThoiGianGui)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");

            entity.HasOne(d => d.NguoiGuiNavigation).WithMany(p => p.TinNhanNguoiGuiNavigations)
                .HasForeignKey(d => d.NguoiGui)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_TinNhan_NguoiGui");

            entity.HasOne(d => d.NguoiNhanNavigation).WithMany(p => p.TinNhanNguoiNhanNavigations)
                .HasForeignKey(d => d.NguoiNhan)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_TinNhan_NguoiNhan");
        });

        modelBuilder.Entity<ViewGioHang>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("View_GioHang");

            entity.Property(e => e.AnhBia)
                .HasMaxLength(255)
                .IsUnicode(false);
            entity.Property(e => e.Gia).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.TenSach).HasMaxLength(255);
            entity.Property(e => e.ThanhTien).HasColumnType("decimal(29, 2)");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
