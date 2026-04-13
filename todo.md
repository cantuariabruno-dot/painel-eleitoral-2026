# Painel Eleitoral Brasil 2026 — TODO

## Arquitetura Central (Mapa de Previsão)
- [ ] Tabela `candidatos` (id, nome, partido, cargo, foto_url, cor_hex)
- [ ] Tabela `pesquisas` (id, instituto, data, cargo, fonte_url)
- [ ] Tabela `intencoes_voto` (pesquisa_id, candidato_id, percentual, turno)
- [ ] Tabela `previsoes_estado` (estado_uf, cargo, candidato_id_lider, percentual_lider, data_atualizacao)
- [ ] Tabela `senado_cadeiras` (id, estado_uf, senador_nome, partido, mandato_fim, status: atual|previsto|vaga)
- [ ] Tabela `noticias` (id, titulo, url unique, fonte, data_publicacao, resumo, categoria)
- [ ] Tabela `atualizacoes` (id, tipo, descricao, qtd_inseridas, criado_em)

## Navegação (Mobile-First, sem bipartição)
- [ ] Layout de página única com nav bar no topo (mobile) e sidebar colapsável (desktop)
- [ ] Rota `/` → Painel Presidencial (mapa + pesquisas)
- [ ] Rota `/senado` → Painel do Senado (cadeiras + mapa)
- [ ] Rota `/noticias` → Feed de notícias eleitorais
- [ ] Rota `/pesquisas` → Histórico de pesquisas com gráficos de evolução

## Página Presidencial (/)
- [ ] Mapa do Brasil SVG interativo com cores por candidato líder em cada estado
- [ ] Painel lateral/inferior: ranking de candidatos com % nas pesquisas (1º e 2º turno)
- [ ] Gráfico de evolução temporal das intenções de voto
- [ ] Cards de últimas pesquisas divulgadas
- [ ] Indicador de data da pesquisa mais recente

## Página do Senado (/senado)
- [ ] Visualização de cadeiras do Senado (81 cadeiras) estilo semicírculo parlamentar
- [ ] Cores por partido/coligação
- [ ] Separação: mandatos atuais (2023-2031) vs vagas em disputa 2026 (41 vagas)
- [ ] Previsão de formação pós-eleição baseada nas pesquisas estaduais
- [ ] Mapa do Brasil com estado colorido por candidato líder ao senado

## Página de Notícias (/noticias)
- [ ] Layout de cards em coluna única (mobile) ou grid 2-3 colunas (desktop)
- [ ] Filtros por categoria (Presidente, Governador, Senado, Geral) em chips horizontais
- [ ] Filtro por fonte em chips horizontais (sem sidebar)
- [ ] Botão de atualizar feeds
- [ ] Sem sidebar — navegação por nav bar no topo

## Página de Pesquisas (/pesquisas)
- [ ] Tabela de últimas pesquisas com instituto, data, candidatos e %
- [ ] Gráfico de linha: evolução de cada candidato ao longo do tempo
- [ ] Filtro por cargo e por instituto

## Backend tRPC
- [ ] `candidatos.listar` — lista todos os candidatos por cargo
- [ ] `pesquisas.listar` — lista pesquisas com intenções de voto
- [ ] `pesquisas.evolucao` — série temporal por candidato
- [ ] `previsoes.mapa` — dados para o mapa por estado
- [ ] `senado.cadeiras` — todas as 81 cadeiras com status
- [ ] `noticias.listar` — com filtro por categoria e fonte
- [ ] `noticias.buscarRSS` — dispara busca manual nos feeds

## Dados Iniciais (Seed)
- [ ] Candidatos presidenciais: Lula (PT), Tarcísio (PL/Republicanos), Pablo Marçal (Novo), Ciro Gomes (PDT), Simone Tebet (MDB)
- [ ] Pesquisas recentes: Datafolha, Quaest, AtlasIntel (últimos 30 dias)
- [ ] 81 senadores atuais com partido e estado
- [ ] Previsões estaduais baseadas nas últimas pesquisas disponíveis

## Qualidade e Técnica
- [ ] Layout 100% responsivo mobile-first (sem bipartição forçada)
- [ ] Encoding UTF-8 / utf8mb4_unicode_ci
- [ ] Deduplicação de notícias via INSERT IGNORE na URL
- [ ] Renovação diária automática às 7h
- [ ] Testes Vitest para endpoints principais
- [ ] Push para GitHub cantuariabruno-dot/painel-eleitoral-2026
