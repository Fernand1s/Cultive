package br.com.cultiva.cultivamais.security;

import org.springframework.stereotype.Component;

import java.util.Date;

/**
 * Controla a invalidação global de sessões (Logout Global).
 *
 * Como a autenticação é stateless (JWT), guardamos o instante em que um
 * administrador acionou o logout global. Qualquer token emitido ANTES desse
 * instante é considerado inválido pelo SecurityFilter, forçando o re-login.
 */
@Component
public class GlobalSessionRegistry {

    private volatile long invalidarTokensEmitidosAntesDe = 0L;

    /** Marca o momento atual como corte: todos os tokens já emitidos passam a ser inválidos. */
    public void invalidarTodasAsSessoes() {
        this.invalidarTokensEmitidosAntesDe = System.currentTimeMillis();
    }

    /** Indica se um token (pela sua data de emissão) deve ser recusado por logout global. */
    public boolean tokenInvalidado(Date emitidoEm) {
        return emitidoEm != null && emitidoEm.getTime() < invalidarTokensEmitidosAntesDe;
    }
}
