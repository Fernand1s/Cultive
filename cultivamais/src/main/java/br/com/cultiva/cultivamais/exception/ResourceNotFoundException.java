package br.com.cultiva.cultivamais.exception;

import java.io.Serial;

// Esta classe representa o erro "Não Encontrado" personalizado
public class ResourceNotFoundException extends RuntimeException {
    
    @Serial
    private static final long serialVersionUID = 1L;

    public ResourceNotFoundException(String mensagem) {
        super(mensagem);
    }
}