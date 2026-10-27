    using API.Dtos;
    using API.Extension;
    using API.Models;
    using API.RepositoryService.Service;
    using Microsoft.AspNetCore.Mvc;

    namespace API.Controllers
    {
        [Route("api/sach")]
        [ApiController]
        public class SachController : ControllerBase
        {
            private readonly ISachServices _sachServices;

            public SachController(ISachServices sachServices)
            {
                _sachServices = sachServices;
            }

            [HttpGet]
            public async Task<IActionResult> GetList()
            {
                try
                {
                    var result = await _sachServices.GetListAsync();

                    return Ok(result);
                }
                catch (Exception ex)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = ex.Message
                    });
                }
            }

            [HttpGet("{id}")]
            public async Task<IActionResult> GetById(int id)
            {
                try
                {
                    var result = await _sachServices.GetByIdAsync(id);

                    if (result == null)
                    {
                        return NotFound(new
                        {
                            success = false,
                            message = "Không tìm thấy sách!"
                        });
                    }

                    return Ok(result);
                }
                catch (Exception ex)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = ex.Message
                    });
                }
            }


            [HttpGet("search")]
            public async Task<IActionResult> Search([FromBody] SearchDTO searchDto)
            {
                try
                {
                    if (searchDto.GiaMin.HasValue &&
                        searchDto.GiaMax.HasValue &&
                        searchDto.GiaMin.Value > searchDto.GiaMax.Value)
                    {
                        return BadRequest(new
                        {
                            success = false,
                            message = "Giá tối thiểu không được lớn hơn giá tối đa!"
                        });
                    }

                    var result = await _sachServices
                        .GetListByConditionAsync(searchDto);

                    return Ok(result);
                }
                catch (Exception ex)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = ex.Message
                    });
                }
            }

            [HttpPost("upload-image")]
            public async Task<IActionResult> UploadImage([FromForm] IFormFile? file)
            {
                try
                {
                    if (file == null || file.Length == 0)
                    {
                        return BadRequest(new { success = false, message = "Vui lòng chọn tệp hình ảnh để tải lên." });
                    }

                    var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
                    var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp", ".gif" };
                    if (!allowedExtensions.Contains(ext))
                    {
                        return BadRequest(new { success = false, message = "Định dạng tệp không hợp lệ. Chỉ chấp nhận .jpg, .png, .webp, .gif." });
                    }

                    string contentRoot = Directory.GetCurrentDirectory();
                    string targetDir = Path.GetFullPath(Path.Combine(contentRoot, "..", "Frontend", "image", "sach"));
                    if (!Directory.Exists(targetDir))
                    {
                        targetDir = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "Frontend", "image", "sach"));
                    }
                    if (!Directory.Exists(targetDir))
                    {
                        Directory.CreateDirectory(targetDir);
                    }

                    var rawName = Path.GetFileNameWithoutExtension(file.FileName);
                    var cleanName = System.Text.RegularExpressions.Regex.Replace(rawName, @"[^a-zA-Z0-9_-]", "-").Trim('-');
                    if (string.IsNullOrEmpty(cleanName)) cleanName = "book";
                    var finalFileName = $"{cleanName}-{DateTime.Now:yyyyMMddHHmmss}{ext}";
                    var filePath = Path.Combine(targetDir, finalFileName);

                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await file.CopyToAsync(stream);
                    }

                    return Ok(new
                    {
                        success = true,
                        message = "Tải ảnh thành công!",
                        fileName = finalFileName,
                        relativePath = "image/sach/" + finalFileName
                    });
                }
                catch (Exception ex)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Lỗi khi lưu ảnh: " + ex.Message
                    });
                }
            }

            [HttpPost]
            [AdminOnly]
            public async Task<IActionResult> Create([FromBody] Sach sach)
            {
                try
                {
                    if (sach == null)
                    {
                        return BadRequest(new { success = false, message = "Dữ liệu sách không hợp lệ." });
                    }

                    sach.MaTacGiaNavigation = null!;
                    sach.MaTheLoaiNavigation = null!;
                    sach.MaNhaXuatBanNavigation = null!;

                    var result = await _sachServices.CreateAsync(sach);
                    if (result <= 0)
                    {
                        return BadRequest(new
                        {
                            success = false,
                            message = "Không thể thêm sách vào cơ sở dữ liệu."
                        });
                    }

                    return Ok(new
                    {
                        success = true,
                        message = "Thêm sách thành công!",
                        id = sach.MaSach > 0 ? sach.MaSach : result
                    });
                }
                catch (Exception ex)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = ex.InnerException?.Message ?? ex.Message
                    });
                }
            }

            [HttpPut("{id}")]
            [AdminOnly]
            public async Task<IActionResult> Update(
                int id,
                [FromBody] Sach sach)
            {
                try
                {
                    if (id != sach.MaSach)
                    {
                        return BadRequest(new
                        {
                            success = false,
                            message = "Mã sách không khớp!"
                        });
                    }

                    var existingSach = await _sachServices.GetByIdAsync(id);

                    if (existingSach == null)
                    {
                        return NotFound(new
                        {
                            success = false,
                            message = "Không tìm thấy sách!"
                        });
                    }

                    sach.MaTacGiaNavigation = null!;
                    sach.MaTheLoaiNavigation = null!;
                    sach.MaNhaXuatBanNavigation = null!;

                    var result = await _sachServices.UpdateAsync(sach);
                    if (result <= 0)
                    {
                        return BadRequest(new
                        {
                            success = false,
                            message = "Không thể cập nhật sách vào cơ sở dữ liệu."
                        });
                    }

                    return Ok(new
                    {
                        success = true,
                        message = "Cập nhật sách thành công!",
                        id = id
                    });
                }
                catch (Exception ex)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = ex.InnerException?.Message ?? ex.Message
                    });
                }
            }


            [HttpDelete("{id}")]
            [AdminOnly]
            public async Task<IActionResult> Delete(int id)
            {
                try
                {
                    var sach = await _sachServices.GetByIdAsync(id);

                    if (sach == null)
                    {
                        return NotFound(new
                        {
                            success = false,
                            message = "Không tìm thấy sách!"
                        });
                    }
                    var entity = new Sach
                    {
                        MaSach = id
                    };

                    var result = await _sachServices.DeleteAsync(entity);

                    return Ok(new
                    {
                        success = true,
                        message = "Xóa sách thành công!",
                        id = result
                    });
                }
                catch (Exception ex)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = ex.Message
                    });
                }
            }
        }
    }