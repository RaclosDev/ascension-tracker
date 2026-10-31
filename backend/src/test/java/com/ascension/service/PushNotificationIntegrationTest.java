package com.ascension.service;

import com.ascension.TestcontainersConfiguration;
import com.ascension.model.PushSubscription;
import com.ascension.model.RestTimer;
import com.ascension.model.RestTimerStatus;
import com.ascension.repository.PushSubscriptionRepository;
import com.ascension.repository.RestTimerRepository;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import nl.martijndwars.webpush.Subscription;
import org.apache.http.HttpResponse;
import org.apache.http.ProtocolVersion;
import org.apache.http.StatusLine;
import org.apache.http.message.BasicHttpResponse;
import org.apache.http.message.BasicStatusLine;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.SecureRandom;
import java.security.Security;
import java.security.spec.ECGenParameterSpec;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

import com.ascension.support.DisabledIfDockerUnavailable;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@SpringBootTest
@DisabledIfDockerUnavailable
@Import(TestcontainersConfiguration.class)
@TestPropertySource(properties = {
    "GOOGLE_CLIENT_ID=test-google-client-id",
    "GEMINI_API_KEY=test-gemini-key",
    "app.push.timer-poll-delay-ms=60000"
})
class PushNotificationIntegrationTest {

    @MockitoBean
    private PushService pushService;

    @Autowired
    private PushNotificationService pushNotificationService;

    @Autowired
    private PushSubscriptionRepository pushSubscriptionRepository;

    @Autowired
    private RestTimerRepository restTimerRepository;

    @Autowired
    private RestTimerService restTimerService;

    @Autowired
    private UserService userService;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbc;

    private static final String USER_EMAIL = "athlete@example.com";
    private static final String USER_EMAIL_2 = "user2@example.com";
    private static final String ENDPOINT_PHONE = "https://fcm.googleapis.com/fcm/send/phone-device-1";
    private static final String ENDPOINT_LAPTOP = "https://updates.push.services.mozilla.com/wpush/v2/laptop-device-2";
    private static final String ENDPOINT_EXPIRED = "https://fcm.googleapis.com/fcm/send/expired-device-3";

    private static String validP256dh;
    private static String validAuth;

