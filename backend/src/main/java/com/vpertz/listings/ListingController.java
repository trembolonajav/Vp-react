package com.vpertz.listings;

import com.vpertz.common.security.AuthPrincipal;
import com.vpertz.listings.dto.ListingFilter;
import com.vpertz.listings.dto.ListingResponse;
import com.vpertz.listings.dto.ListingWriteRequest;
import com.vpertz.listings.dto.PageResponse;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Vitrine de anúncios do bazaar (leitura pública). */
@RestController
@RequestMapping("/api/v1/listings")
public class ListingController {

    private final ListingService listingService;

    public ListingController(ListingService listingService) {
        this.listingService = listingService;
    }

    @GetMapping
    public ResponseEntity<PageResponse<ListingResponse>> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String tipo,
            @RequestParam(required = false) String intencao,
            @RequestParam(required = false) String moeda,
            @RequestParam(required = false) String jogo,
            @RequestParam(required = false) String categoria,
            @RequestParam(required = false) String servidor,
            @RequestParam(required = false) BigDecimal precoMin,
            @RequestParam(required = false) BigDecimal precoMax,
            @RequestParam(required = false) Integer ivMin,
            @RequestParam(required = false) Integer ivMax,
            @RequestParam(required = false) BigDecimal qualidadeMin,
            @RequestParam(required = false) BigDecimal qualidadeMax,
            @RequestParam(required = false) Integer nivelMin,
            @RequestParam(required = false) Integer nivelMax,
            @RequestParam(required = false) Integer poderMin,
            @RequestParam(required = false) Integer poderMax,
            @RequestParam(required = false) List<String> tipos,
            @RequestParam(defaultValue = "ativo") String status,
            @RequestParam(defaultValue = "recentes") String sort,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "12") int size) {

        ListingFilter filter = new ListingFilter(
                q, tipo, intencao, moeda, jogo, categoria, servidor,
                precoMin, precoMax, ivMin, ivMax, qualidadeMin, qualidadeMax,
                nivelMin, nivelMax, poderMin, poderMax, tipos,
                "todos".equalsIgnoreCase(status) ? null : status);

        return ResponseEntity.ok(listingService.list(filter, sort, page, size));
    }

    @GetMapping("/{publicId}")
    public ResponseEntity<ListingResponse> getOne(@PathVariable String publicId) {
        return ResponseEntity.ok(listingService.getByPublicId(publicId));
    }

    @PostMapping
    public ResponseEntity<ListingResponse> create(
            @Valid @RequestBody ListingWriteRequest request,
            @AuthenticationPrincipal AuthPrincipal principal) {
        ListingResponse created = listingService.create(request, principal);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{publicId}")
    public ResponseEntity<ListingResponse> update(
            @PathVariable String publicId,
            @Valid @RequestBody ListingWriteRequest request,
            @AuthenticationPrincipal AuthPrincipal principal) {
        return ResponseEntity.ok(listingService.update(publicId, request, principal));
    }

    @DeleteMapping("/{publicId}")
    public ResponseEntity<Void> delete(
            @PathVariable String publicId,
            @AuthenticationPrincipal AuthPrincipal principal) {
        listingService.delete(publicId, principal);
        return ResponseEntity.noContent().build();
    }
}
