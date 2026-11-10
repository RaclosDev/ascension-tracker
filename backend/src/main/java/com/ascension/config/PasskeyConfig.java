package com.ascension.config;

import com.ascension.service.auth.PasskeyCredentialStore;
import com.yubico.webauthn.RelyingParty;
import com.yubico.webauthn.data.PublicKeyCredentialParameters;
import com.yubico.webauthn.data.RelyingPartyIdentity;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/** WebAuthn relying party: the domain passkeys belong to and the origins allowed to use them. */
@Configuration
public class PasskeyConfig {

    @Bean
    public RelyingParty relyingParty(PasskeyCredentialStore credentialStore,
                                     @Value("${app.webauthn.rp-id:ascension.raclos.es}") String rpId,
                                     @Value("${app.webauthn.origins:https://ascension.raclos.es}") String origins) {
        return RelyingParty.builder()
                .identity(RelyingPartyIdentity.builder().id(rpId).name("Ascension").build())
                .credentialRepository(credentialStore)
                // What phones, Windows Hello and security keys use.
                .preferredPubkeyParams(List.of(PublicKeyCredentialParameters.ES256,
                        PublicKeyCredentialParameters.EdDSA, PublicKeyCredentialParameters.RS256))
                .origins(Arrays.stream(origins.split(","))
                        .map(String::trim)
                        .filter(origin -> !origin.isEmpty())
                        .collect(Collectors.toSet()))
                .build();
    }
}
