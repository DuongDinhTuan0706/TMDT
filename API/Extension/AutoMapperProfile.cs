using API.Dtos;
using API.Models;
using AutoMapper;
using Microsoft.Identity.Client.NativeInterop;

namespace API.Extension
{
    public class AutoMapperProfile : Profile
    {
        public AutoMapperProfile()
        {
            CreateMap<KhachHang, KhachHangDTO>().ReverseMap();
            CreateMap<TheLoai, TheLoaiDTO>().ReverseMap();
            CreateMap<Sach, SachDTO>()
                .ForMember(d => d.TenNhaXuatBan,
                    opt => opt.MapFrom(s => s.MaNhaXuatBanNavigation.TenNhaXuatBan))
                .ForMember(d => d.TenTacGia,
                    opt => opt.MapFrom(s => s.MaTacGiaNavigation.TenTacGia))
                .ForMember(d => d.TenTheLoai,
                    opt => opt.MapFrom(s => s.MaTheLoaiNavigation.TenTheLoai));
            CreateMap<MaGiamGium, MaGiamGiumDTO>().ReverseMap();
            CreateMap<KhachHangMaGiamGium, KhachHangMaGiamGiumDTO>().ReverseMap();
            CreateMap<HoaDon, HoaDonDTO>().ReverseMap();
            CreateMap<ChiTietHoaDon, ChiTietHoaDonDTO>().ReverseMap();
            CreateMap<DanhGiaSach, DanhGiaSachDTO>().ReverseMap();
            CreateMap<GioHang, GioHangDTO>().ReverseMap();
            CreateMap<TinNhan, TinNhanDTO>().ReverseMap();
            CreateMap<CreateTinNhanDTO, TinNhan>();
            CreateMap<TacGium, TacGiumDTO>().ReverseMap();
            CreateMap<NhaXuatBan, NhaXuatBanDTO>().ReverseMap();
            CreateMap<SachYeuThich, SachYeuThichDTO>()
                .ForMember(
                    dest => dest.TenSach,
                    opt => opt.MapFrom(src => src.MaSachNavigation!.TenSach)
                )
                .ForMember(
                    dest => dest.Gia,
                    opt => opt.MapFrom(src => src.MaSachNavigation!.Gia)
                )
                .ForMember(
                    dest => dest.AnhBia,
                    opt => opt.MapFrom(src => src.MaSachNavigation!.AnhBia)
                );
        }
    }
}
