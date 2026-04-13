# Painel Eleitoral Brasil 2026 — TODO

## Banco de Dados
- [ ] Tabela `noticias` com campos: titulo, url (unique), fonte, data_publicacao, resumo, categoria
- [ ] Tabela `atualizacoes` com campos: tipo, descricao, qtd_inseridas, criado_em
- [ ] Charset utf8mb4 com collation utf8mb4_unicode_ci em todas as tabelas
- [ ] Deduplicação via INSERT IGNORE baseada na URL

## Backend
- [ ] Serviço RSS em `server/rss.ts` com feeds: Poder360, Folha, G1, CNN Brasil, Metrópoles, Veja, Exame, Gazeta do Povo
- [ ] Filtro duplo: termos de pesquisa/sondagem/instituto E termos eleitorais/cargos
- [ ] Endpoint tRPC `noticias.listar` com filtro por fonte e categoria
- [ ] Endpoint tRPC `noticias.buscarRSS` para disparar busca manual nos feeds
- [ ] Endpoint tRPC `noticias.ultimaAtualizacao` para exibir última sincronização
- [ ] Encoding UTF-8 na conexão MySQL (charset=utf8mb4)

## Frontend
- [ ] Layout dashboard com sidebar de navegação
- [ ] Página principal com cards de notícias
- [ ] Filtros por cargo: Presidente, Governador, Senado
- [ ] Filtros por fonte: todas as fontes configuradas
- [ ] Indicador visual da última atualização
- [ ] Botão de atualização manual dos feeds RSS
- [ ] Visual elegante com tipografia refinada e hierarquia visual

## GitHub
- [ ] Sincronização com repositório cantuariabruno-dot/painel-eleitoral-2026
- [ ] Configurar remote origin e fazer primeiro push
- [ ] Guia de uso do GitHub para o usuário

## Testes
- [ ] Vitest para endpoints tRPC de notícias
