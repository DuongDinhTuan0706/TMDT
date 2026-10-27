using API.Dtos;
using API.Services;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TinNhanController : ControllerBase
    {
        private readonly ITinNhanService _tinNhanService;

        public TinNhanController(ITinNhanService tinNhanService)
        {
            _tinNhanService = tinNhanService;
        }

        // GET: api/TinNhan/history?user1=1&user2=6
        [HttpGet("history")]
        public async Task<IActionResult> GetChatHistory([FromQuery] int user1, [FromQuery] int user2)
        {
            var history = await _tinNhanService.GetChatHistoryAsync(user1, user2);
            return Ok(history);
        }

        // POST: api/TinNhan/send
        [HttpPost("send")]
        public async Task<IActionResult> SendMessage([FromBody] CreateTinNhanDTO createDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var tinNhan = await _tinNhanService.SendMessageAsync(createDto);
            return Ok(tinNhan); // Trả về DTO kèm thông tin thời gian thực
        }

        // PUT: api/TinNhan/read/5
        [HttpPut("read/{id}")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            await _tinNhanService.MarkAsReadAsync(id);
            return NoContent();
        }

        // DELETE: api/TinNhan/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMessage(int id)
        {
            await _tinNhanService.DeleteMessageAsync(id);
            return NoContent();
        }
    }
}