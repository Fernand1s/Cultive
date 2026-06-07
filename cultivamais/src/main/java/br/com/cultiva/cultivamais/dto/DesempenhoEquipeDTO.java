package br.com.cultiva.cultivamais.dto;

public class DesempenhoEquipeDTO {
    private Long idUsuario;
    private String nomeUsuario;
    private String funcao;
    private Long tarefasConcluidas;
    private Long tarefasAtrasadas;
    private Long tarefasCanceladas;
    private Long tarefasPendentes;
    private Long tarefasTotal;
    private Double taxaConclusao;
    private Double tempoMedioResolucaoDias;

    public DesempenhoEquipeDTO() {}

    public DesempenhoEquipeDTO(Long idUsuario, String nomeUsuario, String funcao,
                                Long tarefasConcluidas, Long tarefasAtrasadas, Long tarefasCanceladas,
                                Long tarefasPendentes, Long tarefasTotal,
                                Double taxaConclusao, Double tempoMedioResolucaoDias) {
        this.idUsuario = idUsuario;
        this.nomeUsuario = nomeUsuario;
        this.funcao = funcao;
        this.tarefasConcluidas = tarefasConcluidas;
        this.tarefasAtrasadas = tarefasAtrasadas;
        this.tarefasCanceladas = tarefasCanceladas;
        this.tarefasPendentes = tarefasPendentes;
        this.tarefasTotal = tarefasTotal;
        this.taxaConclusao = taxaConclusao;
        this.tempoMedioResolucaoDias = tempoMedioResolucaoDias;
    }

    public Long getIdUsuario() { return idUsuario; }
    public void setIdUsuario(Long idUsuario) { this.idUsuario = idUsuario; }

    public String getNomeUsuario() { return nomeUsuario; }
    public void setNomeUsuario(String nomeUsuario) { this.nomeUsuario = nomeUsuario; }

    public String getFuncao() { return funcao; }
    public void setFuncao(String funcao) { this.funcao = funcao; }

    public Long getTarefasConcluidas() { return tarefasConcluidas; }
    public void setTarefasConcluidas(Long tarefasConcluidas) { this.tarefasConcluidas = tarefasConcluidas; }

    public Long getTarefasAtrasadas() { return tarefasAtrasadas; }
    public void setTarefasAtrasadas(Long tarefasAtrasadas) { this.tarefasAtrasadas = tarefasAtrasadas; }

    public Long getTarefasCanceladas() { return tarefasCanceladas; }
    public void setTarefasCanceladas(Long tarefasCanceladas) { this.tarefasCanceladas = tarefasCanceladas; }

    public Long getTarefasPendentes() { return tarefasPendentes; }
    public void setTarefasPendentes(Long tarefasPendentes) { this.tarefasPendentes = tarefasPendentes; }

    public Long getTarefasTotal() { return tarefasTotal; }
    public void setTarefasTotal(Long tarefasTotal) { this.tarefasTotal = tarefasTotal; }

    public Double getTaxaConclusao() { return taxaConclusao; }
    public void setTaxaConclusao(Double taxaConclusao) { this.taxaConclusao = taxaConclusao; }

    public Double getTempoMedioResolucaoDias() { return tempoMedioResolucaoDias; }
    public void setTempoMedioResolucaoDias(Double tempoMedioResolucaoDias) { this.tempoMedioResolucaoDias = tempoMedioResolucaoDias; }
}
