package com.gaio.calculadora.controller;

import com.gaio.calculadora.dto.EnderecoDetalhadoResponse;
import com.gaio.calculadora.dto.EnderecoSugestaoResponse;
import com.gaio.calculadora.service.GeocodingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/enderecos")
public class EnderecoController {

    private final GeocodingService geocodingService;

    public EnderecoController(GeocodingService geocodingService) {
        this.geocodingService = geocodingService;
    }

    @GetMapping("/autocomplete")
    public ResponseEntity<List<EnderecoSugestaoResponse>> autocomplete(@RequestParam String input) {
        return ResponseEntity.ok(geocodingService.autocomplete(input));
    }

    @GetMapping("/reverso")
    public ResponseEntity<EnderecoDetalhadoResponse> reverso(@RequestParam double lat, @RequestParam double lon) {
        return ResponseEntity.ok(geocodingService.reverso(lat, lon));
    }

    @GetMapping("/detalhes")
    public ResponseEntity<EnderecoDetalhadoResponse> detalhes(@RequestParam String placeId) {
        return ResponseEntity.ok(geocodingService.detalhes(placeId));
    }
}
