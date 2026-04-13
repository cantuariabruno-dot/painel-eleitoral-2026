# Painel Eleitoral Brasil 2026 — TODO

## Banco de Dados
- [x] Tabela `noticias` com campos: titulo, url (unique), fonte, data_publicacao, resumo, categoria
- [x] Tabela `atualizacoes` com campos: tipo, descricao, qtd_inseridas, criado_em
- [x] Charset utf8mb4 com collation utf8mb4_unicode_ci em todas as tabelas
- [x] Deduplicação via INSERT IGNORE baseada na URL

## Backend
- [x] Serviço RSS em `server/rss.ts` com feeds: Poder360, Folha, G1, CNN Brasil, Metrópoles, Veja, Exame, Gazeta do Povo
- [x] Filtro duplo: termos de pesquisa/sondagem/instituto E termos eleitorais/cargos
- [x] Endpoint tRPC `noticias.listar` com filtro por fonte e categoria
- [x] Endpoint tRPC `noticias.buscarRSS` para disparar busca manual nos feeds
- [x] Endpoint tRPC `noticias.ultimaAtualizacao` para exibir última sincronização
- [x] Encoding UTF-8 na conexão MySQL (charset=utf8mb4)

## Frontend
- [x] Layout dashboard com sidebar de navegação
- [x] Página principal com cards de notícias
- [x] Filtros por cargo: Presidente, Governador, Senado
- [x] Filtros por fonte: todas as fontes configuradas
- [x] Indicador visual da última atualização
- [x] Botão de atualização manual dos feeds RSS
- [x] Visual elegante com tipografia refinada e hierarquia visual

## GitHub
- [x] Sincronização com repositório cantuariabruno-dot/painel-eleitoral-2026
- [x] Configurar remote origin e fazer primeiro push
- [ ] Guia de uso do GitHub para o usuário

## Testes
- [x] Vitest para endpoints tRPC de notícias
