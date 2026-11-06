package com.gaio.calculadora.service;

import com.gaio.calculadora.dto.EstimativaRequest;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class DicasService {

    public List<String> gerarDicasFotos(EstimativaRequest request) {
        return gerarDicasFotos(request.quartos(), request.banheiros(), request.vagasGaragem());
    }

    public List<String> gerarDicasFotos(Integer quartos, Integer banheiros, Integer vagasGaragem) {
        List<String> dicas = new ArrayList<>();

        dicas.add("Tire ao menos 3 fotos da cozinha mostrando a área de preparo com boa iluminação.");
        dicas.add("Fotografe a sala em um ângulo que mostre a integração com outros ambientes.");

        if (quartos != null && quartos > 0) {
            dicas.add("Capture o quarto principal com a cama arrumada e luz natural.");
        }

        if (banheiros != null && banheiros > 0) {
            dicas.add("Inclua uma foto do banheiro em ângulo amplo, evitando reflexos no espelho.");
        }

        if (vagasGaragem != null && vagasGaragem > 0) {
            dicas.add("Registre a garagem vazia para destacar o espaço disponível.");
        }

        dicas.add("Evite fotos escuras ou tiradas contra a luz das janelas.");

        return dicas;
    }
}
