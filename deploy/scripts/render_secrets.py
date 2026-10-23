#!/usr/bin/env python3
"""Render env files from Infisical according to deploy/secrets-manifest.toml.

Usage:
  render_secrets.py --out DIR [--phase base|flip|all] [--only ID ...] [--report PATH]

Fail-fast contract (see .agents/plans/2026-10-12-infisical-only-secrets.md):
- every key listed for a file must exist and be non-empty in its Infisical paths
- a key present at an (env, path) that no manifest file claims, and that is not in
  unrendered_keys, is a WARNING (reported, never rendered, never blocks)
- the same key at two paths of one file is an error (no silent precedence)
- nothing is written unless every selected file is clean; artifacts are 0600
- the report carries key NAMES and statuses only, never values

Output: DIR/<id>.env per file (consumed by PYINFRA_ENV_RENDER) and a JSON report.
Exit 0 when everything is ok, 1 otherwise.
"""

from __future__ import annotations

import argparse
import importlib.util
import json
import os
import subprocess
import sys
import tomllib
from collections.abc import Callable
from pathlib import Path

HERE = Path(__file__).resolve().parent
MANIFEST = HERE.parent / "secrets-manifest.toml"

Fetch = Callable[[str, str], dict[str, str]]


def _load_validator():
    spec = importlib.util.spec_from_file_location(
        "validate_secrets_manifest", HERE / "validate_secrets_manifest.py"
    )
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def infisical_fetch(env: str, path: str) -> dict[str, str]:
    """Exact folder read through the infisical CLI (never recursive)."""
    # CI has no checked-in project context: INFISICAL_PROJECT_ID selects it there.
    # Locally the .infisical.json of apps/web does.
    project = os.environ.get("INFISICAL_PROJECT_ID")
    proc = subprocess.run(
        ["infisical", "secrets", "--env", env, "--path", path, "-o", "json"]
        + (["--projectId", project] if project else []),
        capture_output=True,
        text=True,
        check=False,
    )
    if proc.returncode != 0:
        raise RuntimeError(f"infisical read failed for {env}:{path} (exit {proc.returncode})")
    try:
        rows = json.loads(proc.stdout)
    except json.JSONDecodeError as err:
        raise RuntimeError(f"infisical returned non-JSON for {env}:{path}") from err
    return {row["secretKey"]: row.get("secretValue") or "" for row in rows}


def value_problem(value: str) -> str | None:
    """Why a value cannot be written to a systemd EnvironmentFile verbatim."""
    if "\n" in value or "\r" in value:
        return "contains a newline"
    if value != value.strip():
        return "has leading or trailing whitespace"
    if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
        return "is wrapped in quotes"
    if value.endswith("\\"):
        return "ends with a backslash"
    return None


def render(doc: dict, fetch: Fetch, phase: str, only: set[str]) -> tuple[dict[str, str], dict]:
    """Return ({file id: dotenv text}, report). Texts are only meaningful when report ok."""
    files = doc["files"]
    unrendered = set(doc.get("unrendered_keys", []))
    key_sets = doc["key_sets"]

    # What each (env, path) folder is allowed to contain, across ALL files regardless of phase.
    claimed: dict[tuple[str, str], set[str]] = {}
    for entry in files:
        for source in entry["sources"]:
            claimed.setdefault((entry["infisical_env"], source["path"]), set()).update(
                key_sets[source["keys"]]
            )

    cache: dict[tuple[str, str], dict[str, str] | str] = {}

    def read(env: str, path: str) -> dict[str, str] | str:
        if (env, path) not in cache:
            try:
                cache[(env, path)] = fetch(env, path)
            except RuntimeError as err:
                cache[(env, path)] = str(err)
        return cache[(env, path)]

    selected = [
        e
        for e in files
        if (phase == "all" or e.get("phase", "base") == phase) and (not only or e["id"] in only)
    ]
    texts: dict[str, str] = {}
    report_files: list[dict] = []

    for entry in selected:
        env = entry["infisical_env"]
        found: dict[str, str] = {}
        source_of: dict[str, str] = {}
        problems: list[dict] = []
        warnings: list[dict] = []
        wanted: list[str] = []

        for source in entry["sources"]:
            path = source["path"]
            expected = key_sets[source["keys"]]
            wanted.extend(expected)
            got = read(env, path)
            if isinstance(got, str):
                problems.append({"key": "*", "path": path, "status": "unreadable", "detail": got})
                continue
            for key in sorted(set(got) - claimed[(env, path)] - unrendered):
                warnings.append({"key": key, "path": path, "status": "unclaimed"})
            for key in expected:
                if key in got:
                    found[key] = got[key]
                    source_of[key] = path

        keys_report: list[dict] = []
        for key in wanted:
            if key not in found:
                problems.append({"key": key, "path": None, "status": "missing"})
                continue
            if not found[key]:
                problems.append({"key": key, "path": source_of[key], "status": "empty"})
                continue
            bad = value_problem(found[key])
            if bad:
                problems.append(
                    {
                        "key": key,
                        "path": source_of[key],
                        "status": "unsupported_value",
                        "detail": bad,
                    }
                )
                continue
            keys_report.append({"key": key, "path": source_of[key], "status": "ok"})

        static = entry.get("static", {})
        lines = {**found, **static}
        for key in static:
            keys_report.append({"key": key, "path": "manifest", "status": "ok"})
        for key in static:
            bad = value_problem(static[key])
            if bad:
                problems.append(
                    {"key": key, "path": "manifest", "status": "unsupported_value", "detail": bad}
                )

        report_files.append(
            {
                "id": entry["id"],
                "host_file": entry["host_file"],
                "env": env,
                "phase": entry.get("phase", "base"),
                "ok": not problems,
                "keys": keys_report,
                "problems": problems,
                "warnings": warnings,
            }
        )
        if not problems:
            body = "\n".join(f"{k}={lines[k]}" for k in sorted(lines))
            texts[entry["id"]] = (
                "# Rendered from Infisical by deploy/scripts/render_secrets.py. Do not edit.\n"
                + body
                + "\n"
            )

    report = {"phase": phase, "ok": all(f["ok"] for f in report_files), "files": report_files}
    if not report_files:
        report["ok"] = False
        report["error"] = "no manifest entries selected"
    return texts, report


