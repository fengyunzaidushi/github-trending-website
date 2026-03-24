#!/usr/bin/env python3
from __future__ import annotations

import argparse
import re
from pathlib import Path


SQL_FENCE_START = re.compile(r"^\s*```sql\b", re.IGNORECASE)
FENCE_END = re.compile(r"^\s*```")
MARKDOWN_SUFFIXES = {".md", ".markdown"}


def extract_sql_blocks(content: str) -> list[str]:
    blocks: list[str] = []
    current: list[str] = []
    inside_sql_block = False

    for line in content.splitlines():
        if not inside_sql_block and SQL_FENCE_START.match(line):
            inside_sql_block = True
            current = []
            continue

        if inside_sql_block and FENCE_END.match(line):
            block = "\n".join(current).strip()
            if block:
                blocks.append(block)
            inside_sql_block = False
            current = []
            continue

        if inside_sql_block:
            current.append(line)

    return blocks


def iter_markdown_files(root: Path) -> list[Path]:
    files = [
        path
        for path in root.rglob("*")
        if path.is_file() and path.suffix.lower() in MARKDOWN_SUFFIXES
    ]
    files.sort(key=lambda path: str(path.relative_to(root)).lower())
    return files


def build_output_text(relative_path: Path, sql_blocks: list[str]) -> str:
    parts: list[str] = []

    for index, block in enumerate(sql_blocks, start=1):
        parts.append(f"-- Source: {relative_path.as_posix()}")
        parts.append(f"-- Block: {index}")
        parts.append("")
        parts.append(block)
        parts.append("")

    return "\n".join(parts).rstrip() + "\n"


def write_sql_file(
    input_root: Path,
    output_root: Path,
    markdown_path: Path,
    sql_blocks: list[str],
) -> Path:
    relative_path = markdown_path.relative_to(input_root)
    output_path = output_root / relative_path.with_suffix(".sql")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        build_output_text(relative_path, sql_blocks),
        encoding="utf-8",
        newline="\n",
    )
    return output_path


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Extract all ```sql``` code blocks from markdown files."
    )
    parser.add_argument(
        "input_dir",
        nargs="?",
        default=".history",
        help="Input directory to scan recursively. Default: .history",
    )
    parser.add_argument(
        "output_dir",
        nargs="?",
        default=".history_sql",
        help="Output directory for extracted .sql files. Default: .history_sql",
    )
    args = parser.parse_args()

    input_root = Path(args.input_dir).resolve()
    output_root = Path(args.output_dir).resolve()

    if not input_root.exists():
        raise SystemExit(f"Input directory does not exist: {input_root}")

    if not input_root.is_dir():
        raise SystemExit(f"Input path is not a directory: {input_root}")

    markdown_files = iter_markdown_files(input_root)
    extracted_files = 0
    extracted_blocks = 0

    for markdown_path in markdown_files:
        content = markdown_path.read_text(encoding="utf-8", errors="ignore")
        sql_blocks = extract_sql_blocks(content)

        if not sql_blocks:
            continue

        output_path = write_sql_file(input_root, output_root, markdown_path, sql_blocks)
        extracted_files += 1
        extracted_blocks += len(sql_blocks)
        print(
            f"[OK] {markdown_path.relative_to(input_root).as_posix()} "
            f"-> {output_path.relative_to(output_root).as_posix()} "
            f"({len(sql_blocks)} blocks)"
        )

    print(
        f"Done. Scanned {len(markdown_files)} markdown files, "
        f"extracted {extracted_blocks} SQL blocks into {extracted_files} files."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
