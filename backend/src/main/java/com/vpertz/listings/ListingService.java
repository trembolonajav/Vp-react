package com.vpertz.listings;

import com.vpertz.common.exception.ResourceNotFoundException;
import com.vpertz.common.exception.ValidationException;
import com.vpertz.common.security.AuthPrincipal;
import com.vpertz.listings.dto.ListingFilter;
import com.vpertz.listings.dto.ListingResponse;
import com.vpertz.listings.dto.ListingWriteRequest;
import com.vpertz.listings.dto.PageResponse;
import java.text.Normalizer;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/** Regras de consulta da vitrine de anúncios. */
@Service
public class ListingService {

    private static final int MAX_SIZE = 60;
    private static final Set<String> MANAGEABLE_STATUS = Set.of("ativo", "pausado", "vendido");
    private static final Set<String> ADMIN_STATUS = Set.of("ativo", "pausado", "vendido", "removido");

    private final ListingRepository repository;
    private final ListingMapper mapper;

    public ListingService(ListingRepository repository, ListingMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Transactional(readOnly = true)
    public PageResponse<ListingResponse> list(ListingFilter filter, String sort, int page, int size) {
        Pageable pageable = PageRequest.of(
                Math.max(0, page - 1),
                Math.clamp(size, 1, MAX_SIZE),
                buildSort(sort, filter.moeda()));
        Page<Listing> result = repository.findAll(ListingSpecifications.fromFilter(filter), pageable);
        return PageResponse.from(result.map(mapper::toResponse));
    }

    @Transactional(readOnly = true)
    public ListingResponse getByPublicId(String publicId, AuthPrincipal principal) {
        Listing listing = repository.findByPublicId(publicId)
                .orElseThrow(() -> new ResourceNotFoundException("Anúncio não encontrado: " + publicId));
        boolean publicStatus = "ativo".equals(listing.getStatus()) || "vendido".equals(listing.getStatus());
        boolean owner = principal != null && listing.getSellerId() != null
                && listing.getSellerId().equals(principal.userId());
        boolean admin = principal != null && "ADMIN".equals(principal.role());
        if (!publicStatus && !owner && !admin) {
            throw new ResourceNotFoundException("Anúncio não encontrado: " + publicId);
        }
        return mapper.toResponse(listing);
    }

    /** Anúncios do usuário autenticado (qualquer status), para a tela "meus anúncios". */
    @Transactional(readOnly = true)
    public List<ListingResponse> listMine(String userId) {
        return repository.findBySellerIdOrderByCreatedAtDesc(userId).stream()
                .map(mapper::toResponse)
                .toList();
    }

    /** Todos os anúncios (qualquer status) no formato legado, para o espelho de config. */
    @Transactional(readOnly = true)
    public List<ListingResponse> allForConfig() {
        return repository.findAll(buildSort("recentes", null)).stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Transactional
    public ListingResponse create(ListingWriteRequest request, AuthPrincipal principal) {
        Listing listing = new Listing();
        listing.setPublicId(generatePublicId(request.titulo()));
        listing.setSellerId(principal.userId());
        listing.setVendedor(principal.username());
        listing.setCriadoEm(LocalDate.now());
        ListingSanitizer.apply(request, listing);
        applyDestaque(listing, request, principal);
        touch(listing);
        return mapper.toResponse(repository.save(listing));
    }

    @Transactional
    public ListingResponse update(String publicId, ListingWriteRequest request, AuthPrincipal principal) {
        Listing listing = repository.findByPublicId(publicId)
                .orElseThrow(() -> new ResourceNotFoundException("Anúncio não encontrado: " + publicId));
        authorize(listing, principal);
        // Dono, id público, data de criação e reputação são preservados.
        ListingSanitizer.apply(request, listing);
        applyDestaque(listing, request, principal);
        touch(listing);
        return mapper.toResponse(repository.save(listing));
    }

    @Transactional
    public ListingResponse updateStatus(String publicId, String status, AuthPrincipal principal) {
        Listing listing = repository.findByPublicId(publicId)
                .orElseThrow(() -> new ResourceNotFoundException("Anúncio não encontrado: " + publicId));
        authorize(listing, principal);
        if (!MANAGEABLE_STATUS.contains(status)) {
            throw new ValidationException("Status de anúncio inválido.");
        }
        listing.setStatus(status);
        touch(listing);
        return mapper.toResponse(repository.save(listing));
    }

    @Transactional
    public ListingResponse updateStatusAsAdmin(String publicId, String status, AuthPrincipal principal) {
        if (!"ADMIN".equals(principal.role())) {
            throw new AccessDeniedException("Apenas administradores podem moderar anúncios.");
        }
        if (!ADMIN_STATUS.contains(status)) {
            throw new ValidationException("Status de anúncio inválido.");
        }
        Listing listing = repository.findByPublicId(publicId)
                .orElseThrow(() -> new ResourceNotFoundException("Anúncio não encontrado: " + publicId));
        listing.setStatus(status);
        touch(listing);
        return mapper.toResponse(repository.save(listing));
    }

    @Transactional
    public void delete(String publicId, AuthPrincipal principal) {
        Listing listing = repository.findByPublicId(publicId)
                .orElseThrow(() -> new ResourceNotFoundException("Anúncio não encontrado: " + publicId));
        authorize(listing, principal);
        repository.delete(listing);
    }

    /** Só o dono ou um admin gerenciam o anúncio; legados (sem dono) só o admin. */
    private void authorize(Listing listing, AuthPrincipal principal) {
        boolean admin = "ADMIN".equals(principal.role());
        boolean owner = listing.getSellerId() != null && listing.getSellerId().equals(principal.userId());
        if (!admin && !owner) {
            throw new AccessDeniedException("Este anúncio não pertence à sua conta.");
        }
    }

    /** destaque é um selo do painel: só o admin pode alterá-lo. */
    private void applyDestaque(Listing listing, ListingWriteRequest request, AuthPrincipal principal) {
        if ("ADMIN".equals(principal.role()) && request.destaque() != null) {
            listing.setDestaque(request.destaque());
        }
    }

    private void touch(Listing listing) {
        listing.setUpdatedAt(OffsetDateTime.now());
    }

    private String generatePublicId(String titulo) {
        String base = slugify(titulo);
        if (base.isEmpty()) {
            base = "anuncio";
        }
        if (base.length() > 34) {
            base = base.substring(0, 34);
        }
        String candidate = base;
        while (repository.existsByPublicId(candidate)) {
            candidate = base + "-" + UUID.randomUUID().toString().substring(0, 5);
        }
        return candidate;
    }

    private static String slugify(String value) {
        String normalized = Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-+)|(-+$)", "");
        return normalized;
    }

    /**
     * Destaques sempre no topo; o critério escolhido desempata. Ao ordenar por
     * preço sem filtrar moeda, agrupa por moeda (reais primeiro) — reais e
     * diamonds não são comparáveis entre si.
     */
    private Sort buildSort(String sort, String moeda) {
        List<Sort.Order> orders = new ArrayList<>();
        orders.add(Sort.Order.desc("destaque"));
        boolean semMoeda = !StringUtils.hasText(moeda);
        switch (sort == null ? "recentes" : sort) {
            case "preco-asc" -> {
                if (semMoeda) {
                    orders.add(Sort.Order.asc("moeda"));
                }
                orders.add(Sort.Order.asc("preco"));
            }
            case "preco-desc" -> {
                if (semMoeda) {
                    orders.add(Sort.Order.asc("moeda"));
                }
                orders.add(Sort.Order.desc("preco"));
            }
            case "titulo" -> orders.add(Sort.Order.asc("titulo"));
            default -> {
                orders.add(Sort.Order.desc("criadoEm").nullsLast());
                orders.add(Sort.Order.desc("id"));
            }
        }
        return Sort.by(orders);
    }
}
