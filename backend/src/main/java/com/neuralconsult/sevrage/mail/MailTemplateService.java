package com.neuralconsult.sevrage.mail;

import com.neuralconsult.sevrage.user.User;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import org.springframework.stereotype.Service;

@Service
public class MailTemplateService {

  private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy 'a' HH:mm");

  public MailEnvelope buildNotificationEmail(User user,
                                             String title,
                                             String content,
                                             String actionPath,
                                             String actionLabel) {
    String safeTitle = escape(title);
    String safeContent = escape(content).replace("\n", "<br/>");
    String safeActionLabel = escape(actionLabel != null && !actionLabel.isBlank() ? actionLabel : "Ouvrir l'espace clinique");
    String actionUrl = actionPath != null && !actionPath.isBlank()
        ? "http://localhost:5173" + actionPath
        : "http://localhost:5173";
    String html = """
        <div style="margin:0;padding:24px;background:#edf4ff;font-family:Arial,Helvetica,sans-serif;color:#102a43;">
          <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #d7e6ff;border-radius:20px;overflow:hidden;box-shadow:0 18px 40px rgba(37,99,235,0.10);">
            <div style="padding:20px 24px;background:linear-gradient(135deg,#1d4ed8,#38bdf8);color:#ffffff;">
              <div style="font-size:12px;letter-spacing:0.22em;text-transform:uppercase;opacity:0.86;">NeuralConsult Sevrage</div>
              <h1 style="margin:10px 0 0;font-size:26px;line-height:1.2;">%s</h1>
            </div>
            <div style="padding:24px;">
              <p style="margin:0 0 14px;font-size:16px;line-height:1.6;">Bonjour %s,</p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#334e68;">%s</p>
              <div style="margin:24px 0;">
                <a href="%s" style="display:inline-block;padding:13px 22px;border-radius:999px;background:#16a34a;color:#ffffff;text-decoration:none;font-weight:700;">%s</a>
              </div>
              <div style="padding:14px 16px;border-radius:16px;background:#f8fbff;border:1px solid #d7e6ff;color:#486581;font-size:13px;line-height:1.6;">
                Cet email reprend un evenement important de votre parcours clinique. Vous retrouvez aussi cette information dans la boite de notifications de la plateforme.
              </div>
            </div>
          </div>
        </div>
        """.formatted(safeTitle, escape(resolveRecipientName(user)), safeContent, actionUrl, safeActionLabel);
    String text = title + "\n\nBonjour " + resolveRecipientName(user) + ",\n\n" + content + "\n\n" + safeActionLabel + " : " + actionUrl;
    return new MailEnvelope(safeTitle, html, text);
  }

  public MailEnvelope buildVerificationEmail(User user, String code, int ttlMinutes) {
    String safeName = escape(resolveRecipientName(user));
    String safeCode = escape(code);
    String html = """
        <div style="margin:0;padding:24px;background:#edf4ff;font-family:Arial,Helvetica,sans-serif;color:#102a43;">
          <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #d7e6ff;border-radius:20px;overflow:hidden;box-shadow:0 18px 40px rgba(37,99,235,0.10);">
            <div style="padding:20px 24px;background:linear-gradient(135deg,#1d4ed8,#38bdf8);color:#ffffff;">
              <div style="font-size:12px;letter-spacing:0.22em;text-transform:uppercase;opacity:0.86;">Verification d'email</div>
              <h1 style="margin:10px 0 0;font-size:26px;line-height:1.2;">Confirmez votre adresse email</h1>
            </div>
            <div style="padding:24px;">
              <p style="margin:0 0 14px;font-size:16px;line-height:1.6;">Bonjour %s,</p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#334e68;">
                Pour activer votre acces clinique, saisissez le code suivant dans la plateforme. Ce code expire dans %d minutes.
              </p>
              <div style="margin:28px 0;padding:18px 22px;border-radius:20px;background:#f8fbff;border:1px solid #bfd7ff;text-align:center;">
                <div style="font-size:13px;letter-spacing:0.24em;text-transform:uppercase;color:#486581;">Code de verification</div>
                <div style="margin-top:10px;font-size:34px;font-weight:800;letter-spacing:0.35em;color:#1d4ed8;">%s</div>
              </div>
              <div style="padding:14px 16px;border-radius:16px;background:#f8fbff;border:1px solid #d7e6ff;color:#486581;font-size:13px;line-height:1.6;">
                Si vous n'etes pas a l'origine de cette inscription, vous pouvez ignorer cet email. En cas de re-envoi, seul le dernier code recu restera valide.
              </div>
            </div>
          </div>
        </div>
        """.formatted(safeName, ttlMinutes, safeCode);
    String text = "Bonjour " + resolveRecipientName(user)
        + ",\n\nCode de verification NeuralConsult : " + code
        + "\nValide pendant " + ttlMinutes + " minutes.\n";
    return new MailEnvelope("Verification de votre email NeuralConsult", html, text);
  }

  public MailEnvelope buildReminderDigestEmail(User user,
                                               String title,
                                               String content,
                                               LocalDateTime scheduledAt) {
    String safeTitle = escape(title);
    String safeContent = escape(content);
    String when = scheduledAt != null ? DATE_TIME_FORMATTER.format(scheduledAt) : "des maintenant";
    String html = """
        <div style="margin:0;padding:24px;background:#edf4ff;font-family:Arial,Helvetica,sans-serif;color:#102a43;">
          <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #d7e6ff;border-radius:20px;overflow:hidden;box-shadow:0 18px 40px rgba(37,99,235,0.10);">
            <div style="padding:20px 24px;background:linear-gradient(135deg,#1d4ed8,#38bdf8);color:#ffffff;">
              <div style="font-size:12px;letter-spacing:0.22em;text-transform:uppercase;opacity:0.86;">Rappel clinique</div>
              <h1 style="margin:10px 0 0;font-size:26px;line-height:1.2;">%s</h1>
            </div>
            <div style="padding:24px;">
              <p style="margin:0 0 14px;font-size:16px;line-height:1.6;">Bonjour %s,</p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#334e68;">%s</p>
              <div style="padding:16px;border-radius:16px;background:#f8fbff;border:1px solid #d7e6ff;">
                <strong style="display:block;font-size:14px;color:#1d4ed8;">Repere temporel</strong>
                <span style="font-size:14px;color:#486581;">%s</span>
              </div>
            </div>
          </div>
        </div>
        """.formatted(safeTitle, escape(resolveRecipientName(user)), safeContent, escape(when));
    String text = title + "\n\nBonjour " + resolveRecipientName(user) + ",\n\n" + content + "\n\nRepere temporel : " + when;
    return new MailEnvelope(safeTitle, html, text);
  }

  private String resolveRecipientName(User user) {
    if (user == null || user.getFullName() == null || user.getFullName().isBlank()) {
      return "clinicien";
    }
    return user.getFullName().trim();
  }

  private String escape(String value) {
    if (value == null) {
      return "";
    }
    return value
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace("\"", "&quot;")
        .replace("'", "&#39;");
  }

  public record MailEnvelope(String subject, String htmlBody, String textBody) {
  }
}
