#!/usr/bin/env python3
"""
Carga histórica de notícias eleitorais via RSS
Uso: python3 scripts/carga_historica.py [dias]

Estratégia de filtro em duas camadas:
  1. Filtro PESQUISA: notícias com termos de pesquisa/sondagem + termos eleitorais (foco principal)
  2. Filtro ELEITORAL: notícias sobre eleições 2026, candidaturas, campanhas (contexto amplo)
"""
import sys
import re
import os
import feedparser
import mysql.connector
from datetime import datetime, timedelta, timezone
from html.parser import HTMLParser
from urllib.parse import urlparse

DIAS = int(sys.argv[1]) if len(sys.argv) > 1 else 30

FEEDS = [
    {"nome": "Poder360",       "url": "https://www.poder360.com.br/feed/"},
    {"nome": "Folha",          "url": "https://feeds.folha.uol.com.br/poder/rss091.xml"},
    {"nome": "G1",             "url": "https://g1.globo.com/dynamo/politica/rss2.xml"},
    {"nome": "G1 Brasil",      "url": "https://g1.globo.com/dynamo/brasil/rss2.xml"},
    {"nome": "CNN Brasil",     "url": "https://www.cnnbrasil.com.br/feed/"},
    {"nome": "Metrópoles",     "url": "https://www.metropoles.com/feed"},
    {"nome": "Veja",           "url": "https://veja.abril.com.br/feed/"},
    {"nome": "Exame",          "url": "https://exame.com/feed/"},
    {"nome": "Gazeta do Povo", "url": "https://www.gazetadopovo.com.br/feed/politica/"},
    {"nome": "Agência Brasil", "url": "https://agenciabrasil.ebc.com.br/rss/politica/feed.xml"},
]

# ─── Termos de pesquisa eleitoral ────────────────────────────────────────────
TERMOS_PESQUISA = [
    "pesquisa", "sondagem", "instituto", "datafolha", "quaest", "ipec",
    "ibope", "atlas intel", "paraná pesquisas", "real time big data", "btg",
    "genial inteligência", "mda", "opinion box", "levantamento",
    "intenção de voto", "intenções de voto", "aprovação", "rejeição",
    "popularidade", "pesquisa eleitoral", "pesquisa de opinião",
    "pesquisa presidencial", "pesquisa aponta", "pesquisa mostra",
    "pesquisa revela", "pesquisa indica", "nova pesquisa", "última pesquisa",
    "pesquisa divulgada", "pesquisa registra", "cenário eleitoral",
    "primeiro turno", "segundo turno", "votos", "% nas pesquisas",
    "lidera", "empate técnico", "margem de erro",
]

# ─── Termos eleitorais (para filtro duplo com pesquisa) ──────────────────────
TERMOS_ELEITORAIS_PESQUISA = [
    "eleição", "eleitoral", "candidato", "presidente", "presidencial",
    "governador", "senador", "senado", "câmara", "deputado",
    "voto", "urna", "2026", "eleições 2026", "lula", "bolsonaro",
    "tarcísio", "tarcisio", "marçal", "pablo marçal", "ratinho",
    "ciro gomes", "alckmin", "eleitorado", "corrida presidencial",
    "disputa presidencial", "pleito",
]

# ─── Termos eleitorais amplos (notícias de contexto eleitoral) ───────────────
TERMOS_ELEITORAIS_AMPLOS = [
    "eleições 2026", "eleição 2026", "campanha eleitoral", "campanha de 2026",
    "pré-candidato", "pré-candidatura", "candidatura à presidência",
    "candidatura ao governo", "candidatura ao senado",
    "corrida presidencial", "disputa presidencial", "disputa ao governo",
    "corrida ao governo", "chapa eleitoral", "coligação eleitoral",
    "filiação partidária", "convenção partidária", "janela partidária",
    "reforma eleitoral", "calendário eleitoral", "tse", "tribunal superior eleitoral",
    "urna eletrônica", "sistema eleitoral", "voto impresso",
    "debate presidencial", "debate eleitoral",
]

# ─── Termos de candidatos e partidos (contexto eleitoral direto) ─────────────
TERMOS_CANDIDATOS = [
    "lula 2026", "bolsonaro 2026", "tarcísio de freitas", "tarcisio de freitas",
    "pablo marçal", "ratinho junior 2026", "ciro gomes 2026",
    "simone tebet 2026", "romário 2026", "flávio bolsonaro 2026",
    "pt 2026", "pl 2026", "novo 2026", "psol 2026", "mdb 2026",
]


class HTMLStripper(HTMLParser):
    def __init__(self):
        super().__init__()
        self.reset()
        self.fed = []

    def handle_data(self, d):
        self.fed.append(d)

    def get_data(self):
        return " ".join(self.fed)


def limpar_html(texto):
    if not texto:
        return ""
    s = HTMLStripper()
    try:
        s.feed(str(texto))
        return re.sub(r"\s+", " ", s.get_data()).strip()
    except Exception:
        return re.sub(r"<[^>]+>", " ", str(texto)).strip()


def contem_termo(texto, termos):
    t = texto.lower()
    return any(termo in t for termo in termos)


def filtro_valido(titulo, resumo):
    """
    Aceita a notícia se:
    1. Contém termos de pesquisa E termos eleitorais (filtro principal), OU
    2. Contém termos eleitorais amplos (candidaturas, campanhas 2026), OU
    3. Contém termos de candidatos específicos 2026
    """
    texto = f"{titulo} {resumo}"
    # Filtro 1: pesquisa + eleitoral
    if contem_termo(texto, TERMOS_PESQUISA) and contem_termo(texto, TERMOS_ELEITORAIS_PESQUISA):
        return True
    # Filtro 2: contexto eleitoral amplo
    if contem_termo(texto, TERMOS_ELEITORAIS_AMPLOS):
        return True
    # Filtro 3: candidatos 2026
    if contem_termo(texto, TERMOS_CANDIDATOS):
        return True
    return False


