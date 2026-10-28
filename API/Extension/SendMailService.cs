using Microsoft.Extensions.Options;
using System.Net;
using System.Net.Mail;
using API.Dtos;

namespace API.Extension
{
    public class SendMailService
    {
        private readonly MailSettings _mailSettings;

        public SendMailService(IOptions<MailSettings> mailSettings)
        {
            _mailSettings = mailSettings.Value;
        }

        public async Task<bool> SendMail(
            string toMail,
            string subject,
            string message)
        {
            try
            {
                using (MailMessage mail = new MailMessage())
                {
                    mail.From = new MailAddress(
                        _mailSettings.Mail,
                        _mailSettings.DisplayName);

                    mail.To.Add(toMail);

                    mail.Subject = subject;
                    mail.Body = message;
                    mail.IsBodyHtml = true;

                    using (SmtpClient smtp = new SmtpClient(
                        _mailSettings.Host,
                        _mailSettings.Port))
                    {
                        smtp.Credentials = new NetworkCredential(
                            _mailSettings.Mail,
                            _mailSettings.Password);

                        smtp.EnableSsl = true;

                        await smtp.SendMailAsync(mail);
                    }
                }

                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.ToString());
                return false;
            }
        }
    }
}