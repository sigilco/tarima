#!/usr/bin/env python3
"""Validate deploy/secrets-manifest.toml (names only, never values).

Usage: python3 deploy/scripts/validate_secrets_manifest.py [--json] [PATH]
Exit 0 when valid, 1 with one line per problem otherwise. Stdlib only, so it
runs anywhere (lefthook, CI, the Mac) without the pyinfra environment.
"""

from __future__ import annotations

import json
import re
import sys
import tomllib
from pathlib import Path

DEFAULT_PATH = Path(__file__).resolve().parent.parent / "secrets-manifest.toml"

KEY_RE = re.compile(r"^[A-Z][A-Z0-9_]*$")
MODE_RE = re.compile(r"^0[0-7]{3}$")
UNIT_RE = re.compile(r"^[A-Za-z0-9@:._-]+\.service$")
ACCOUNT_RE = re.compile(r"^[a-z_][a-z0-9_-]*$")
ENVS = {"prod", "staging", "dev"}
PHASES = {"base", "flip"}

TOP_FIELDS = {"version", "unrendered_keys", "key_sets", "files"}
FILE_FIELDS = {
    "id",
    "host_file",
    "owner",
    "group",
    "mode",
    "infisical_env",
    "sources",
    "units",
    "phase",
    "static",
}
FILE_REQUIRED = FILE_FIELDS - {"phase", "static"}


def _key_list(value: object, where: str, errors: list[str]) -> list[str]:
    if not isinstance(value, list) or not value:
        errors.append(f"{where}: must be a non-empty list of key names")
        return []
    keys: list[str] = []
    for item in value:
        if not isinstance(item, str) or not KEY_RE.match(item):
            errors.append(f"{where}: invalid key name {item!r} (UPPER_SNAKE_CASE)")
        else:
            keys.append(item)
    for dup in sorted({k for k in keys if keys.count(k) > 1}):
        errors.append(f"{where}: duplicate key {dup}")
    return keys


