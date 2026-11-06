package com.gaio.calculadora.service;

import com.gaio.calculadora.domain.CategoriaImovel;
import com.gaio.calculadora.domain.Estimativa;
import com.gaio.calculadora.domain.TipoImovel;
import org.springframework.stereotype.Service;

import java.text.NumberFormat;
import java.util.Locale;

@Service
public class AnuncioDescricaoService {

    private record Substantivo(String texto, boolean feminino) {
    }

    public String gerarTitulo(Estimativa estimativa, String bairro) {
        return "%s com %d quarto%s %s".formatted(
                substantivo(estimativa).texto(),
                estimativa.getQuartos(),
                estimativa.getQuartos() == 1 ? "" : "s",
                local(bairro)
        );
    }

    public String gerarDescricao(Estimativa estimativa, String bairro, String enderecoCompleto) {
        NumberFormat formatoMoeda = NumberFormat.getCurrencyInstance(new Locale("pt", "BR"));
        Substantivo substantivo = substantivo(estimativa);

        StringBuilder descricao = new StringBuilder();
        descricao.append(substantivo.texto())
                .append(substantivo.feminino() ? " localizada " : " localizado ")
                .append(local(bairro));
        if (enderecoCompleto != null && !enderecoCompleto.isBlank() && !enderecoCompleto.trim().equalsIgnoreCase(bairro.trim())) {
            descricao.append(", ").append(enderecoCompleto.trim());
        }
        descricao.append(". ");

        descricao.append("Possui ").append(estimativa.getAreaM2().intValue()).append(" m² de área útil, ")
                .append(estimativa.getQuartos()).append(pluraliza(" quarto", estimativa.getQuartos())).append(", ")
                .append(estimativa.getBanheiros()).append(pluraliza(" banheiro", estimativa.getBanheiros()));

        if (estimativa.getVagasGaragem() != null && estimativa.getVagasGaragem() > 0) {
            descricao.append(" e ").append(estimativa.getVagasGaragem())
                    .append(pluraliza(" vaga", estimativa.getVagasGaragem())).append(" de garagem");
        }
        descricao.append(". ");

        if (estimativa.getCondominio() != null && estimativa.getCondominio() > 0) {
            descricao.append("Condomínio de ").append(formatoMoeda.format(estimativa.getCondominio())).append(". ");
        }

        descricao.append("Valor estimado: ").append(formatoMoeda.format(estimativa.getValorEstimado())).append(". ");
        descricao.append("Agende uma visita e conheça esta oportunidade.");

        return descricao.toString();
    }

    // O anuncio guarda o bairro (obrigatorio), entao o local e sempre "no bairro X".
    private String local(String bairro) {
        return "no bairro " + bairro.trim();
    }

    private Substantivo substantivo(Estimativa estimativa) {
        TipoImovel tipo = estimativa.getTipo();
        if (tipo != null) {
            switch (tipo) {
                case COBERTURA -> {
                    return new Substantivo("Cobertura", true);
                }
                case KITNET -> {
                    return new Substantivo("Kitnet", true);
                }
                case LOFT -> {
                    return new Substantivo("Loft", false);
                }
                case DUPLEX_OU_TRIPLEX -> {
                    return new Substantivo("Duplex", false);
                }
                case CASA_DE_VILA -> {
                    return new Substantivo("Casa de vila", true);
                }
                case CASA_DE_CONDOMINIO -> {
                    return new Substantivo("Casa em condomínio", true);
                }
                default -> {
                    // PADRAO cai no fallback por categoria abaixo
                }
            }
        }

        CategoriaImovel categoria = estimativa.getCategoria();
        if (categoria == CategoriaImovel.CASAS) {
            return new Substantivo("Casa", true);
        }
        if (categoria == CategoriaImovel.APARTAMENTOS) {
            return new Substantivo("Apartamento", false);
        }
        return new Substantivo("Imóvel", false);
    }

    private String pluraliza(String singular, Integer quantidade) {
        return (quantidade != null && quantidade == 1) ? singular : singular + "s";
    }
}
