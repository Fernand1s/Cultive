package br.com.cultiva.cultivamais.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import br.com.cultiva.cultivamais.model.Tarefa;

@Repository
public interface TarefaRepository extends JpaRepository<Tarefa, Long> {
    List<Tarefa> findByResponsavelIdUsuario(Long idUsuario);
    List<Tarefa> findByResponsavel_IdUsuarioOrCriador_IdUsuario(Long idResponsavel, Long idCriador);

    @Modifying
    @Query("UPDATE Tarefa t SET t.criador = null WHERE t.criador.idUsuario = :idUsuario")
    void desvincularCriador(@Param("idUsuario") Long idUsuario);
}