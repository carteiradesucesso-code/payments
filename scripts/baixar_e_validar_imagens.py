#!/usr/bin/env python3
"""Baixa e valida imagens ARMAF a partir de dados/manifesto_imagens.json.

Regras:
- nunca substitui uma imagem por outra;
- separa autorizadas, candidatas e bloqueadas;
- preserva URL original e URL final;
- valida MIME, assinatura, dimensões, SHA-256 e transparência;
- não acessa qualquer outro repositório.
"""

from __future__ import annotations

import hashlib
import json
import mimetypes
import sys
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

try:
    from PIL import Image
except ImportError as exc:
    raise SystemExit("Instale Pillow: python -m pip install Pillow") from exc

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "dados" / "manifesto_imagens.json"
REPORT_DIR = ROOT / "relatorios"
IMAGE_DIR = ROOT / "imagens"
USER_AGENT = "Mozilla/5.0 (compatible; ARMAF-Catalog-Audit/1.0)"
MIN_LARGEST_SIDE = 600


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def sniff_signature(data: bytes) -> str | None:
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png"
    if data.startswith(b"\xff\xd8\xff"):
        return "jpeg"
    if data.startswith(b"RIFF") and data[8:12] == b"WEBP":
        return "webp"
    if data.startswith((b"GIF87a", b"GIF89a")):
        return "gif"
    return None


def destination_for(state: str) -> Path:
    if state == "autorizada":
        return IMAGE_DIR / "autorizadas"
    if state.startswith("autorizada_com_"):
        return IMAGE_DIR / "autorizadas" / "revisao_manual"
    if state == "candidata_nao_autorizada":
        return IMAGE_DIR / "candidatas"
    return IMAGE_DIR / "bloqueadas"


def download(item: dict[str, Any]) -> dict[str, Any]:
    result: dict[str, Any] = {
        "ordem": item.get("ordem"),
        "produto": item.get("produto"),
        "estado_imagem": item.get("estado_imagem"),
        "url_original": item.get("url"),
        "arquivo": item.get("arquivo"),
        "status": "pendente",
    }

    url = item.get("url")
    filename = item.get("arquivo")
    state = item.get("estado_imagem", "bloqueada")

    if not url or not filename or state == "bloqueada":
        result["status"] = "bloqueada_sem_download"
        result["motivo"] = item.get("motivo", "sem URL autorizada")
        return result

    target_dir = destination_for(state)
    target_dir.mkdir(parents=True, exist_ok=True)
    target = target_dir / filename
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})

    try:
        with urllib.request.urlopen(request, timeout=40) as response:
            body = response.read()
            final_url = response.geturl()
            status_code = getattr(response, "status", 200)
            content_type = response.headers.get_content_type()
    except (urllib.error.URLError, TimeoutError) as exc:
        result.update(status="falha_download", erro=str(exc))
        return result

    signature = sniff_signature(body[:32])
    if signature is None:
        result.update(
            status="rejeitada",
            motivo="assinatura de arquivo não reconhecida como imagem",
            http_status=status_code,
            content_type=content_type,
            url_final=final_url,
        )
        return result

    if content_type == "text/html" or body.lstrip().lower().startswith((b"<!doctype html", b"<html")):
        result.update(status="rejeitada", motivo="HTML recebido no lugar de imagem")
        return result

    target.write_bytes(body)

    try:
        with Image.open(target) as image:
            image.verify()
        with Image.open(target) as image:
            width, height = image.size
            fmt = (image.format or signature).lower()
            has_alpha = "A" in image.getbands() or "transparency" in image.info
    except Exception as exc:
        target.unlink(missing_ok=True)
        result.update(status="rejeitada", motivo=f"imagem inválida: {exc}")
        return result

    largest = max(width, height)
    decision = "validada"
    warnings: list[str] = []
    if largest < MIN_LARGEST_SIDE:
        decision = "revisao_manual"
        warnings.append(f"maior lado inferior a {MIN_LARGEST_SIDE}px")

    expected_ext = mimetypes.guess_extension(content_type) if content_type else None
    result.update(
        status=decision,
        caminho=str(target.relative_to(ROOT)),
        http_status=status_code,
        content_type=content_type,
        assinatura=signature,
        formato_real=fmt,
        extensao_sugerida_por_mime=expected_ext,
        largura=width,
        altura=height,
        proporcao=round(width / height, 5) if height else None,
        bytes=len(body),
        sha256=sha256_file(target),
        transparencia=has_alpha,
        url_final=final_url,
        avisos=warnings,
    )
    return result


def main() -> int:
    if not MANIFEST.exists():
        print(f"Manifesto não encontrado: {MANIFEST}", file=sys.stderr)
        return 2

    data = json.loads(MANIFEST.read_text(encoding="utf-8"))
    items = data.get("imagens", [])
    REPORT_DIR.mkdir(parents=True, exist_ok=True)

    results = [download(item) for item in items]
    report = {
        "total": len(results),
        "validada": sum(r["status"] == "validada" for r in results),
        "revisao_manual": sum(r["status"] == "revisao_manual" for r in results),
        "bloqueada_sem_download": sum(r["status"] == "bloqueada_sem_download" for r in results),
        "falha_download": sum(r["status"] == "falha_download" for r in results),
        "rejeitada": sum(r["status"] == "rejeitada" for r in results),
        "resultados": results,
    }
    output = REPORT_DIR / "downloads.json"
    output.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 1 if report["falha_download"] or report["rejeitada"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
