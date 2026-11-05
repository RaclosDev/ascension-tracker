package com.ascension.service.ai;

/** A per-user daily AI limit that can raise the default one, such as the one a coach's plan grants. */
@FunctionalInterface
public interface AiDailyLimitResolver {

    /** The extra daily limit for this user, or 0 when nothing raises it. */
    int dailyLimitFor(String userEmail);
}
