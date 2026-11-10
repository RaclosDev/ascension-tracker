package com.ascension.service.auth;

import com.ascension.service.auth.EmailSender.Email;
import org.springframework.web.util.HtmlUtils;

/** Texts of the account emails, in Spanish, as plain text and as simple HTML. */
final class AccountEmails {

    private AccountEmails() {
    }

    static Email signUpCode(String to, String code) {
        return email(to, "Tu código de Ascension: " + code,
                "Tu código para crear la cuenta de Ascension es " + code + ".",
                "Caduca en 15 minutos. Si no has sido tú, ignora este correo.");
    }

    static Email alreadyRegistered(String to, String baseUrl) {
        return email(to, "Ya tienes una cuenta en Ascension",
                "Alguien ha intentado crear una cuenta de Ascension con este email, pero ya tienes una.",
                "Entra en " + baseUrl + "/login con tu contraseña, con Google o con tu llave de acceso. "
                        + "Si no recuerdas la contraseña, pulsa «¿Has olvidado la contraseña?». "
                        + "Si no has sido tú, ignora este correo.");
    }

    static Email signInWithGoogle(String to, String baseUrl) {
        return email(to, "Cómo entrar en Ascension",
                "Has pedido restablecer la contraseña, pero tu cuenta de Ascension no tiene contraseña: entras con Google.",
                "Entra en " + baseUrl + "/login y pulsa «Continuar con Google». "
                        + "Si no has sido tú, ignora este correo.");
    }

    static Email resetLink(String to, String link) {
        return email(to, "Restablece tu contraseña de Ascension",
                "Para elegir una contraseña nueva abre este enlace: " + link,
                "Caduca en 30 minutos y solo sirve una vez. Al cambiarla se cerrarán tus sesiones abiertas "
                        + "y se borrarán tus llaves de acceso. Si no has sido tú, ignora este correo.");
    }

    private static Email email(String to, String subject, String first, String second) {
        String text = first + "\n\n" + second + "\n";
        String html = "<p>" + HtmlUtils.htmlEscape(first) + "</p><p>" + HtmlUtils.htmlEscape(second) + "</p>";
        return new Email(to, subject, text, html);
    }
}
