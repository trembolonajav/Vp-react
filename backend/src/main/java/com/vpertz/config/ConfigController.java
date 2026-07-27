package com.vpertz.config;

import com.vpertz.config.dto.ConfigResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Configuração pública do site. Substitui o antigo GET /api/config mantendo o
 * mesmo contrato de dados.
 */
@RestController
@RequestMapping("/api/v1/config")
public class ConfigController {

    private final ConfigService configService;

    public ConfigController(ConfigService configService) {
        this.configService = configService;
    }

    @GetMapping
    public ResponseEntity<ConfigResponse> getConfig() {
        return ResponseEntity.ok(configService.getPublicConfig());
    }
}
