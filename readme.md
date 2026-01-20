# 🌿 Cultiva+ API
**Plataforma de Gestão Agrícola Inteligente**

O **Cultiva+** é uma solução robusta para o monitoramento de ciclos produtivos, automação de tarefas e análise de dados agrícolas. Desenvolvida com foco em escalabilidade e segurança, a API atende desde o manejo familiar até operações complexas de agronegócio.

---

## 🚀 Funcionalidades Principais
* **Gestão de Áreas e Clima:** Cadastro de talhões com integração de dados meteorológicos por coordenada.
* **Ciclo de Cultivo:** Controle completo do plantio, desenvolvimento e colheita por variedade.
* **Manejo de Eventos:** Registro especializado de irrigações e controle de pragas/doenças.
* **Fluxo de Tarefas:** Gestão operacional com atribuição de responsabilidades, prazos e prioridades.
* **Notificações Inteligentes:** Alertas de manejo e sistema de leitura em massa para operadores.
* **Auditoria Computacional:** Rastreabilidade total via Logs de sistema (exclusivo para administradores).

---

## 🛠️ Stack Tecnológica
* **Linguagem:** Java 21 (LTS)
* **Framework:** Spring Boot 3.4.2
* **Segurança:** Spring Security + JWT (JSON Web Token)
* **Banco de Dados:** * **H2 Database:** Desenvolvimento (Persistência em arquivo `./data/cultiva_db`).
    * **PostgreSQL 16+:** Suporte nativo para ambiente de produção.
* **Documentação:** OpenAPI 3.1 (Swagger UI)
* **Persistência:** Spring Data JPA / Hibernate

---

## 🛡️ Segurança e Compliance (Enterprise Ready)
A API foi blindada contra vulnerabilidades críticas detectadas via análise de composição de software (SCA):
* **CVE-2025-41242:** Proteção contra Path Traversal via Spring Framework 6.2.10.
* **CVE-2025-49146:** Conexão segura de banco de dados via PostgreSQL Driver 42.7.7.
* **RBAC:** Controle de acesso baseado em funções (ADMIN, GERENTE, OPERADOR).

---

## 📋 Catálogo de Endpoints (Destaques)
A documentação interativa completa pode ser acessada em: `http://localhost:8090/swagger-ui.html`

### 🔐 Segurança e Usuários
| Método |            Endpoint             |                   Função                   |
|:------:|:-------------------------------:|:------------------------------------------:|
|  POST  |      `/api/usuarios/login`      |    Autenticação e emissão de Token JWT     |
|  POST  | `/api/usuarios/redefinir-senha` |       Fluxo de recuperação de conta        |
|  GET   |           `/api/logs`           | Auditoria de ações críticas (Requer ADMIN) |

### 🚜 Gestão Operacional e Clima
|Método |             Endpoint             |                    Função                     |
|:-----:|:--------------------------------:|:---------------------------------------------:|
|  GET  |     `/api/areas/{id}/clima`      | Consulta meteorológica baseada na localização |
| POST  |    `/api/eventos/praga/{id}`     |     Registro de ocorrência fitossanitária     |
| PATCH |   `/api/tarefas/{id}/concluir`   |  Atualização de status de atividade no campo  |
|  GET  | `/api/notificacoes/usuario/{id}` |    Feed de alertas do usuário autenticado     |

### 📊 Relatórios e Inteligência
|Método |             Endpoint              |                    Função                     |
|:-----:|:---------------------------------:|:---------------------------------------------:|
|  GET  | `/api/relatorios/compatibilidade` | Validação de planta ideal para o tipo de solo |
|  GET  |    `/api/relatorios/agua/{id}`    |    Histórico detalhado de consumo hídrico     |
|  GET  |  `/api/relatorios/colheita/{id}`  |    Projeções e resultados de produtividade    |

---

## ⚙️ Configuração do Ambiente

### Pré-requisitos
* Java 21 (JDK)
* Maven 3.9+

### Execução Local
1. **Compilar e gerar o artefato:**
   ```bash
   mvn clean install


2. **Iniciar a aplicação:**
   ```bash
   mvn spring-boot:run

## 👥 Arquitetura de Acesso

O sistema utiliza o modelo Role-Based Access Control (RBAC):

    ADMINISTRADOR: Gestão de usuários, e acesso a logs de auditoria.

    GERENTE/OPERADOR: Manejo de áreas, catálogo de plantas, registro de cultivos, tarefas e consulta de relatórios.


© 2026 Cultiva+ - Projeto desenvolvido para o IFBA.