package com.ascension.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;

@Component
public class FatSecretSignatureBuilder {
    private static final Logger log = LoggerFactory.getLogger(FatSecretSignatureBuilder.class);

    @Value("${app.fatsecret.client-id:CHANGE_ME}")
    private String clientId;

    @Value("${app.fatsecret.client-secret:CHANGE_ME}")
    private String clientSecret;

    public String sign(String url, Map<String, String> queryParams) {
        try {
            String cId = clientId != null ? clientId.trim() : "";
            String cSec = clientSecret != null ? clientSecret.trim() : "";
            String consumerSecret = cSec + "&";
            String nonce = UUID.randomUUID().toString().replaceAll("-", "");
            String timestamp = String.valueOf(Instant.now().getEpochSecond());

            Map<String, String> allParams = new HashMap<>(queryParams);
            allParams.put("oauth_consumer_key", cId);
            allParams.put("oauth_nonce", nonce);
            allParams.put("oauth_signature_method", "HMAC-SHA1");
            allParams.put("oauth_timestamp", timestamp);
            allParams.put("oauth_version", "1.0");

            List<String> keys = new ArrayList<>(allParams.keySet());
            Collections.sort(keys);

            StringBuilder paramString = new StringBuilder();
            for (int i = 0; i < keys.size(); i++) {
                if (i > 0) paramString.append("&");
                paramString.append(oauthEncode(keys.get(i))).append("=").append(oauthEncode(allParams.get(keys.get(i))));
            }

            String baseString = "GET&" + oauthEncode(url) + "&" + oauthEncode(paramString.toString());

            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(consumerSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA1"));
            String signature = Base64.getEncoder().encodeToString(mac.doFinal(baseString.getBytes(StandardCharsets.UTF_8)));

            return url + "?" + paramString.toString() + "&oauth_signature=" + oauthEncode(signature);
        } catch (Exception e) {
            log.error("Error signing FatSecret URL", e);
            return url;
        }
    }

    private String oauthEncode(String value) throws Exception {
        return URLEncoder.encode(value, StandardCharsets.UTF_8.name())
                .replace("+", "%20")
                .replace("*", "%2A")
                .replace("%7E", "~");
    }
}
