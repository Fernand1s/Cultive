package br.com.cultiva.cultivamais.service;

import br.com.cultiva.cultivamais.exception.ResourceNotFoundException;
import br.com.cultiva.cultivamais.model.AreaCultivo;
import br.com.cultiva.cultivamais.repository.AreaCultivoRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.micrometer.common.lang.NonNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Iterator;

@Service
public class GeolocalizacaoService {

    private final AreaCultivoRepository areaCultivoRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper mapper;

    @Autowired
    public GeolocalizacaoService(AreaCultivoRepository areaCultivoRepository) {
        this.areaCultivoRepository = areaCultivoRepository;
        this.restTemplate = new RestTemplate();
        this.mapper = new ObjectMapper();
    }

    // INNER CLASS: ESTRUTURA DE DADOS PARA RETORNO CLIMÁTICO
    public static class DadosSolares {
        public double incidenciaSolarMedia;
        public double umidadeMedia;
    }

    // FUNÇÃO: BUSCAR DADOS NA API DA NASA POWER
    public DadosSolares buscarDadosExternos(@NonNull Long idAreaCultivo) {
        AreaCultivo area = areaCultivoRepository.findById(idAreaCultivo)
                .orElseThrow(() -> new ResourceNotFoundException("Área não encontrada com ID: " + idAreaCultivo));

        Double latRaw = area.getLatitudeArea();
        Double lonRaw = area.getLongitudeArea();

        double lat = (latRaw != null) ? latRaw : 0.0;
        double lon = (lonRaw != null) ? lonRaw : 0.0;

        LocalDate hoje = LocalDate.now();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMdd");

        // Define janela de 7 dias (NASA possui atraso de processamento de alguns dias)
        String start = hoje.minusDays(10).format(formatter);
        String end = hoje.minusDays(3).format(formatter);

        String url = String.format(
                "https://power.larc.nasa.gov/api/temporal/daily/point?parameters=ALLSKY_SFC_SW_DWN,RH2M&community=AG&longitude=%s&latitude=%s&start=%s&end=%s&format=JSON",
                lon, lat, start, end
        );

        try {
            String jsonResponse = restTemplate.getForObject(url, String.class);
            JsonNode root = mapper.readTree(jsonResponse);
            JsonNode parameters = root.path("properties").path("parameter");

            if (parameters.isMissingNode()) {
                throw new RuntimeException("Dados meteorológicos não disponíveis no JSON da NASA");
            }

            DadosSolares dados = new DadosSolares();
            // ALLSKY_SFC_SW_DWN = Radiação Solar / RH2M = Umidade Relativa a 2 metros
            dados.incidenciaSolarMedia = formatar(calcularMediaDoJson(parameters.path("ALLSKY_SFC_SW_DWN")), 2);
            dados.umidadeMedia = formatar(calcularMediaDoJson(parameters.path("RH2M")), 1);

            return dados;
        } catch (Exception e) {
            System.err.println("Erro ao acessar API NASA POWER: " + e.getMessage());
            DadosSolares dadosFallback = new DadosSolares();
            dadosFallback.incidenciaSolarMedia = 5.2;
            dadosFallback.umidadeMedia = 65.0;
            return dadosFallback;
        }
    }

    // CALCULAR MÉDIA DOS VALORES NO JSON (Ignora valores de erro -999)
    private double calcularMediaDoJson(JsonNode nodeDatas) {
        if (nodeDatas == null || nodeDatas.isMissingNode() || !nodeDatas.isObject()) {
            return 0.0;
        }

        double soma = 0.0;
        int conta = 0;

        Iterator<JsonNode> elements = nodeDatas.elements();
        while (elements.hasNext()) {
            double valor = elements.next().asDouble();
            if (valor > -900) {
                soma += valor;
                conta++;
            }
        }
        return conta > 0 ? soma / conta : 0.0;
    }

    // FUNÇÃO: FORMATAÇÃO NUMÉRICA (Casas decimais)
    private double formatar(double valor, int casas) {
        double escala = Math.pow(10, casas);
        return Math.round(valor * escala) / escala;
    }
}