def validate(doc: dict) -> list[str]:
    errors: list[str] = []

    for field in sorted(set(doc) - TOP_FIELDS):
        errors.append(f"top level: unknown field {field!r}")
    if doc.get("version") != 1:
        errors.append("top level: version must be 1")

    unrendered_raw = doc.get("unrendered_keys", [])
    unrendered = _key_list(unrendered_raw, "unrendered_keys", errors) if unrendered_raw else []

    key_sets_raw = doc.get("key_sets")
    key_sets: dict[str, list[str]] = {}
    if not isinstance(key_sets_raw, dict) or not key_sets_raw:
        errors.append("key_sets: must be a non-empty table")
    else:
        for name, value in key_sets_raw.items():
            key_sets[name] = _key_list(value, f"key_sets.{name}", errors)

    files = doc.get("files")
    if not isinstance(files, list) or not files:
        errors.append("files: must be a non-empty array of tables")
        return errors

    seen_ids: set[str] = set()
    seen_hosts: set[str] = set()
    claimed: dict[tuple[str, str], set[str]] = {}
    used_sets: set[str] = set()
    for index, entry in enumerate(files):
        where = f"files[{index}]"
        if not isinstance(entry, dict):
            errors.append(f"{where}: must be a table")
            continue
        where = f"files[{index}] ({entry.get('id', '?')})"
        for field in sorted(set(entry) - FILE_FIELDS):
            errors.append(f"{where}: unknown field {field!r}")
        for field in sorted(FILE_REQUIRED - set(entry)):
            errors.append(f"{where}: missing field {field!r}")

        file_id = entry.get("id")
        if isinstance(file_id, str):
            if file_id in seen_ids:
                errors.append(f"{where}: duplicate id")
            seen_ids.add(file_id)

        host_file = entry.get("host_file")
        if isinstance(host_file, str):
            if not host_file.startswith("/") or host_file.endswith("/") or ".." in host_file:
                errors.append(f"{where}: host_file must be a clean absolute file path")
            if host_file in seen_hosts:
                errors.append(f"{where}: host_file {host_file} is rendered by another entry")
            seen_hosts.add(host_file)

        for field in ("owner", "group"):
            value = entry.get(field)
            if value is not None and not (isinstance(value, str) and ACCOUNT_RE.match(value)):
                errors.append(f"{where}: invalid {field} {value!r}")

        mode = entry.get("mode")
        if mode is not None:
            if not (isinstance(mode, str) and MODE_RE.match(mode)):
                errors.append(f'{where}: mode must be a 4 digit octal string, e.g. "0600"')
            elif int(mode, 8) & 0o007:
                errors.append(f"{where}: mode {mode} grants access to others")

        env = entry.get("infisical_env")
        if env is not None and env not in ENVS:
            errors.append(f"{where}: infisical_env must be one of {sorted(ENVS)}")

        sources = entry.get("sources")
        if not isinstance(sources, list) or not sources:
            errors.append(f"{where}: sources must be a non-empty list")
            sources = []
        parsed: list[tuple[str, list[str]]] = []
        for number, source in enumerate(sources):
            at = f"{where}.sources[{number}]"
            if not isinstance(source, dict) or set(source) != {"path", "keys"}:
                errors.append(f'{at}: must be {{ path = "/folder", keys = "key_set" }}')
                continue
            path, ref = source["path"], source["keys"]
            if not (
                isinstance(path, str)
                and path.startswith("/")
                and (path == "/" or not path.endswith("/"))
            ):
                errors.append(f"{at}: path {path!r} must start with / and not end with /")
                continue
            if not isinstance(ref, str) or ref not in key_sets:
                errors.append(f"{at}: keys must name an existing key_set, got {ref!r}")
                continue
            used_sets.add(ref)
            parsed.append((path, key_sets[ref]))
        source_paths = [path for path, _ in parsed]
        if len(set(source_paths)) != len(source_paths):
            errors.append(f"{where}: the same folder is listed twice in sources")
        keys = [key for _, ks in parsed for key in ks]
        for dup in sorted({k for k in keys if keys.count(k) > 1}):
            errors.append(f"{where}: key {dup} appears in more than one source")

        phase = entry.get("phase", "base")
        if phase not in PHASES:
            errors.append(f"{where}: phase must be one of {sorted(PHASES)}")

        units = entry.get("units")
        if not isinstance(units, list) or not units:
            errors.append(f"{where}: units must be a non-empty list")
        else:
            for unit in units:
                if not (isinstance(unit, str) and UNIT_RE.match(unit)):
                    errors.append(f"{where}: invalid unit {unit!r} (must end in .service)")

        static = entry.get("static", {})
        if not isinstance(static, dict):
            errors.append(f'{where}: static must be a table of KEY = "value"')
        else:
            for key, value in static.items():
                if not KEY_RE.match(key):
                    errors.append(f"{where}: invalid static key {key!r} (UPPER_SNAKE_CASE)")
                if not isinstance(value, str) or not value:
                    errors.append(f"{where}: static {key} must be a non-empty string")
                if key in keys:
                    errors.append(f"{where}: static key {key} overlaps an Infisical key")

        if isinstance(env, str):
            for path, ks in parsed:
                claimed.setdefault((env, path), set()).update(ks)

    for (env, path), keys in sorted(claimed.items()):
        for key in sorted(keys & set(unrendered)):
            errors.append(
                f"{env}:{path}: key {key} is both rendered by a file and listed in unrendered_keys"
            )

    for name in sorted(set(key_sets) - used_sets):
        errors.append(f"key_sets.{name}: not referenced by any file")

    return errors


def main(argv: list[str]) -> int:
    as_json = "--json" in argv
    args = [a for a in argv if a != "--json"]
    path = Path(args[0]) if args else DEFAULT_PATH
    try:
        doc = tomllib.loads(path.read_text())
    except (OSError, tomllib.TOMLDecodeError) as err:
        errors = [f"{path}: {err}"]
    else:
        errors = validate(doc)
    if as_json:
        print(json.dumps({"path": str(path), "valid": not errors, "errors": errors}, indent=2))
    elif errors:
        print(f"secrets manifest INVALID ({path}):", file=sys.stderr)
        for line in errors:
            print(f"  - {line}", file=sys.stderr)
    else:
        print(f"secrets manifest ok ({path})")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
