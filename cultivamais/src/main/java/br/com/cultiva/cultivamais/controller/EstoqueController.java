package br.com.cultiva.cultivamais.controller;

import br.com.cultiva.cultivamais.dto.EstoqueDTO;
import br.com.cultiva.cultivamais.service.EstoqueService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/estoque")
public class EstoqueController {

    private final EstoqueService estoqueService;

    public EstoqueController(EstoqueService estoqueService) {
        this.estoqueService = estoqueService;
    }

    @GetMapping
    public ResponseEntity<List<EstoqueDTO>> listar() {
        return ResponseEntity.ok(estoqueService.listar());
    }

    @PostMapping
    public ResponseEntity<EstoqueDTO> criar(@RequestBody EstoqueDTO dto) {
        return ResponseEntity.ok(estoqueService.criar(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EstoqueDTO> atualizar(@PathVariable Long id, @RequestBody EstoqueDTO dto) {
        return ResponseEntity.ok(estoqueService.atualizar(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        estoqueService.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
