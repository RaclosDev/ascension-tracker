package com.ascension.service;

import com.ascension.exception.ExternalApiException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class FoodExternalServiceTest {
    private final ExternalApiExecution execution = new ExternalApiExecution();
    private final OpenFoodFactsClient off = mock(OpenFoodFactsClient.class);
    private final FatSecretClient fatSecret = mock(FatSecretClient.class);
    private final ObjectMapper mapper = new ObjectMapper();
    private final FoodExternalService service = new FoodExternalService(off, fatSecret,
            mock(FatSecretResponseMapper.class), mapper, execution);

    @AfterEach
    void close() { execution.close(); }

    @Test
    void oneProviderFailurePreservesOtherProvidersProducts() {
        when(off.searchOpenFoodFacts("rice")).thenReturn(mapper.readTree("{\"products\":[{\"name\":\"rice\"}]}"));
        when(fatSecret.searchFatSecret("rice")).thenThrow(new IllegalStateException("unavailable"));
        assertEquals("rice", mapper.readTree(service.searchOpenFoodFacts("rice")).path("products").get(0).path("name").asString());
    }

    @Test
    void bothProvidersFailInsteadOfReturningAnEmptySuccessfulSearch() {
        when(off.searchOpenFoodFacts("rice")).thenThrow(new IllegalStateException("unavailable"));
        when(fatSecret.searchFatSecret("rice")).thenThrow(new IllegalStateException("unavailable"));
        assertThrows(ExternalApiException.class, () -> service.searchOpenFoodFacts("rice"));
    }
}
