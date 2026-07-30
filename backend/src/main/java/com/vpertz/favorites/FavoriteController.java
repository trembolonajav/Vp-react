package com.vpertz.favorites;

import com.vpertz.common.security.AuthPrincipal;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/favorites")
public class FavoriteController {
    private final FavoriteService service;

    public FavoriteController(FavoriteService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<String>> list(@AuthenticationPrincipal AuthPrincipal principal) {
        return ResponseEntity.ok(service.list(principal.userId()));
    }

    @PostMapping("/{listingId}")
    public ResponseEntity<Void> add(
            @PathVariable String listingId,
            @AuthenticationPrincipal AuthPrincipal principal) {
        service.add(principal.userId(), listingId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{listingId}")
    public ResponseEntity<Void> remove(
            @PathVariable String listingId,
            @AuthenticationPrincipal AuthPrincipal principal) {
        service.remove(principal.userId(), listingId);
        return ResponseEntity.noContent().build();
    }
}
