package br.com.cultiva.cultivamais.service;

import br.com.cultiva.cultivamais.model.AreaCultivo;
import br.com.cultiva.cultivamais.model.FuncaoUsuario;
import br.com.cultiva.cultivamais.model.Usuario;
import br.com.cultiva.cultivamais.repository.AreaCultivoRepository;
import br.com.cultiva.cultivamais.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AlertaClimaticoService {

    @Autowired
    private AreaCultivoRepository areaCultivoRepository;

    @Autowired
    private GeolocalizacaoService geolocalizacaoService;

    @Autowired
    private NotificacaoService notificacaoService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Scheduled(cron = "0 0 7 * * *")
    public void verificarCondicoesClimaticas() {
        System.out.println(">>> Iniciando verificação climática automática...");

        List<AreaCultivo> areas = areaCultivoRepository.findAll();
        List<Usuario> admins = usuarioRepository.findByFuncao(FuncaoUsuario.ADMINISTRADOR);

        for (AreaCultivo area : areas) {
            try {
                GeolocalizacaoService.DadosSolares dados = geolocalizacaoService.buscarDadosExternos(area.getIdArea());

                if (dados.umidadeMedia < 40.0) {
                    criarAlertaParaAdmins(admins,
                            "Alerta de Seca: " + area.getNomeArea(),
                            "A umidade média recente está crítica (" + dados.umidadeMedia + "%). Reforce a irrigação."
                    );
                }

                if (dados.incidenciaSolarMedia < 3.0) {
                    criarAlertaParaAdmins(admins,
                            "Baixa Luminosidade: " + area.getNomeArea(),
                            "Incidência solar média baixa (" + dados.incidenciaSolarMedia + "). Monitore o desenvolvimento."
                    );
                }

            } catch (Exception e) {
                System.err.println("Erro ao verificar clima da área " + area.getNomeArea());
            }
        }
    }

    private void criarAlertaParaAdmins(List<Usuario> admins, String titulo, String mensagem) {
        for (Usuario admin : admins) {
            notificacaoService.criarNotificacao(
                    admin.getIdUsuario(),
                    titulo,
                    mensagem,
                    "alerta"
            );
        }
    }
}