package br.com.cultiva.cultivamais.service;

import br.com.cultiva.cultivamais.model.Usuario;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import java.util.Date;

@Service
public class JwtService {
    // Chave Secreta para assinatura do Token
    private static final String SECRET_KEY = "ProjetoCultivaMais_Sustentavel_2026_Seguranca_Total";

    // FUNÇÃO: GERAÇÃO DO TOKEN JWT
    public String generateToken(Usuario usuario) {
        return Jwts.builder()
                .setSubject(usuario.getEmail()) // Identificador principal
                .claim("id", usuario.getIdUsuario()) // Payload: ID do usuário
                .claim("funcao", usuario.getFuncao().toString()) // Payload: Permissão do usuário
                .setIssuedAt(new Date()) // Data de emissão
                .setExpiration(new Date(System.currentTimeMillis() + 86400000)) // Expiração (24 horas)
                .signWith(Keys.hmacShaKeyFor(SECRET_KEY.getBytes()), SignatureAlgorithm.HS256) // Assinatura HS256
                .compact();
    }
}