def detectar_categoria(texto):
    t = texto.lower()
    if any(x in t for x in ["presidente", "presidencial", "presidência", "lula",
                              "bolsonaro", "tarcísio", "tarcisio", "marçal",
                              "ciro gomes", "disputa presidencial", "corrida presidencial",
                              "candidatura à presidência"]):
        return "presidente"
    if any(x in t for x in ["governador", "governo estadual", "governo do estado",
                              "ratinho", "candidatura ao governo", "disputa ao governo"]):
        return "governador"
    if any(x in t for x in ["senador", "senado", "vaga no senado",
                              "candidatura ao senado"]):
        return "senador"
    return "geral"


def parse_data(entry):
    for campo in ["published_parsed", "updated_parsed", "created_parsed"]:
        val = getattr(entry, campo, None)
        if val:
            try:
                return datetime(*val[:6], tzinfo=timezone.utc)
            except Exception:
                pass
    return None


def extrair_link(entry):
    if hasattr(entry, "link") and entry.link:
        return entry.link
    if hasattr(entry, "links"):
        for l in entry.links:
            if l.get("rel") == "alternate":
                return l.get("href", "")
    if hasattr(entry, "id") and entry.id and entry.id.startswith("http"):
        return entry.id
    return ""


# ─── Conexão MySQL ────────────────────────────────────────────────────────────
db_url = os.environ.get("DATABASE_URL", "")
if not db_url:
    print("❌ DATABASE_URL não definida")
    sys.exit(1)

parsed_url = urlparse(db_url)
conn = mysql.connector.connect(
    host=parsed_url.hostname,
    port=parsed_url.port or 3306,
    user=parsed_url.username,
    password=parsed_url.password,
    database=parsed_url.path.lstrip("/"),
    charset="utf8mb4",
    collation="utf8mb4_unicode_ci",
    ssl_verify_cert=False,
    ssl_verify_identity=False,
)
cursor = conn.cursor()

# ─── Execução principal ───────────────────────────────────────────────────────
data_limite = datetime.now(timezone.utc) - timedelta(days=DIAS)
print(f"\n🔍 Buscando notícias dos últimos {DIAS} dias (desde {data_limite.strftime('%d/%m/%Y')})\n")

total_encontradas = 0
total_inseridas = 0
por_fonte = {}

feedparser.USER_AGENT = "Mozilla/5.0 (compatible; PainelEleitoral/1.0)"

for feed in FEEDS:
    print(f"  Buscando {feed['nome']}... ", end="", flush=True)
    try:
        parsed = feedparser.parse(feed["url"])
        entries = parsed.entries
        print(f"{len(entries)} itens", end="")

        relevantes = []
        for entry in entries:
            data = parse_data(entry)
            if data and data < data_limite:
                continue

            titulo = limpar_html(getattr(entry, "title", ""))
            resumo_raw = ""
            if hasattr(entry, "content") and entry.content:
                resumo_raw = entry.content[0].get("value", "")
            if not resumo_raw:
                resumo_raw = getattr(entry, "summary", "") or getattr(entry, "description", "")
            resumo = limpar_html(resumo_raw)[:500]
            url = extrair_link(entry)

            if not titulo or not url:
                continue
            if filtro_valido(titulo, resumo):
                relevantes.append({
                    "titulo": titulo,
                    "url": url,
                    "resumo": resumo,
                    "data": data or datetime.now(timezone.utc),
                })

        print(f" → {len(relevantes)} relevantes")
        total_encontradas += len(relevantes)

        for item in relevantes:
            categoria = detectar_categoria(f"{item['titulo']} {item['resumo']}")
            try:
                cursor.execute(
                    """INSERT IGNORE INTO noticias (titulo, url, fonte, data_publicacao, resumo, categoria)
                       VALUES (%s, %s, %s, %s, %s, %s)""",
                    (item["titulo"], item["url"], feed["nome"],
                     item["data"].replace(tzinfo=None), item["resumo"], categoria)
                )
                if cursor.rowcount > 0:
                    total_inseridas += 1
                    por_fonte[feed["nome"]] = por_fonte.get(feed["nome"], 0) + 1
            except Exception:
                pass

        conn.commit()

    except Exception as e:
        print(f"\n  ✗ Erro: {e}")

# Registrar no histórico
fontes_list = ", ".join(f"{k}: {v}" for k, v in sorted(por_fonte.items(), key=lambda x: -x[1]))
descricao = f"Carga histórica {DIAS}d — {total_encontradas} encontradas, {total_inseridas} novas"
if fontes_list:
    descricao += f" ({fontes_list})"

cursor.execute(
    "INSERT INTO atualizacoes (tipo, descricao, qtd_inseridas) VALUES (%s, %s, %s)",
    ("carga_historica", descricao, total_inseridas)
)
conn.commit()
cursor.close()
conn.close()

print(f"\n✅ Carga histórica concluída!")
print(f"   Total encontradas: {total_encontradas}")
print(f"   Novas inseridas:   {total_inseridas}")
if por_fonte:
    print(f"   Por fonte:")
    for fonte, qtd in sorted(por_fonte.items(), key=lambda x: -x[1]):
        print(f"     {fonte}: {qtd}")
