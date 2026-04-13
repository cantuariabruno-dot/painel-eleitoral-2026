# Painel Eleitoral Brasil 2026 — TODO

## Arquitetura Central (Mapa de Previsão)
- [x] Tabela `candidatos` (id, nome, partido, cargo, foto_url, cor_hex)
- [x] Tabela `pesquisas` (id, instituto, data, cargo, fonte_url)
- [x] Tabela `intencoes_voto` (pesquisa_id, candidato_id, percentual, turno)
- [x] Tabela `previsoes_estado` (estado_uf, cargo, candidato_id_lider, percentual_lider, data_atualizacao)
- [x] Tabela `senado_cadeiras` (id, estado_uf, senador_nome, partido, mandato_fim, status: atual|previsto|vaga)
- [x] Tabela `noticias` (id, titulo, url unique, fonte, data_publicacao, resumo, categoria)
- [x] Tabela `atualizacoes` (id, tipo, descricao, qtd_inseridas, criado_em)

## Navegação (Mobile-First, sem bipartição)
- [x] Layout de página única com nav bar no topo (mobile) e sidebar colapsável (desktop)
- [x] Rota `/` → Painel Presidencial (mapa + pesquisas)
- [x] Rota `/senado` → Painel do Senado (cadeiras + mapa)
- [x] Rota `/noticias` → Feed de notícias eleitorais
- [x] Rota `/pesquisas` → Histórico de pesquisas com gráficos de evolução

## Página Presidencial (/)
- [x] Mapa do Brasil SVG interativo com cores por candidato líder em cada estado
- [x] Painel lateral/inferior: ranking de candidatos com % nas pesquisas (1º e 2º turno)
- [x] Gráfico de evolução temporal das intenções de voto
- [x] Cards de últimas pesquisas divulgadas
- [x] Indicador de data da pesquisa mais recente

## Página do Senado (/senado)
- [x] Visualização de cadeiras do Senado (81 cadeiras) estilo semicírculo parlamentar
- [x] Cores por partido/coligação
- [x] Separação: mandatos atuais (2023-2031) vs vagas em disputa 2026 (41 vagas)
- [ ] Previsão de formação pós-eleição baseada nas pesquisas estaduais (dados pendentes)
- [ ] Mapa do Brasil com estado colorido por candidato líder ao senado (dados pendentes)

## Página de Notícias (/noticias)
- [x] Layout de cards em coluna única (mobile) ou grid 2-3 colunas (desktop)
- [x] Filtros por categoria (Presidente, Governador, Senado, Geral) em chips horizontais
- [x] Filtro por fonte em chips horizontais (sem sidebar)
- [x] Botão de atualizar feeds
- [x] Sem sidebar — navegação por nav bar no topo

## Página de Pesquisas (/pesquisas)
- [x] Tabela de últimas pesquisas com instituto, data, candidatos e %
- [x] Gráfico de linha: evolução de cada candidato ao longo do tempo
- [x] Filtro por cargo e por instituto

## Backend tRPC
- [x] `candidatos.listar` — lista todos os candidatos por cargo
- [x] `pesquisas.listar` — lista pesquisas com intenções de voto
- [x] `pesquisas.evolucao` — série temporal por candidato
- [x] `previsoes.mapa` — dados para o mapa por estado
- [x] `senado.cadeiras` — todas as 81 cadeiras com status
- [x] `noticias.listar` — com filtro por categoria e fonte
- [x] `noticias.buscarRSS` — dispara busca manual nos feeds

## Dados Iniciais (Seed)
- [x] Candidatos presidenciais: Lula (PT), Tarcísio (Republicanos), Pablo Marçal (Novo), Ciro Gomes (PDT), Simone Tebet (MDB), Ratinho Jr (PSD), Flávio Bolsonaro (PL)
- [x] Pesquisas recentes: Datafolha (abr/mar/fev), Quaest (mar), AtlasIntel (mar) — 8 pesquisas com intenções de voto
- [x] 81 senadores atuais com partido e estado
- [x] Previsões estaduais baseadas nas últimas pesquisas disponíveis (27 estados)
- [x] 73 notícias dos últimos 30 dias inseridas no banco

## Qualidade e Técnica
- [x] Layout 100% responsivo mobile-first (sem bipartição forçada)
- [x] Encoding UTF-8 / utf8mb4_unicode_ci
- [x] Deduplicação de notícias via INSERT IGNORE na URL
- [x] Renovação diária automática às 7h (agendada via schedule)
- [x] Testes Vitest: 7/7 passando
- [x] Push para GitHub cantuariabruno-dot/painel-eleitoral-2026
- [x] Filtros de exclusão RSS para notícias fora do contexto eleitoral brasileiro
- [x] Mapa SVG real do Brasil com paths por estado (27 estados)
- [x] Tooltip interativo no mapa com candidato líder e percentual por estado
