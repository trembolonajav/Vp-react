package com.vpertz.listings;

import com.vpertz.listings.dto.ListingResponse;
import java.util.List;
import org.springframework.stereotype.Component;

/** Converte a entidade Listing no formato de anúncio esperado pelo frontend. */
@Component
public class ListingMapper {

    public ListingResponse toResponse(Listing l) {
        return new ListingResponse(
                l.getPublicId(),
                l.getTitulo(),
                nz(l.getGameId()),
                nz(l.getServidor()),
                nz(l.getCategoria()),
                nz(l.getTipo()),
                l.getIntencao(),
                l.getMoeda(),
                l.getPreco(),
                l.isNegociavel(),
                l.isDestaque(),
                l.getStatus(),
                nz(l.getImgUrl()),
                nz(l.getDescricao()),
                nz(l.getVendedor()),
                l.getCriadoEm() == null ? "" : l.getCriadoEm().toString(),
                l.getDex(),
                l.getNivel(),
                l.getPoder(),
                List.copyOf(l.getTipos()),
                l.isShiny(),
                l.getQuantidade(),
                l.isAceitaTroca(),
                nz(l.getNatureza()),
                nz(l.getHabilidade()),
                nz(l.getGenero()),
                nz(l.getForma()),
                l.getQualidade(),
                nz(l.getDisponibilidade()),
                l.getIvs() == null ? List.of() : List.copyOf(l.getIvs()),
                l.getMoves() == null ? List.of() : List.copyOf(l.getMoves()),
                nz(l.getRegras()),
                l.isVendedorVerificado(),
                l.isVendedorOnline(),
                l.getVendedorNota(),
                l.getVendedorVendas(),
                nz(l.getVendedorResposta()),
                nz(l.getVendedorAvatar()));
    }

    private static String nz(String value) {
        return value == null ? "" : value;
    }
}
