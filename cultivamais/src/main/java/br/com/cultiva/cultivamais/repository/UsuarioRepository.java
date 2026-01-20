package br.com.cultiva.cultivamais.repository;

import java.util.List;
import java.util.Optional;

import br.com.cultiva.cultivamais.model.FuncaoUsuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import br.com.cultiva.cultivamais.model.Usuario;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByEmail(String email);
    List<Usuario> findByFuncao(FuncaoUsuario funcao);

}