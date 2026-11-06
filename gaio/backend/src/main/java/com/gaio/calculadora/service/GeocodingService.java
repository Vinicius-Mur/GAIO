package com.gaio.calculadora.service;

import com.gaio.calculadora.dto.EnderecoDetalhadoResponse;
import com.gaio.calculadora.dto.EnderecoSugestaoResponse;
import com.gaio.calculadora.exception.ExternalServiceException;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;

@Service
public class GeocodingService {

    // Retangulo da cidade de Sao Paulo (lon,lat): a busca fica restrita a area coberta pelo modelo.
    private static final String AREA_SAO_PAULO = "-46.83,-23.35,-46.36,-24.01";

    private final WebClient nominatimWebClient;

    public GeocodingService(WebClient nominatimWebClient) {
        this.nominatimWebClient = nominatimWebClient;
    }

    public List<EnderecoSugestaoResponse> autocomplete(String input) {
        try {
            List<EnderecoSugestaoResponse> sugestoes = buscarSugestoes(input);
            // O OpenStreetMap tem poucos numeros de imovel em SP: sem resultado, tenta so a rua.
            String semNumero = removerNumero(input);
            if (sugestoes.isEmpty() && !semNumero.equals(input.trim()) && !semNumero.isBlank()) {
                sugestoes = buscarSugestoes(semNumero);
            }
            return sugestoes;
        } catch (Exception e) {
            throw new ExternalServiceException("Falha ao buscar sugestões de endereço", e);
        }
    }

    @SuppressWarnings("unchecked")
    private List<EnderecoSugestaoResponse> buscarSugestoes(String texto) {
        List<Map<String, Object>> resultados = nominatimWebClient.get()
                .uri(uriBuilder -> uriBuilder.path("/search")
                        .queryParam("q", texto)
                        .queryParam("format", "jsonv2")
                        .queryParam("countrycodes", "br")
                        .queryParam("viewbox", AREA_SAO_PAULO)
                        .queryParam("bounded", 1)
                        .queryParam("limit", 8)
                        .build())
                .retrieve()
                .bodyToMono(List.class)
                .block();

        if (resultados == null) {
            return List.of();
        }
        return resultados.stream()
                .map(r -> new EnderecoSugestaoResponse(
                        montarPlaceId((String) r.get("osm_type"), r.get("osm_id")),
                        (String) r.get("display_name")))
                .toList();
    }

    static String removerNumero(String texto) {
        return texto.replaceAll("(?i)\\b(n[º°o.]?\\s*)?\\d+[a-z]?\\b", " ")
                .replaceAll("\\s*,\\s*,", ",")
                .replaceAll("\\s{2,}", " ")
                .replaceAll("[\\s,]+$", "")
                .trim();
    }

    public EnderecoDetalhadoResponse detalhes(String placeId) {
        try {
            return paraDetalhes(buscarPorOsmId(placeId));
        } catch (Exception e) {
            throw new ExternalServiceException("Falha ao obter detalhes do endereço", e);
        }
    }

    @SuppressWarnings("unchecked")
    public EnderecoDetalhadoResponse reverso(double latitude, double longitude) {
        try {
            Map<String, Object> resultado = nominatimWebClient.get()
                    .uri(uriBuilder -> uriBuilder.path("/reverse")
                            .queryParam("lat", latitude)
                            .queryParam("lon", longitude)
                            .queryParam("format", "jsonv2")
                            .queryParam("addressdetails", 1)
                            .queryParam("zoom", 18)
                            .build())
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (resultado == null || resultado.containsKey("error")) {
                throw new ExternalServiceException("Nenhum endereço encontrado neste ponto", null);
            }
            return paraDetalhes(resultado);
        } catch (ExternalServiceException e) {
            throw e;
        } catch (Exception e) {
            throw new ExternalServiceException("Falha ao identificar o endereço do ponto", e);
        }
    }

    @SuppressWarnings("unchecked")
    private EnderecoDetalhadoResponse paraDetalhes(Map<String, Object> resultado) {
        Map<String, Object> address = (Map<String, Object>) resultado.getOrDefault("address", Map.of());
        return new EnderecoDetalhadoResponse(
                (String) resultado.get("display_name"),
                primeiroNaoNulo(address, "road", "pedestrian", "street"),
                primeiroNaoNulo(address, "suburb", "neighbourhood", "quarter"),
                primeiroNaoNulo(address, "city", "town", "municipality"),
                primeiroNaoNulo(address, "state"),
                primeiroNaoNulo(address, "postcode"),
                parseDouble(resultado.get("lat")),
                parseDouble(resultado.get("lon"))
        );
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> buscarPorOsmId(String placeId) {
        String osmIds = placeId.toUpperCase();

        List<Map<String, Object>> resultados = nominatimWebClient.get()
                .uri(uriBuilder -> uriBuilder.path("/lookup")
                        .queryParam("osm_ids", osmIds)
                        .queryParam("format", "jsonv2")
                        .queryParam("addressdetails", 1)
                        .build())
                .retrieve()
                .bodyToMono(List.class)
                .block();

        if (resultados == null || resultados.isEmpty()) {
            throw new ExternalServiceException("Endereço não encontrado", null);
        }
        return resultados.get(0);
    }

    private String montarPlaceId(String osmType, Object osmId) {
        String prefixo = switch (osmType) {
            case "node" -> "N";
            case "way" -> "W";
            case "relation" -> "R";
            default -> "N";
        };
        return prefixo + osmId;
    }

    private String primeiroNaoNulo(Map<String, Object> mapa, String... chaves) {
        for (String chave : chaves) {
            Object valor = mapa.get(chave);
            if (valor != null) {
                return (String) valor;
            }
        }
        return null;
    }

    private Double parseDouble(Object valor) {
        if (valor == null) {
            return null;
        }
        return Double.parseDouble((String) valor);
    }
}
