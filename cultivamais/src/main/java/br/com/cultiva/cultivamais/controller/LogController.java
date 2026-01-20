package br.com.cultiva.cultivamais.controller;

import br.com.cultiva.cultivamais.dto.LogResponseDTO;
import br.com.cultiva.cultivamais.service.LogService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/logs")
public class LogController {

    private final LogService logService;

    public LogController(LogService logService) {
        this.logService = logService;
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
}