package br.com.cultiva.cultivamais.repository;

import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.JpaRepository;

import br.com.cultiva.cultivamais.model.DoencaPraga;

import java.util.List;

@Repository
public interface DoencaPragaRepository extends JpaRepository<DoencaPraga, Long> {
    List<DoencaPraga> findByCultivo_IdCultivo(Long idCultivo);
}
