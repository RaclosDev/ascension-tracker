package com.ascension.support;

import org.junit.jupiter.api.extension.ConditionEvaluationResult;
import org.junit.jupiter.api.extension.ExecutionCondition;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.extension.ExtensionContext;
import org.testcontainers.DockerClientFactory;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation to conditionally execute integration tests that require a running Docker daemon.
 * In CI environments (e.g. GitHub Actions), Docker is always running and tests execute fully.
 * On developer workstations where Docker Desktop is not started, tests are safely skipped
 * without causing false build failures.
 */
@Target({ElementType.TYPE, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@ExtendWith(DisabledIfDockerUnavailable.Condition.class)
public @interface DisabledIfDockerUnavailable {

    class Condition implements ExecutionCondition {
        private static final ConditionEvaluationResult ENABLED =
                ConditionEvaluationResult.enabled("Docker daemon is available");

        @Override
        public ConditionEvaluationResult evaluateExecutionCondition(ExtensionContext context) {
            try {
                if (DockerClientFactory.instance().isDockerAvailable()) {
                    return ENABLED;
                }
                return ConditionEvaluationResult.disabled("Skipping test: Docker daemon is not running on this host");
            } catch (Throwable t) {
                return ConditionEvaluationResult.disabled("Skipping test: Docker is not available (" + t.getMessage() + ")");
            }
        }
    }
}
