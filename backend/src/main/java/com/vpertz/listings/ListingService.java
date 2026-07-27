package com.vpertz.listings;

import com.vpertz.common.exception.ResourceNotFoundException;
import com.vpertz.listings.dto.ListingFilter;
import com.vpertz.listings.dto.ListingResponse;
import com.vpertz.listings.dto.PageResponse;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/** Regras de consulta da vitrine de anúncios. */
@Service
public class ListingService {

    private static final int MAX_SIZE = 60;

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
    public ListingResponse getByPublicId(String publicId) {
        return repository.findByPublicId(publicId)
                .map(mapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Anúncio não encontrado: " + publicId));
    }

    /** Todos os anúncios (qualquer status) no formato legado, para o espelho de config. */
    @Transactional(readOnly = true)
    public List<ListingResponse> allForConfig() {
        return repository.findAll(buildSort("recentes", null)).stream()
                .map(mapper::toResponse)
                .toList();
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
