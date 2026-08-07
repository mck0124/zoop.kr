package com.zoop.backend.config;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/** Validates server-to-server calls made by the AI worker processes. */
@Component
public class InternalApiKeyValidator {

    @Value("${zoop.internal.api-key:}")
    private String configuredKey;

    public boolean isConfigured() {
        return configuredKey != null && !configuredKey.isBlank();
    }

    public boolean isValid(String suppliedKey) {
        if (!isConfigured() || suppliedKey == null) return false;
        return MessageDigest.isEqual(
                configuredKey.getBytes(StandardCharsets.UTF_8),
                suppliedKey.getBytes(StandardCharsets.UTF_8));
    }

    public boolean isAllowed(String suppliedKey) {
        // Local development can run without a worker secret; production config requires one.
        return !isConfigured() || isValid(suppliedKey);
    }
}
