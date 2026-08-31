"""
Modelo de classificacao de estoque por arvore de decisao.

Gera/usa o arquivo modelo_arvore_casa_criancas.pkl e publica o endpoint:
    POST /predict
"""

from __future__ import annotations

import argparse
import json
import os
import pickle
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Iterable

try:
    import numpy as np
    import pandas as pd
    from flask import Flask, jsonify, request
    from sklearn.metrics import classification_report
    from sklearn.model_selection import train_test_split
    from sklearn.tree import DecisionTreeClassifier
    from sqlalchemy import create_engine
except ImportError as exc:
    raise SystemExit(
        f"Dependencia ausente: {exc.name}.\n"
        "Exemplo: pip install -r modelo/requirements.txt"
    ) from exc


BASE_DIR = Path(__file__).resolve().parent
DEFAULT_DATABASE_URL = "postgresql://postgres:postgres@localhost:5433/ong_stock"
DEFAULT_MODEL_PATH = BASE_DIR / "modelo_arvore_casa_criancas.pkl"

FEATURE_COLUMNS = ["quantidade_atual", "consumo_medio", "dias_para_vencer"]

CATEGORY_ORDER = {
    "produto critico": 1,
    "produto atenção alta": 2,
    "produto atenção baixo": 3,
    "produto seguro": 4,
    "produto baixa rotatividade": 5,
}

OUTPUT_COLUMNS = [
    "id_produto",
    "nome_produto",
    "codigo_barras",
    "numero_lote",
    "categoria_produto",
    "armazenamento",
    "localizacao",
    "quantidade_atual",
    "estoque_minimo",
    "consumo_medio",
    "data_validade",
    "dias_para_vencer",
    "dias_previstos_ate_zerar",
    "classificacao_estoque",
    "prioridade_classificacao",
    "atualizado_em",
]


@dataclass(frozen=True)
class ModelMetrics:
    total_lotes: int
    treinou_arvore: bool
    relatorio: dict | None = None


def get_database_url() -> str:
    return os.getenv("DATABASE_URL", DEFAULT_DATABASE_URL)


def get_model_path() -> Path:
    return Path(os.getenv("ML_MODEL_PATH", DEFAULT_MODEL_PATH))


def normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    rename_map = {
        "quantidade": "quantidade_atual",
        "qtd_estoque": "quantidade_atual",
        "quantity": "quantidade_atual",
        "currentStock": "quantidade_atual",
        "consumo_diario": "consumo_medio",
        "media_consumo": "consumo_medio",
        "dailyConsumption": "consumo_medio",
        "averageDailyOutput": "consumo_medio",
        "validade": "data_validade",
        "expiresAt": "data_validade",
        "id": "id_produto",
        "productId": "id_produto",
        "name": "nome_produto",
        "productName": "nome_produto",
        "barcode": "codigo_barras",
        "batch": "numero_lote",
        "minimumStock": "estoque_minimo",
        "category": "categoria_produto",
        "categoria": "categoria_produto",
        "storage": "armazenamento",
        "location": "localizacao",
    }
    return df.rename(columns={source: target for source, target in rename_map.items() if source in df.columns})


def load_lotes_from_database(database_url: str | None = None) -> pd.DataFrame:
    engine = create_engine(database_url or get_database_url())
    query = """
        SELECT
            p.id_produto,
            p.nome_produto,
            p.codigo_barras,
            p.numero_lote,
            p.data_validade,
            p.quantidade,
            p.estoque_minimo,
            p.categoria,
            p.armazenamento,
            p.localizacao,
            p.atualizado_em,
            COALESCE(cd.consumo_medio, 0)::float AS consumo_medio
        FROM tb_produtos p
        LEFT JOIN tb_consumo_diario cd ON cd.id_produto = p.id_produto
        ORDER BY p.data_validade ASC, p.nome_produto ASC, p.numero_lote ASC;
    """
    return pd.read_sql_query(query, engine)


def load_lotes_from_payload(payload: dict | list) -> pd.DataFrame:
    records = payload.get("lotes") or payload.get("items") or payload.get("data") or [] if isinstance(payload, dict) else payload
    return pd.DataFrame(records)


def prepare_features(lotes: pd.DataFrame) -> pd.DataFrame:
    df = normalize_columns(lotes.copy())

    defaults = {
        "id_produto": "",
        "nome_produto": "Produto sem nome",
        "codigo_barras": "",
        "numero_lote": "Sem lote",
        "data_validade": None,
        "quantidade_atual": 0,
        "estoque_minimo": 0,
        "categoria_produto": "outros",
        "armazenamento": "seco",
        "localizacao": "Estoque",
        "atualizado_em": None,
        "consumo_medio": 0,
    }
    for column, default in defaults.items():
      if column not in df.columns:
          df[column] = default

    df["quantidade_atual"] = pd.to_numeric(df["quantidade_atual"], errors="coerce").fillna(0)
    df["estoque_minimo"] = pd.to_numeric(df["estoque_minimo"], errors="coerce").fillna(0)
    df["consumo_medio"] = pd.to_numeric(df["consumo_medio"], errors="coerce").fillna(0)
    df["data_validade"] = pd.to_datetime(df["data_validade"], errors="coerce")

    hoje = pd.to_datetime(datetime.now().date())
    df["dias_para_vencer"] = (df["data_validade"] - hoje).dt.days.fillna(0)
    df["dias_estoque_restante"] = df["quantidade_atual"] / df["consumo_medio"].replace(0, np.nan)
    df["dias_previstos_ate_zerar"] = df["dias_estoque_restante"].replace([np.inf, -np.inf], np.nan).round(1)

    return df


