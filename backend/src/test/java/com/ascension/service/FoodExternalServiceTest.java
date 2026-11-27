package com.ascension.service;

import com.ascension.exception.ExternalApiException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.cache.CacheManager;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import tools.jackson.databind.ObjectMapper;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class FoodExternalServiceTest {
    private final ExternalApiExecution execution = new ExternalApiExecution();
    private final OpenFoodFactsClient off = mock(OpenFoodFactsClient.class);
    private final FatSecretClient fatSecret = mock(FatSecretClient.class);
    private final ObjectMapper mapper = new ObjectMapper();
    private final FatSecretResponseMapper fatSecretMapper = mock(FatSecretResponseMapper.class);
    private final CacheManager cacheManager = new ConcurrentMapCacheManager("foodSearch");
    private final FoodExternalService service = new FoodExternalService(off, fatSecret,
            fatSecretMapper, mapper, execution, cacheManager);

    @AfterEach
    void close() { execution.close(); }

    @Test
    void oneProviderFailurePreservesOtherProvidersProducts() {
        when(off.searchOpenFoodFacts("rice")).thenReturn(mapper.readTree("{\"products\":[{\"name\":\"rice\"}]}"));
        when(fatSecret.searchFatSecret("rice")).thenThrow(new IllegalStateException("unavailable"));
        assertEquals("rice", mapper.readTree(service.searchOpenFoodFacts("rice")).path("products").get(0).path("name").asString());
    }

    @Test
    void aPartialResultIsNotCachedSoTheNextSearchRetriesBothProviders() {
        when(off.searchOpenFoodFacts("rice")).thenReturn(mapper.readTree("{\"products\":[{\"name\":\"rice\"}]}"));
        when(fatSecret.searchFatSecret("rice")).thenThrow(new IllegalStateException("unavailable"));
        service.searchOpenFoodFacts("rice");

        assertNull(cacheManager.getCache("foodSearch").get("q:rice"));

        reset(fatSecret);
        when(fatSecret.searchFatSecret("rice")).thenReturn(null);
        when(fatSecretMapper.mapFatSecretToOpenFoodFacts(any(), eq(false))).thenReturn("{\"products\":[{\"name\":\"arroz\"}]}");
        var products = mapper.readTree(service.searchOpenFoodFacts("rice")).path("products");
        assertEquals(2, products.size());
        verify(off, times(2)).searchOpenFoodFacts("rice");
    }

    @Test
    void aCompleteResultIsCachedUnderANormalizedKey() {
        when(off.searchOpenFoodFacts("rice")).thenReturn(mapper.readTree("{\"products\":[{\"name\":\"rice\"}]}"));
        when(fatSecretMapper.mapFatSecretToOpenFoodFacts(any(), eq(false))).thenReturn("{\"products\":[]}");

        String first = service.searchOpenFoodFacts("  Rice ");
        String second = service.searchOpenFoodFacts("rice");

        assertEquals(first, second);
        verify(off, times(1)).searchOpenFoodFacts("rice");
        assertNotNull(cacheManager.getCache("foodSearch").get("q:rice"));
    }

    @Test
    void bothProvidersFailInsteadOfReturningAnEmptySuccessfulSearch() {
        when(off.searchOpenFoodFacts("rice")).thenThrow(new IllegalStateException("unavailable"));
        when(fatSecret.searchFatSecret("rice")).thenThrow(new IllegalStateException("unavailable"));
        assertThrows(ExternalApiException.class, () -> service.searchOpenFoodFacts("rice"));
    }
}
