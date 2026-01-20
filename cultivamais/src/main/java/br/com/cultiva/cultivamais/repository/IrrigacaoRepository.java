package br.com.cultiva.cultivamais.repository;

import br.com.cultiva.cultivamais.dto.ConsumoAguaDTO;
import br.com.cultiva.cultivamais.model.Irrigacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IrrigacaoRepository extends JpaRepository<Irrigacao, Long> {

    @Query("SELECT new br.com.cultiva.cultivamais.dto.ConsumoAguaDTO(" +
            "i.cultivo.idCultivo, " +
            "i.cultivo.plantaCultivada.nomePopular, " +
            "SUM(i.volumeAgua)) " +
            "FROM Irrigacao i " +
            "WHERE i.cultivo.idCultivo = :idCultivo " +
            "GROUP BY i.cultivo.idCultivo, i.cultivo.plantaCultivada.nomePopular")
    ConsumoAguaDTO calcularConsumoPorCultivo(@Param("idCultivo") Long idCultivo);

    List<Irrigacao> findByCultivo_IdCultivo(Long idCultivo);
}