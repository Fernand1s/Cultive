package br.com.cultiva.cultivamais.repository;

import br.com.cultiva.cultivamais.model.Estoque;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EstoqueRepository extends JpaRepository<Estoque, Long> {
    List<Estoque> findByCategoria(String categoria);
    List<Estoque> findByOrderByNomeAsc();
}