    @BeforeAll
    static void initCrypto() {
        if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
            Security.addProvider(new BouncyCastleProvider());
        }
        try {
            KeyPairGenerator kpg = KeyPairGenerator.getInstance("ECDH", BouncyCastleProvider.PROVIDER_NAME);
            kpg.initialize(new ECGenParameterSpec("prime256v1"));
            KeyPair kp = kpg.generateKeyPair();
            byte[] encoded = ((org.bouncycastle.jce.interfaces.ECPublicKey) kp.getPublic()).getQ().getEncoded(false);
            validP256dh = Base64.getUrlEncoder().withoutPadding().encodeToString(encoded);

            byte[] authBytes = new byte[16];
            new SecureRandom().nextBytes(authBytes);
            validAuth = Base64.getUrlEncoder().withoutPadding().encodeToString(authBytes);
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate test Web Push keys", e);
        }
    }

    @BeforeEach
    void setUp() throws Exception {
        userService.ensureUserExists(USER_EMAIL, "Athlete User", null);
        userService.ensureUserExists(USER_EMAIL_2, "Second User", null);
        pushNotificationService.setPushService(pushService);
        restTimerRepository.deleteAll();
        pushSubscriptionRepository.deleteAll();
        reset(pushService);
        when(pushService.sendAsync(any(Notification.class))).thenAnswer(invocation ->
                CompletableFuture.completedFuture(pushService.send(invocation.getArgument(0))));
    }

    private HttpResponse createHttpResponse(int statusCode) {
        StatusLine statusLine = new BasicStatusLine(
                new ProtocolVersion("HTTP", 1, 1),
                statusCode,
                statusCode == 201 ? "Created" : (statusCode == 410 ? "Gone" : "Not Found")
        );
        return new BasicHttpResponse(statusLine);
    }

    @Test
    @DisplayName("1. Soporte de múltiples suscripciones: envío de notificaciones a todos los endpoints del usuario")
    void sendPush_deliversToAllRegisteredEndpointsOfUser() throws Exception {
        // Registrar suscripción de teléfono
        Subscription phoneSub = new Subscription(
                ENDPOINT_PHONE,
                new Subscription.Keys(validP256dh, validAuth)
        );
        pushNotificationService.saveSubscription(USER_EMAIL, phoneSub);

        // Registrar suscripción de portátil para el mismo usuario
        Subscription laptopSub = new Subscription(
                ENDPOINT_LAPTOP,
                new Subscription.Keys(validP256dh, validAuth)
        );
        pushNotificationService.saveSubscription(USER_EMAIL, laptopSub);

        // Verificar que ambas suscripciones están persistidas para el usuario
        List<PushSubscription> saved = pushSubscriptionRepository.findByUserEmail(USER_EMAIL);
        assertThat(saved).hasSize(2);
        assertThat(saved).extracting(PushSubscription::getEndpoint)
                .containsExactlyInAnyOrder(ENDPOINT_PHONE, ENDPOINT_LAPTOP);

        // Mock HTTP 201 OK para ambos envíos
        when(pushService.send(any(Notification.class))).thenReturn(createHttpResponse(201));

        // Enviar notificación push
        pushNotificationService.sendPush(USER_EMAIL, "¡Descanso terminado!", "A por la siguiente serie.");

        // Capturar y verificar que se envió a ambos endpoints
        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(pushService, times(2)).send(captor.capture());

        List<String> targetedEndpoints = captor.getAllValues().stream()
                .map(Notification::getEndpoint)
                .toList();
        assertThat(targetedEndpoints).containsExactlyInAnyOrder(ENDPOINT_PHONE, ENDPOINT_LAPTOP);

        // Ambas suscripciones siguen vigentes
        assertThat(pushSubscriptionRepository.findByUserEmail(USER_EMAIL)).hasSize(2);
    }

    @Test
    @DisplayName("2. Borrado automático de suscripción caducada (410 Gone / 404 Not Found)")
    void sendPush_automaticallyDeletesExpiredOrNotFoundSubscriptions() throws Exception {
        // Registrar dispositivo activo y dispositivo caducado
        Subscription activeSub = new Subscription(
                ENDPOINT_PHONE,
                new Subscription.Keys(validP256dh, validAuth)
        );
        Subscription expiredSub = new Subscription(
                ENDPOINT_EXPIRED,
                new Subscription.Keys(validP256dh, validAuth)
        );
        pushNotificationService.saveSubscription(USER_EMAIL, activeSub);
        pushNotificationService.saveSubscription(USER_EMAIL, expiredSub);

        assertThat(pushSubscriptionRepository.findByUserEmail(USER_EMAIL)).hasSize(2);

        // Configurar respuesta según endpoint: 201 para activo, 410 Gone para expirado
        when(pushService.send(any(Notification.class))).thenAnswer(invocation -> {
            Notification notif = invocation.getArgument(0);
            if (ENDPOINT_EXPIRED.equals(notif.getEndpoint())) {
                return createHttpResponse(410);
            }
            return createHttpResponse(201);
        });

        // Enviar push
        pushNotificationService.sendPush(USER_EMAIL, "¡Descanso terminado!", "Hora de entrenar.");

        // Verificar que el endpoint caducado fue eliminado de la base de datos
        Optional<PushSubscription> expiredCheck = pushSubscriptionRepository.findByEndpoint(ENDPOINT_EXPIRED);
        assertThat(expiredCheck).isEmpty();

        // El endpoint activo sigue existiendo
        Optional<PushSubscription> activeCheck = pushSubscriptionRepository.findByEndpoint(ENDPOINT_PHONE);
        assertThat(activeCheck).isPresent();
        assertThat(pushSubscriptionRepository.findByUserEmail(USER_EMAIL)).hasSize(1);
    }

    @Test
    @DisplayName("3. Temporizadores de descanso persistidos: recuperación y disparo tras reinicio simulado")
    void restTimers_recoveredAndDispatchedAfterSimulatedRestart() throws Exception {
        // Registrar endpoint para el usuario
        Subscription phoneSub = new Subscription(
                ENDPOINT_PHONE,
                new Subscription.Keys(validP256dh, validAuth)
        );
        pushNotificationService.saveSubscription(USER_EMAIL, phoneSub);

        // Simular reinicio: en la base de datos existe un temporizador que venció en el pasado
        // (por ejemplo mientras el servidor estuvo apagado o en reinicio)
        RestTimer recoveredTimer = restTimerService.scheduleTimerAt(
                USER_EMAIL,
                Instant.now().minusSeconds(15) // ya vencido
        );
        assertThat(recoveredTimer.getStatus()).isEqualTo(RestTimerStatus.PENDING);

        when(pushService.send(any(Notification.class))).thenReturn(createHttpResponse(201));

        // Ejecutar el poller (como ocurre tras el arranque del sistema)
        pushNotificationService.pollDueTimers();

        // Esperar a que el ThreadPoolTaskExecutor complete el envío asíncrono
        verify(pushService, timeout(5000).times(1)).send(any(Notification.class));

        // Verificar que el temporizador en base de datos quedó en COMPLETED
        org.awaitility.Awaitility.await().atMost(java.time.Duration.ofSeconds(3)).untilAsserted(() ->
                assertThat(restTimerRepository.findById(recoveredTimer.getId()).orElseThrow().getStatus()).isEqualTo(RestTimerStatus.COMPLETED));

        // Una segunda ejecución del poller no debe volver a disparar el temporizador ya completado (idempotencia)
        pushNotificationService.pollDueTimers();
        verify(pushService, times(1)).send(any(Notification.class));
    }

    @Test
    void transientProviderFailureRetriesWithTheSameNotificationTag() throws Exception {
        pushNotificationService.saveSubscription(USER_EMAIL,
                new Subscription(ENDPOINT_PHONE, new Subscription.Keys(validP256dh, validAuth)));
        RestTimer timer = restTimerService.scheduleTimerAt(USER_EMAIL, Instant.now().minusSeconds(5));
        when(pushService.send(any(Notification.class)))
                .thenReturn(createHttpResponse(503), createHttpResponse(201));
        pushNotificationService.pollDueTimers();
        org.awaitility.Awaitility.await().atMost(java.time.Duration.ofSeconds(5)).untilAsserted(() -> {
            RestTimer failed = restTimerRepository.findById(timer.getId()).orElseThrow();
            assertThat(failed.getStatus()).isEqualTo(RestTimerStatus.PENDING);
            assertThat(failed.getNextAttemptAt()).isNotNull();
        });
        pushNotificationService.pollDueTimers();
        verify(pushService, times(1)).send(any(Notification.class));
        jdbc.update("UPDATE rest_timers SET next_attempt_at = NOW() - INTERVAL '1 second' WHERE id = ?", timer.getId());
        pushNotificationService.pollDueTimers();
        org.awaitility.Awaitility.await().atMost(java.time.Duration.ofSeconds(5)).untilAsserted(() ->
                assertThat(restTimerRepository.findById(timer.getId()).orElseThrow().getStatus())
                        .isEqualTo(RestTimerStatus.COMPLETED));
        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(pushService, times(2)).send(captor.capture());
        assertThat(captor.getAllValues().get(0).getPayload()).isEqualTo(captor.getAllValues().get(1).getPayload());
        assertThat(new String(captor.getValue().getPayload(), java.nio.charset.StandardCharsets.UTF_8))
                .contains("ascension-rest-timer-" + timer.getId());
    }

    @Test
    void exceptionTextCannotDeleteASubscriptionOrAcknowledgeItsTimer() throws Exception {
        pushNotificationService.saveSubscription(USER_EMAIL,
                new Subscription(ENDPOINT_PHONE, new Subscription.Keys(validP256dh, validAuth)));
        RestTimer timer = restTimerService.scheduleTimerAt(USER_EMAIL, Instant.now().minusSeconds(5));
        when(pushService.sendAsync(any(Notification.class))).thenReturn(
                CompletableFuture.failedFuture(new java.io.IOException("Timeout for endpoint device-404-410")));
        pushNotificationService.pollDueTimers();
        org.awaitility.Awaitility.await().atMost(java.time.Duration.ofSeconds(5)).untilAsserted(() -> {
            RestTimer failed = restTimerRepository.findById(timer.getId()).orElseThrow();
            assertThat(failed.getStatus()).isEqualTo(RestTimerStatus.PENDING);
            assertThat(failed.getNextAttemptAt()).isNotNull();
        });
        assertThat(pushSubscriptionRepository.findByEndpoint(ENDPOINT_PHONE)).isPresent();
    }

    @Test
    @DisplayName("4. Poller con SKIP LOCKED: dos hilos concurrentes no duplican ejecución")
    void restTimers_concurrentPolling_skipLockedAvoidsDuplicates() throws Exception {
        // Crear 10 temporizadores vencidos para USER_EMAIL
        for (int i = 0; i < 10; i++) {
            restTimerRepository.save(RestTimer.builder()
                    .userEmail(USER_EMAIL)
                    .fireAt(Instant.now().minusSeconds(5 + i))
                    .status(RestTimerStatus.PENDING)
                    .createdAt(Instant.now())
                    .build());
        }

        // Simular dos instancias/hilos reclamando 5 temporizadores cada uno
        CompletableFuture<List<RestTimer>> instance1 = CompletableFuture.supplyAsync(
                () -> restTimerService.claimDueTimers(Instant.now(), 5)
        );
        CompletableFuture<List<RestTimer>> instance2 = CompletableFuture.supplyAsync(
                () -> restTimerService.claimDueTimers(Instant.now(), 5)
        );

        CompletableFuture.allOf(instance1, instance2).get(10, TimeUnit.SECONDS);

        List<RestTimer> claimed1 = instance1.get();
        List<RestTimer> claimed2 = instance2.get();

        List<Long> ids1 = claimed1.stream().map(RestTimer::getId).toList();
        List<Long> ids2 = claimed2.stream().map(RestTimer::getId).toList();

        assertThat(ids1).hasSize(5);
        assertThat(ids2).hasSize(5);
        assertThat(ids1).noneMatch(ids2::contains);
        assertThat(ids1.size() + ids2.size()).isEqualTo(10);
    }

    @Test
    @DisplayName("5. Cancelación de temporizador: no se dispara si fue cancelado")
    void restTimers_cancelNotification_preventsFiring() throws Exception {
        pushNotificationService.scheduleRestNotification(USER_EMAIL, 30);
        pushNotificationService.cancelRestNotification(USER_EMAIL);

        List<RestTimer> timers = restTimerRepository.findAll();
        assertThat(timers).hasSize(1);
        assertThat(timers.get(0).getStatus()).isEqualTo(RestTimerStatus.CANCELLED);

        // Poller no debe reclamar temporizadores cancelados
        List<RestTimer> claimed = restTimerService.claimDueTimers(Instant.now().plusSeconds(60), 50);
        assertThat(claimed).isEmpty();
        verify(pushService, never()).send(any(Notification.class));
    }

    @Test
    @DisplayName("6. Unicidad de endpoint: re-suscripción con mismo endpoint actualiza sin duplicar")
    void saveSubscription_endpointUniquenessMaintained() throws Exception {
        Subscription sub1 = new Subscription(ENDPOINT_PHONE, new Subscription.Keys(validP256dh, validAuth));
        pushNotificationService.saveSubscription(USER_EMAIL, sub1);

        Subscription sub2 = new Subscription(ENDPOINT_PHONE, new Subscription.Keys(validP256dh, validAuth));
        pushNotificationService.saveSubscription(USER_EMAIL_2, sub2);

        List<PushSubscription> all = pushSubscriptionRepository.findAll();
        assertThat(all).hasSize(1);
        assertThat(all.get(0).getUserEmail()).isEqualTo(USER_EMAIL_2);
    }
}
