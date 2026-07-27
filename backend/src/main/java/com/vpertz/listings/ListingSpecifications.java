package com.vpertz.listings;

import com.vpertz.listings.dto.ListingFilter;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

/** Traduz {@link ListingFilter} em predicados JPA, espelhando o aplicarFiltros() do frontend. */
final class ListingSpecifications {

    private ListingSpecifications() {
    }

    static Specification<Listing> fromFilter(ListingFilter f) {
        return (root, queryBuilder, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (StringUtils.hasText(f.q())) {
                String like = "%" + f.q().trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("titulo")), like),
                        cb.like(cb.lower(cb.coalesce(root.get("descricao"), "")), like)));
            }
            eq(predicates, cb, root.get("tipo"), f.tipo());
            eq(predicates, cb, root.get("intencao"), f.intencao());
            eq(predicates, cb, root.get("moeda"), f.moeda());
            eq(predicates, cb, root.get("gameId"), f.jogo());
            eq(predicates, cb, root.get("categoria"), f.categoria());
            eq(predicates, cb, root.get("servidor"), f.servidor());
            eq(predicates, cb, root.get("status"), f.status());

            if (f.precoMin() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("preco"), f.precoMin()));
            }
            if (f.precoMax() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("preco"), f.precoMax()));
            }
            if (f.ivMin() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("ivTotal"), f.ivMin()));
            }
            if (f.ivMax() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("ivTotal"), f.ivMax()));
            }
            if (f.qualidadeMin() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("qualidade"), f.qualidadeMin()));
            }
            if (f.qualidadeMax() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("qualidade"), f.qualidadeMax()));
            }
            if (f.nivelMin() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("nivel"), f.nivelMin()));
            }
            if (f.nivelMax() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("nivel"), f.nivelMax()));
            }
            if (f.poderMin() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("poder"), f.poderMin()));
            }
            if (f.poderMax() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("poder"), f.poderMax()));
            }

            // Tipagem elementar: casa quando o anúncio tem ao menos um dos tipos
            // marcados. isMember gera EXISTS — seguro para paginação.
            if (f.tipos() != null && !f.tipos().isEmpty()) {
                Predicate[] anyType = f.tipos().stream()
                        .map(t -> cb.isMember(t, root.<List<String>>get("tipos")))
                        .toArray(Predicate[]::new);
                predicates.add(cb.or(anyType));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private static void eq(List<Predicate> predicates, jakarta.persistence.criteria.CriteriaBuilder cb,
                          jakarta.persistence.criteria.Path<String> path, String value) {
        if (StringUtils.hasText(value)) {
            predicates.add(cb.equal(path, value));
        }
    }
}
