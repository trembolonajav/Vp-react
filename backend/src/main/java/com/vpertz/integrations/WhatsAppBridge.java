package com.vpertz.integrations;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/** Ponte interna para o serviço Node/Baileys; nenhuma credencial do WhatsApp chega ao browser. */
@Service
public class WhatsAppBridge {
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(3)).build();
    private final ObjectMapper mapper;
    private final String baseUrl;
    private final String token;

    public WhatsAppBridge(ObjectMapper mapper,
            @Value("${app.whatsapp.service-url:http://localhost:3000}") String baseUrl,
            @Value("${app.whatsapp.service-token:dev-whatsapp-token}") String token) {
        this.mapper = mapper;
        this.baseUrl = baseUrl.replaceAll("/+$", "");
        this.token = token;
    }

    public JsonNode get(String path) { return request("GET", path, null); }
    public JsonNode post(String path, Object body) { return request("POST", path, body); }
    public JsonNode put(String path, Object body) { return request("PUT", path, body); }

    public void alertIntermediary(String conversationId, String title, String buyer, String seller, String url) {
        String message = "🚨 *NOVO INTERMÉDIO VP*\n\nAnúncio: " + title
                + "\nComprador: " + buyer + "\nVendedor: " + seller
                + "\nConversa: #" + conversationId.substring(0, Math.min(8, conversationId.length()))
                + "\n\n🔗 " + url;
        CompletableFuture.runAsync(() -> {
            try { post("/send", Map.of("message", message)); }
            catch (RuntimeException ignored) { /* fila administrativa continua sendo a fonte de verdade */ }
        });
    }

    private JsonNode request(String method, String path, Object body) {
        try {
            HttpRequest.Builder builder = HttpRequest.newBuilder(URI.create(baseUrl + path))
                    .timeout(Duration.ofSeconds(8)).header("Authorization", "Bearer " + token)
                    .header("Content-Type", "application/json");
            String json = body == null ? "" : mapper.writeValueAsString(body);
            builder.method(method, body == null ? HttpRequest.BodyPublishers.noBody() : HttpRequest.BodyPublishers.ofString(json));
            HttpResponse<String> response = http.send(builder.build(), HttpResponse.BodyHandlers.ofString());
            JsonNode result = response.body().isBlank() ? mapper.createObjectNode() : mapper.readTree(response.body());
            if (response.statusCode() >= 400) throw new IllegalStateException(result.path("message").asText("Falha no WhatsApp."));
            return result;
        } catch (Exception error) {
            throw new IllegalStateException("Serviço WhatsApp indisponível: " + error.getMessage(), error);
        }
    }
}
