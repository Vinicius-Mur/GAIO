import re
import unicodedata
from pathlib import Path

ML_DIR = Path(__file__).resolve().parent
ARTIFACTS_DIR = ML_DIR / "artifacts"
MODEL_PATH = ARTIFACTS_DIR / "model.cbm"
METADATA_PATH = ARTIFACTS_DIR / "metadata.json"
DEFAULT_DATASET = ML_DIR.parent / "Documento de Guilherme.csv"

QUANTIS = (0.1, 0.5, 0.9)
AMOSTRA_MINIMA = 15
BAIRRO_DESCONHECIDO = "DESCONHECIDO"
ZONA_DESCONHECIDA = "DESCONHECIDA"
# Cenarios de localizacao: bairro reconhecido, so a zona conhecida, nenhuma das duas.
CENARIOS = ("completo", "sem_bairro", "sem_localizacao")

# Coluna do dataset -> nome do campo no JSON que o backend envia (ImovelFeatures).
AMENIDADES = {
    "Academia": "academia",
    "Elevador": "elevador",
    "Permitido animais": "permitidoAnimais",
    "Piscina": "piscina",
    "Portaria": "portaria",
    "Salão de festas": "salaoFestas",
    "Condomínio fechado": "condominioFechado",
    "Segurança 24h": "seguranca24h",
    "Portão eletrônico": "portaoEletronico",
    "Área murada": "areaMurada",
    "Área de serviço": "areaServico",
    "Armários na cozinha": "armariosCozinha",
    "Armários no quarto": "armariosQuarto",
    "Churrasqueira": "churrasqueira",
    "Mobiliado": "mobiliado",
    "Quarto de serviço": "quartoServico",
    "Ar condicionado": "arCondicionado",
    "Porteiro 24h": "porteiro24h",
    "Varanda": "varanda",
}

COLUNAS_BASE = {
    "Área útil": "areaM2",
    "Quartos": "quartos",
    "Banheiros": "banheiros",
    "Vagas na garagem": "vagasGaragem",
    "Condomínio": "condominio",
    "Categoria": "categoria",
    "Tipo": "tipo",
    "ZONA": "zona",
    "bairro": "bairro",
}

FEATURES_CATEGORICAS = ["bairro", "zona", "categoria", "tipo"]
FEATURES = (
    ["areaM2", "quartos", "banheiros", "vagasGaragem", "condominio"]
    + FEATURES_CATEGORICAS
    + list(AMENIDADES.values())
)

_ABREVIACOES = {
    "v": "vila",
    "vl": "vila",
    "jd": "jardim",
    "jdm": "jardim",
    "pq": "parque",
    "pque": "parque",
    "chac": "chacara",
    "cid": "cidade",
    "sta": "santa",
    "sto": "santo",
    "st": "santo",
    "res": "residencial",
    "cj": "conjunto",
    "cjto": "conjunto",
}


def normalizar_bairro(texto):
    """Chave de comparacao: minusculas, sem acento, sem cidade/UF e com abreviacoes expandidas."""
    if not texto:
        return ""
    texto = re.split(r",| - | / ", str(texto))[0]
    texto = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode("ascii").lower()
    palavras = re.sub(r"[^a-z0-9 ]", " ", texto).split()
    return " ".join(_ABREVIACOES.get(p, p) for p in palavras)
