package com.ascension.config;

import com.ascension.util.Emails;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.ArrayList;
import java.util.List;

/** Accounts allowed to run back-office tasks, such as setting a coach's plan after a bank transfer. */
@Data
@Configuration
@ConfigurationProperties(prefix = "app.admin")
public class AdminProperties {

    /** Comma-separated in APP_ADMIN_EMAILS; empty means nobody is an admin. */
    private List<String> emails = new ArrayList<>();

    public boolean isAdmin(String email) {
        if (email == null || email.isBlank()) {
            return false;
        }
        String wanted = Emails.normalize(email);
        return emails.stream().anyMatch(admin -> admin != null && !admin.isBlank()
                && Emails.normalize(admin).equals(wanted));
    }
}
