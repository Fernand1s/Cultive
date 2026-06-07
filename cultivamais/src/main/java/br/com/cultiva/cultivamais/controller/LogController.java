package br.com.cultiva.cultivamais.controller;

import br.com.cultiva.cultivamais.dto.LogResponseDTO;
import br.com.cultiva.cultivamais.model.Usuario;
import br.com.cultiva.cultivamais.repository.UsuarioRepository;
import br.com.cultiva.cultivamais.service.LogService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/logs")
public class LogController {

    private final LogService logService;
    private final UsuarioRepository usuarioRepository;

    public LogController(LogService logService, UsuarioRepository usuarioRepository) {
        this.logService = logService;
        this.usuarioRepository = usuarioRepository;
    }

    @GetMapping
    public ResponseEntity<List<LogResponseDTO>> listarLogs() {
        try {
            List<LogResponseDTO> logs = logService.listarTodosDTO();
            return ResponseEntity.ok(logs);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping
    public ResponseEntity<Void> registrarLog(@RequestBody Map<String, Object> payload) {
        try {
            String acao = (String) payload.getOrDefault("acao", "");
            String detalhes = (String) payload.getOrDefault("detalhes", "");
            Object usuarioIdRaw = payload.get("usuarioId");

            String nomeUsuario = "Sistema";
            if (usuarioIdRaw != null) {
                Long usuarioId = Long.valueOf(usuarioIdRaw.toString());
                nomeUsuario = usuarioRepository.findById(usuarioId)
                        .map(Usuario::getNomeUsuario)
                        .orElse("ID:" + usuarioId);
            }

            logService.registrarLog(nomeUsuario, acao + (detalhes.isBlank() ? "" : ": " + detalhes));
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}