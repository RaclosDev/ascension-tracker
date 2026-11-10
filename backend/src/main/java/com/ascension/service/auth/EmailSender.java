package com.ascension.service.auth;

/** Transactional account emails: sign-up code, password reset link and account notices. */
public interface EmailSender {

    /** Whether a provider is configured; without one no email can be sent. */
    boolean enabled();

    /**
     * Sends the email without waiting for the provider, so answering the caller takes the same time
     * whether or not the account exists. Failures only reach the log.
     */
    void send(Email email);

    /**
     * @param to      recipient
     * @param subject subject line
     * @param text    plain-text body
     * @param html    the same body as HTML
     */
    record Email(String to, String subject, String text, String html) {

        /** Keeps the body (with its one-time code or link) out of the logs. */
        @Override
        public String toString() {
            return "Email[subject=" + subject + "]";
        }
    }
}
