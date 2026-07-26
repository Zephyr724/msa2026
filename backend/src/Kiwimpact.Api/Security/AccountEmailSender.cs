using System.Net;
using System.Net.Mail;

namespace Kiwimpact.Api.Security;

public interface IAccountEmailSender
{
    Task SendAsync(string recipient, string subject, string textBody, CancellationToken ct);
}

public sealed class SmtpAccountEmailSender(
    IConfiguration configuration,
    IWebHostEnvironment environment,
    ILogger<SmtpAccountEmailSender> logger) : IAccountEmailSender
{
    public async Task SendAsync(
        string recipient, string subject, string textBody, CancellationToken ct)
    {
        var enabled = configuration.GetValue("Email:Enabled", false);
        if (!enabled)
        {
            if (!environment.IsDevelopment())
            {
                logger.LogError(
                    "Account email delivery was requested but no production provider is configured.");
            }
            return;
        }
        if (!environment.IsDevelopment())
            throw new InvalidOperationException(
                "A production email provider has not been configured.");

        var host = configuration["Email:Smtp:Host"] ?? "localhost";
        var port = configuration.GetValue("Email:Smtp:Port", 1025);
        var from = configuration["Email:From"] ?? "noreply@kiwimpact.local";
        using var message = new MailMessage(from, recipient, subject, textBody);
        using var client = new SmtpClient(host, port)
        {
            EnableSsl = false,
            UseDefaultCredentials = true,
            DeliveryMethod = SmtpDeliveryMethod.Network,
        };
        ct.ThrowIfCancellationRequested();
        await client.SendMailAsync(message, ct);
    }
}
