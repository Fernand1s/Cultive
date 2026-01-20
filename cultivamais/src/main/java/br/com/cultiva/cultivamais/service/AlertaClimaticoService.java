package br.com.cultiva.cultivamais.service;

import br.com.cultiva.cultivamais.model.AreaCultivo;
import br.com.cultiva.cultivamais.model.FuncaoUsuario;
import br.com.cultiva.cultivamais.model.Usuario;
import br.com.cultiva.cultivamais.repository.AreaCultivoRepository;
import br.com.cultiva.cultivamais.repository.UsuarioRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AlertaClimaticoService {

    private final AreaCultivoRepository areaCultivoRepository;
    private final GeolocalizacaoService geolocalizacaoService;
    private final NotificacaoService notificacaoService;
    private final UsuarioRepository usuarioRepository;

    public AlertaClimaticoService(AreaCultivoRepository areaCultivoRepository,
                                  GeolocalizacaoService geolocalizacaoService,
                                  NotificacaoService notificacaoService,
                                  UsuarioRepository usuarioRepository) {
        this.areaCultivoRepository = areaCultivoRepository;
        this.geolocalizacaoService = geolocalizacaoService;
        this.notificacaoService = notificacaoService;
        this.usuarioRepository = usuarioRepository;
    }

    // FUNÇÃO: VERIFICAÇÃO AGENDADA (Executa diariamente às 07:00 da manhã)
    @Scheduled(cron = "0 0 7 * * *")
    public void verificarCondicoesClimaticas() {
        List<AreaCultivo> areas = areaCultivoRepository.findAll();
        List<Usuario> admins = usuarioRepository.findByFuncao(FuncaoUsuario.ADMINISTRADOR);

        for (AreaCultivo area : areas) {
            try {
                // Obtém dados da API externa via serviço de geolocalização
                GeolocalizacaoService.DadosSolares dados = geolocalizacaoService.buscarDadosExternos(area.getIdArea());

                // Regra de Negócio: Alerta de Umidade (Seca)
                if (dados.umidadeMedia < 40.0) {
                    criarAlertaParaAdmins(admins,
                            "Alerta de Seca: " + area.getNomeArea(),
                            "A umidade média recente está crítica (" + dados.umidadeMedia + "%). Reforce a irrigação."
                    );
                }

                // Regra de Negócio: Alerta de Baixa Luminosidade
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

    // FUNÇÃO: DISPARO DE NOTIFICAÇÃO PARA ADMINISTRADORES
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