def summarize(report: dict) -> str:
    """One human line per problem, key names only."""
    lines = []
    for f in report["files"]:
        state = "ok" if f["ok"] else "FAIL"
        lines.append(f"{state:4} {f['id']:<12} {f['host_file']}")
        for p in f["problems"]:
            where = f" at {p['path']}" if p.get("path") else ""
            detail = f" ({p['detail']})" if p.get("detail") else ""
            lines.append(f"       {p['status']}: {p['key']}{where}{detail}")
        for w in f["warnings"]:
            lines.append(f"       warning {w['status']}: {w['key']} at {w['path']} (not rendered)")
    if report.get("error"):
        lines.append(f"FAIL {report['error']}")
    return "\n".join(lines)


def markdown_table(report: dict) -> str:
    """Step-summary table: one row per problem or warning, key names only."""
    rows = ["| file | status | key | folder | detail |", "| --- | --- | --- | --- | --- |"]
    for f in report["files"]:
        if not f["problems"] and not f["warnings"]:
            rows.append(f"| {f['id']} | ok | {len(f['keys'])} keys | | |")
        for p in f["problems"]:
            rows.append(
                f"| {f['id']} | **{p['status']}** | `{p['key']}` | {p.get('path') or ''} "
                f"| {p.get('detail', '')} |"
            )
        for w in f["warnings"]:
            rows.append(
                f"| {f['id']} | warning {w['status']} | `{w['key']}` | {w['path']} | not rendered |"
            )
    if report.get("error"):
        rows.append(f"| | **error** | | | {report['error']} |")
    return "\n".join(rows) + "\n"


def write_artifacts(out: Path, texts: dict[str, str]) -> None:
    out.mkdir(parents=True, exist_ok=True, mode=0o700)
    for file_id, text in texts.items():
        target = out / f"{file_id}.env"
        fd = os.open(target, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
        with os.fdopen(fd, "w") as handle:
            handle.write(text)
        os.chmod(target, 0o600)


def main(argv: list[str], fetch: Fetch = infisical_fetch) -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--manifest", type=Path, default=MANIFEST)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--phase", choices=["base", "flip", "all"], default="base")
    parser.add_argument("--only", action="append", default=[])
    parser.add_argument("--report", type=Path)
    parser.add_argument("--summary-md", type=Path, help="append a markdown table (CI step summary)")
    args = parser.parse_args(argv)

    doc = tomllib.loads(args.manifest.read_text())
    errors = _load_validator().validate(doc)
    if errors:
        print("secrets manifest INVALID, nothing rendered:", file=sys.stderr)
        for line in errors:
            print(f"  - {line}", file=sys.stderr)
        return 1

    texts, report = render(doc, fetch, args.phase, set(args.only))
    if args.report:
        args.report.write_text(json.dumps(report, indent=2) + "\n")
    if args.summary_md:
        with args.summary_md.open("a") as handle:
            handle.write("### Infisical render\n\n" + markdown_table(report))
    print(summarize(report), file=sys.stderr if not report["ok"] else sys.stdout)
    if not report["ok"]:
        return 1
    write_artifacts(args.out, texts)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
