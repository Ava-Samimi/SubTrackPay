#!/usr/bin/env python3
"""
Parse schema.prisma and output JSON:
{
  "models": [
    {
      "model": "Customer",
      "db_table": "customers",          # if @@map exists, else null
      "fields": [
        {
          "name": "id",
          "type": "Int",
          "optional": false,
          "list": false,
          "db_column": null             # if @map exists, else null
        },
        ...
      ]
    },
    ...
  ],
  "meta": {
    "schema_path": "...",
    "generated_at_utc": "..."
  }
}

Usage:
  python prisma_schema_to_json.py
  SCHEMA_PRISMA=./prisma/schema.prisma OUT_JSON=./data/db_schema.json python prisma_schema_to_json.py
"""

from __future__ import annotations

import json
import os
import re
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional


# ---------- data structures ----------

@dataclass
class FieldInfo:
    name: str
    type: str
    optional: bool
    list: bool
    db_column: Optional[str] = None


@dataclass
class ModelInfo:
    model: str
    db_table: Optional[str]
    fields: List[FieldInfo]


# ---------- prisma parsing ----------

MODEL_START_RE = re.compile(r"^\s*model\s+([A-Za-z_]\w*)\s*\{\s*$")
ENUM_START_RE = re.compile(r"^\s*enum\s+([A-Za-z_]\w*)\s*\{\s*$")
BLOCK_END_RE = re.compile(r"^\s*\}\s*$")

# Field line: <name> <type>[?][[]] <attrs...>
FIELD_RE = re.compile(r"^\s*([A-Za-z_]\w*)\s+([A-Za-z_]\w*(?:\[\])?)(\?)?\s*(.*)$")

# @@map("table_name")
MODEL_MAP_RE = re.compile(r'@@map\(\s*"([^"]+)"\s*\)')

# @map("column_name")
FIELD_MAP_RE = re.compile(r'@map\(\s*"([^"]+)"\s*\)')


def _strip_inline_comment(line: str) -> str:
    # Prisma uses // for comments. This removes anything after //.
    # Note: Does not handle // inside quotes perfectly, but is good enough for typical schemas.
    if "//" in line:
        return line.split("//", 1)[0].rstrip()
    return line.rstrip()


def parse_schema_prisma(schema_text: str) -> list[ModelInfo]:
    lines = schema_text.splitlines()

    models: list[ModelInfo] = []
    model_names: set[str] = set()

    i = 0
    while i < len(lines):
        raw = _strip_inline_comment(lines[i]).strip()
        i += 1
        if not raw:
            continue

        m = MODEL_START_RE.match(raw)
        if not m:
            continue

        model_name = m.group(1)
        model_names.add(model_name)

        fields: list[FieldInfo] = []
        db_table: Optional[str] = None

        # parse model block until closing }
        while i < len(lines):
            line_raw = _strip_inline_comment(lines[i]).strip()
            i += 1

            if not line_raw:
                continue

            if BLOCK_END_RE.match(line_raw):
                break

            # model-level mapping
            mm = MODEL_MAP_RE.search(line_raw)
            if mm:
                db_table = mm.group(1)

            # ignore block attributes like @@index, @@unique, @@id, etc.
            if line_raw.startswith("@@"):
                continue

            # ignore enum blocks nested weirdly (shouldn't happen)
            if ENUM_START_RE.match(line_raw):
                # skip until end of that block
                while i < len(lines) and not BLOCK_END_RE.match(_strip_inline_comment(lines[i]).strip()):
                    i += 1
                if i < len(lines):
                    i += 1
                continue

            # field parse
            fm = FIELD_RE.match(line_raw)
            if not fm:
                continue

            field_name = fm.group(1)
            type_token = fm.group(2)  # may include []
            optional = fm.group(3) == "?"
            attrs = fm.group(4) or ""

            is_list = type_token.endswith("[]")
            base_type = type_token[:-2] if is_list else type_token

            # ignore relation-only pseudo lines? (we keep them anyway; user can filter later)
            # capture @map if exists
            db_col = None
            fmm = FIELD_MAP_RE.search(attrs)
            if fmm:
                db_col = fmm.group(1)

            fields.append(
                FieldInfo(
                    name=field_name,
                    type=base_type,
                    optional=optional,
                    list=is_list,
                    db_column=db_col,
                )
            )

        models.append(ModelInfo(model=model_name, db_table=db_table, fields=fields))

    # Optional: if you want, you can tag relations by comparing types to model names.
    # (Not requested explicitly, but useful; kept out to keep JSON simple.)

    return models


# ---------- output ----------

def write_schema_json(models: list[ModelInfo], schema_path: Path, out_json: Path) -> None:
    payload = {
        "models": [
            {
                "model": m.model,
                "db_table": m.db_table,
                "fields": [asdict(f) for f in m.fields],
            }
            for m in models
        ],
        "meta": {
            "schema_path": str(schema_path),
            "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        },
    }

    out_json.parent.mkdir(parents=True, exist_ok=True)
    out_json.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")


def main() -> int:
    schema_path = Path(os.getenv("SCHEMA_PRISMA", "./prisma/schema.prisma")).resolve()
    out_json = Path(os.getenv("OUT_JSON", "./data/db_schema.json")).resolve()

    if not schema_path.exists():
        raise SystemExit(f"schema.prisma not found at: {schema_path}")

    schema_text = schema_path.read_text(encoding="utf-8")
    models = parse_schema_prisma(schema_text)
    write_schema_json(models, schema_path, out_json)

    print(f"✅ Wrote schema JSON: {out_json}")
    print(f"   Models: {len(models)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
