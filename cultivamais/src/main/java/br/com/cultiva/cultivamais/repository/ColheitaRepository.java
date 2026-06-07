package br.com.cultiva.cultivamais.repository;

import br.com.cultiva.cultivamais.model.Colheita;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ColheitaRepository extends JpaRepository<Colheita, Long> {
    List<Colheita> findByCultivo_IdCultivoOrderByDataHoraDesc(Long idCultivo);
}
