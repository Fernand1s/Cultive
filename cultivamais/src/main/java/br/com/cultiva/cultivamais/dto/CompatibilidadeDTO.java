package br.com.cultiva.cultivamais.dto;

public class CompatibilidadeDTO {
    private boolean compativel;
    private String mensagem;

    public CompatibilidadeDTO() {
    }

    public CompatibilidadeDTO(boolean compativel, String mensagem) {
        this.compativel = compativel;
        this.mensagem = mensagem;
    }

    public boolean isCompativel() {
        return compativel;
    }

    public void setCompativel(boolean compativel) {
        this.compativel = compativel;
    }

    public String getMensagem() {
        return mensagem;
    }

    public void setMensagem(String mensagem) {
        this.mensagem = mensagem;
    }
}