def rotular(row: pd.Series) -> str:
    dias_estoque = row["dias_estoque_restante"]

    if pd.notna(dias_estoque) and row["dias_para_vencer"] <= dias_estoque:
        return "produto baixa rotatividade"
    if pd.isna(dias_estoque):
        return "produto baixa rotatividade"
    if dias_estoque < 7:
        return "produto critico"
    if dias_estoque <= 14:
        return "produto atenção alta"
    if dias_estoque <= 30:
        return "produto atenção baixo"
    return "produto seguro"


def train_model(df: pd.DataFrame, model_path: Path | None = None) -> tuple[DecisionTreeClassifier, ModelMetrics]:
    training_df = df.copy()
    training_df["classificacao_estoque"] = training_df.apply(rotular, axis=1)

    x = training_df[FEATURE_COLUMNS].fillna(0)
    y = training_df["classificacao_estoque"]

    if len(training_df) >= 4 and y.nunique() > 1:
        x_train, x_test, y_train, y_test = train_test_split(
            x,
            y,
            train_size=0.7,
            random_state=42,
            stratify=y if y.value_counts().min() >= 2 else None,
        )
    else:
        x_train, x_test, y_train, y_test = x, x, y, y

    clf = DecisionTreeClassifier(max_depth=4, random_state=42, class_weight="balanced")
    clf.fit(x_train, y_train)
    y_pred = clf.predict(x_test)
    report = classification_report(y_test, y_pred, zero_division=0, output_dict=True)

    if model_path:
        model_path.parent.mkdir(parents=True, exist_ok=True)
        with model_path.open("wb") as model_file:
            pickle.dump(clf, model_file)

    return clf, ModelMetrics(total_lotes=len(df), treinou_arvore=True, relatorio=report)


def load_or_train_model(df: pd.DataFrame, model_path: Path) -> tuple[DecisionTreeClassifier, ModelMetrics]:
    if model_path.exists():
        with model_path.open("rb") as model_file:
            return pickle.load(model_file), ModelMetrics(total_lotes=len(df), treinou_arvore=False)
    return train_model(df, model_path)


def build_classification_from_lotes(lotes: pd.DataFrame, model_path: Path | None = None) -> tuple[pd.DataFrame, ModelMetrics]:
    if lotes.empty:
        return pd.DataFrame(columns=OUTPUT_COLUMNS), ModelMetrics(total_lotes=0, treinou_arvore=False)

    df = prepare_features(lotes)
    clf, metrics = load_or_train_model(df, model_path or get_model_path())
    df["classificacao_estoque"] = clf.predict(df[FEATURE_COLUMNS].fillna(0))
    df["prioridade_classificacao"] = df["classificacao_estoque"].map(CATEGORY_ORDER).fillna(99)

    result = df[OUTPUT_COLUMNS].sort_values(
        by=["prioridade_classificacao", "dias_previstos_ate_zerar", "dias_para_vencer"],
        na_position="last",
    )
    return result, metrics


def build_classification(database_url: str | None = None, model_path: Path | None = None) -> tuple[pd.DataFrame, ModelMetrics]:
    return build_classification_from_lotes(load_lotes_from_database(database_url), model_path)


def build_classification_from_payload(payload: dict | list) -> dict:
    result, metrics = build_classification_from_lotes(load_lotes_from_payload(payload))
    return {
        "generatedAt": pd.Timestamp.utcnow().isoformat(),
        "metrics": {
            "totalLotes": metrics.total_lotes,
            "treinouArvore": metrics.treinou_arvore,
            "relatorio": metrics.relatorio,
        },
        "classifications": json.loads(result.to_json(orient="records", date_format="iso")),
    }


def create_app():
    app = Flask(__name__)

    @app.get("/health")
    def health():
        return jsonify({"status": "ok", "service": "modelo-arvore-casa-criancas"})

    @app.post("/predict")
    def predict():
        return jsonify(build_classification_from_payload(request.get_json(silent=True) or {}))

    return app


def print_summary(result: pd.DataFrame, metrics: ModelMetrics) -> None:
    print(f"Modelo treinado com as novas categorias! ({metrics.total_lotes} amostras)")
    print("Relatorio de Classificacao:")
    if metrics.relatorio:
        print(json.dumps(metrics.relatorio, indent=2, ensure_ascii=False))

    columns = [
        "quantidade_atual",
        "consumo_medio",
        "dias_previstos_ate_zerar",
        "dias_para_vencer",
        "classificacao_estoque",
    ]
    print(result[columns].head(20).to_string(index=False))


def parse_args(argv: Iterable[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Treina/publica arvore de classificacao de estoque.")
    parser.add_argument("--database-url", default=get_database_url())
    parser.add_argument("--model-path", default=str(get_model_path()))
    parser.add_argument("--output", default=os.getenv("ML_OUTPUT_PATH"))
    parser.add_argument("--serve", action="store_true")
    parser.add_argument("--port", default=int(os.getenv("PORT", "8000")), type=int)
    return parser.parse_args(argv)


def main(argv: Iterable[str] | None = None) -> None:
    args = parse_args(argv)

    if args.serve:
        create_app().run(host="0.0.0.0", port=args.port)
        return

    result, metrics = build_classification(args.database_url, Path(args.model_path))
    print_summary(result, metrics)

    if args.output:
        result.to_csv(args.output, index=False)
        print(f"Arquivo salvo em: {args.output}")


if __name__ == "__main__":
    main()
