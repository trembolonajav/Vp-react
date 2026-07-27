package com.vpertz.config.dto;

/** Espelha um contato no formato consumido pelo frontend atual. */
public record ContactDto(String icone, String nome, String info, String url) {
}
