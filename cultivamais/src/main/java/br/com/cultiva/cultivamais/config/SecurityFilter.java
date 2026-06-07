package br.com.cultiva.cultivamais.config;

import br.com.cultiva.cultivamais.multitenant.TenantContext;
import br.com.cultiva.cultivamais.repository.UsuarioRepository;
import br.com.cultiva.cultivamais.security.GlobalSessionRegistry;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
public class SecurityFilter extends OncePerRequestFilter {

    private final UsuarioRepository usuarioRepository;
    private final GlobalSessionRegistry globalSessionRegistry;

    private static final String SECRET_KEY = "ProjetoCultivaMais_Sustentavel_2026_Seguranca_Total";

    public SecurityFilter(UsuarioRepository usuarioRepository, GlobalSessionRegistry globalSessionRegistry) {
        this.usuarioRepository = usuarioRepository;
        this.globalSessionRegistry = globalSessionRegistry;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        try {
            var token = recuperarToken(request);
            if (token != null) {
                try {
                    Claims claims = Jwts.parserBuilder()
                            .setSigningKey(Keys.hmacShaKeyFor(SECRET_KEY.getBytes()))
                            .build()
                            .parseClaimsJws(token)
                            .getBody();

                    // Logout Global: recusa tokens emitidos antes do corte de invalidação
                    if (globalSessionRegistry.tokenInvalidado(claims.getIssuedAt())) {
                        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                        return;
                    }

                    String tenantSchema = claims.get("tenantSchema", String.class);
                    if (tenantSchema != null && !tenantSchema.isBlank()) {
                        TenantContext.setCurrentTenant(tenantSchema);
                    }

                    String email = claims.getSubject();
                    var usuario = usuarioRepository.findByEmail(email).orElse(null);

                    if (usuario != null) {
                        var authorities = Collections.singletonList(
                                new SimpleGrantedAuthority("ROLE_" + usuario.getFuncao().name())
                        );
                        var authentication = new UsernamePasswordAuthenticationToken(usuario, null, authorities);
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                    }
                } catch (Exception e) {
                    System.out.println("Erro ao validar token: " + e.getMessage());
                }
            }
            filterChain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }

    private String recuperarToken(HttpServletRequest request) {
        var authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return null;
        return authHeader.replace("Bearer ", "");
    }
}