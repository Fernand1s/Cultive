package br.com.cultiva.cultivamais.repository;

import br.com.cultiva.cultivamais.model.Notificacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NotificacaoRepository extends JpaRepository<Notificacao, Long> {
    List<Notificacao> findByUsuario_IdUsuarioOrderByDataHoraDesc(Long idUsuario);
    long countByUsuario_IdUsuarioAndLidaFalse(Long idUsuario);
}