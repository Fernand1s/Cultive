package br.com.cultiva.cultivamais.repository;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.JpaRepository;

import br.com.cultiva.cultivamais.model.Planta;

import java.util.List;

@Repository
public interface PlantaRepository extends JpaRepository<Planta, Long> {
    @EntityGraph(attributePaths = {"solosRecomendados"})
    List<Planta> findAll();
}
