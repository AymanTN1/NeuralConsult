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

  public MailEnvelope buildUrgentAiAlertEmail(User user,
                                              String title,
                                              String content,
                                              String actionPath,
                                              String actionLabel) {
    String safeTitle = escape(title);
    String safeContent = escape(content).replace("\n", "<br/>");
    String safeActionLabel = escape(actionLabel != null && !actionLabel.isBlank() ? actionLabel : "Ouvrir la conversation");
    String actionUrl = actionPath != null && !actionPath.isBlank()
        ? "http://localhost:5173" + actionPath
        : "http://localhost:5173/support";
    String html = """
        <div style="margin:0;padding:24px;background:#fff1f2;font-family:Arial,Helvetica,sans-serif;color:#3f0d12;">
          <div style="max-width:720px;margin:0 auto;background:#ffffff;border:1px solid #fecdd3;border-radius:20px;overflow:hidden;box-shadow:0 18px 40px rgba(190,24,93,0.12);">
            <div style="padding:20px 24px;background:linear-gradient(135deg,#b91c1c,#f97316);color:#ffffff;">
              <div style="font-size:12px;letter-spacing:0.24em;text-transform:uppercase;opacity:0.9;">Alerte clinique urgente</div>
              <h1 style="margin:10px 0 0;font-size:28px;line-height:1.2;">%s</h1>
            </div>
            <div style="padding:24px;">
              <p style="margin:0 0 14px;font-size:16px;line-height:1.6;">Bonjour %s,</p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#7f1d1d;">%s</p>
              <div style="padding:16px;border-radius:18px;background:#fff7ed;border:1px solid #fdba74;margin:18px 0;color:#9a3412;font-size:14px;line-height:1.7;">
                Cette alerte reste prioritaire tant qu'elle n'a pas ete accusee ou resolue dans la plateforme. Un rappel email sera renvoye toutes les 8 heures si elle reste ouverte.
              </div>
              <div style="margin:24px 0;">
                <a href="%s" style="display:inline-block;padding:14px 24px;border-radius:999px;background:#dc2626;color:#ffffff;text-decoration:none;font-weight:700;">%s</a>
              </div>
            </div>
          </div>
        </div>
        """.formatted(safeTitle, escape(resolveRecipientName(user)), safeContent, actionUrl, safeActionLabel);
    String text = title + "\n\nBonjour " + resolveRecipientName(user) + ",\n\n" + content
        + "\n\nCette alerte reste prioritaire tant qu'elle n'a pas ete accusee ou resolue. Un rappel sera renvoye toutes les 8 heures."
        + "\n\n" + safeActionLabel + " : " + actionUrl;
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

  public MailEnvelope buildPasswordResetEmail(User user, String code, int ttlMinutes) {
    String safeName = escape(resolveRecipientName(user));
    String safeCode = escape(code);
    String html = """
        <div style="margin:0;padding:24px;background:#edf4ff;font-family:Arial,Helvetica,sans-serif;color:#102a43;">
          <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #d7e6ff;border-radius:20px;overflow:hidden;box-shadow:0 18px 40px rgba(37,99,235,0.10);">
            <div style="padding:20px 24px;background:linear-gradient(135deg,#1d4ed8,#38bdf8);color:#ffffff;">
              <div style="font-size:12px;letter-spacing:0.22em;text-transform:uppercase;opacity:0.86;">Mot de passe oublie</div>
              <h1 style="margin:10px 0 0;font-size:26px;line-height:1.2;">Reinitialisez votre mot de passe</h1>
            </div>
            <div style="padding:24px;">
              <p style="margin:0 0 14px;font-size:16px;line-height:1.6;">Bonjour %s,</p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#334e68;">
                Nous avons recu une demande de reinitialisation de mot de passe pour votre acces NeuralConsult.
                Saisissez ce code a 6 chiffres dans la plateforme. Il expire dans %d minutes.
              </p>
              <div style="margin:28px 0;padding:18px 22px;border-radius:20px;background:#f8fbff;border:1px solid #bfd7ff;text-align:center;">
                <div style="font-size:13px;letter-spacing:0.24em;text-transform:uppercase;color:#486581;">Code de reinitialisation</div>
                <div style="margin-top:10px;font-size:34px;font-weight:800;letter-spacing:0.35em;color:#1d4ed8;">%s</div>
              </div>
              <div style="padding:14px 16px;border-radius:16px;background:#f8fbff;border:1px solid #d7e6ff;color:#486581;font-size:13px;line-height:1.6;">
                Si vous n'etes pas a l'origine de cette demande, vous pouvez ignorer cet email. Par securite, seul le dernier code envoye reste valide.
              </div>
            </div>
          </div>
        </div>
        """.formatted(safeName, ttlMinutes, safeCode);
    String text = "Bonjour " + resolveRecipientName(user)
        + ",\n\nCode de reinitialisation NeuralConsult : " + code
        + "\nValide pendant " + ttlMinutes + " minutes.\n";
    return new MailEnvelope("Code de reinitialisation NeuralConsult", html, text);
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

  public MailEnvelope buildVideoConsultationEmail(User user,
                                                  String title,
                                                  String intro,
                                                  LocalDateTime startsAt,
                                                  String counterpartName,
                                                  String joinUrl) {
    String safeTitle = escape(title);
    String safeIntro = escape(intro);
    String safeCounterpart = escape(counterpartName != null && !counterpartName.isBlank() ? counterpartName : "votre interlocuteur clinique");
    String safeJoinUrl = escape(joinUrl);
    String when = startsAt != null ? DATE_TIME_FORMATTER.format(startsAt) : "dans quelques minutes";
    String html = """
        <div style="margin:0;padding:24px;background:#edf4ff;font-family:Arial,Helvetica,sans-serif;color:#102a43;">
          <div style="max-width:720px;margin:0 auto;background:#ffffff;border:1px solid #d7e6ff;border-radius:20px;overflow:hidden;box-shadow:0 18px 40px rgba(37,99,235,0.10);">
            <div style="padding:20px 24px;background:linear-gradient(135deg,#1d4ed8,#38bdf8);color:#ffffff;">
              <div style="font-size:12px;letter-spacing:0.22em;text-transform:uppercase;opacity:0.86;">Teleconsultation visio</div>
              <h1 style="margin:10px 0 0;font-size:26px;line-height:1.2;">%s</h1>
            </div>
            <div style="padding:24px;">
              <p style="margin:0 0 14px;font-size:16px;line-height:1.6;">Bonjour %s,</p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#334e68;">%s</p>
              <div style="padding:18px;border-radius:18px;background:#f8fbff;border:1px solid #d7e6ff;margin:20px 0;">
                <div style="font-size:13px;letter-spacing:0.18em;text-transform:uppercase;color:#486581;">Consultation</div>
                <div style="margin-top:8px;font-size:15px;line-height:1.7;color:#102a43;"><strong>Horaire :</strong> %s</div>
                <div style="font-size:15px;line-height:1.7;color:#102a43;"><strong>Avec :</strong> %s</div>
              </div>
              <div style="margin:24px 0;">
                <a href="%s" style="display:inline-block;padding:14px 24px;border-radius:999px;background:#16a34a;color:#ffffff;text-decoration:none;font-weight:700;">Rejoindre la visio</a>
              </div>
              <div style="padding:14px 16px;border-radius:16px;background:#f8fbff;border:1px solid #d7e6ff;color:#486581;font-size:13px;line-height:1.6;">
                Conseil pratique : ouvrez ce lien 2 a 3 minutes avant le debut de la seance et verifiez camera, micro et connexion internet.
              </div>
            </div>
          </div>
        </div>
        """.formatted(safeTitle, escape(resolveRecipientName(user)), safeIntro, escape(when), safeCounterpart, safeJoinUrl);
    String text = title
        + "\n\nBonjour " + resolveRecipientName(user)
        + ",\n\n" + intro
        + "\nHoraire : " + when
        + "\nAvec : " + counterpartName
        + "\nLien visio : " + joinUrl;
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
