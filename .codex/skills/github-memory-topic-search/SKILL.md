---
name: github-memory-topic-search
description: Use when searching this project's GitHub Trending export for AI memory, agent memory, long-term memory, persistent context, Claude Code memory plugins, or related repository clusters; generates/improves multilingual keywords, appends them to scripts/search_list.txt, runs scripts/search_novels.py, and summarizes matches by language.
---

# GitHub Memory Topic Search

## Overview

Search the local GitHub Trending repository export for AI/Agent memory projects, using the project workflow in `.agent/workflows/search-topic.md`.

Use this skill to turn a memory-related topic into a durable `scripts/search_list.txt` keyword row, run the local search, and report the generated JSON files plus language clusters.

Memory projects are spread across multiple repository export shards. A high-quality run should search all `data/repos_data_json/repositories_export_part*.json` files, not only the script default `repositories_export_part1.json`.

## Workflow

1. Read `.agent/workflows/search-topic.md` if the user asks to follow the project workflow or if the workflow may have changed.
2. Build a `|`-separated keyword row. The first term becomes the output filename prefix, so choose a concise core term such as `AI记忆`.
3. Include Chinese and English terms, synonyms, abbreviations, product/project names, and related implementation concepts.
4. Append the row to `scripts/search_list.txt` as a new final line.
5. Run the search across all repository export parts:

```bash
python scripts/search_novels.py --all-parts
```

6. Read the output. Report the number of matched repositories and both exported file paths under `data/search/full/` and `data/search/compact/`.
7. Run a sentinel check against the compact or full output for known representative memory repositories. At minimum, check for `supermemoryai/supermemory`. If a sentinel is missing, search `data/repos_data_json/repositories_export_part*.json` directly before reporting; a missing sentinel usually means the run searched only one shard, did not match name/url/owner fields, or the local export is stale.
8. If the user asks for analysis, read the compact JSON first and group results by `language`. Read the full JSON only when overview detail is needed.

## Memory Keyword Guidance

Prefer precise memory terms over broad terms such as `context`, `knowledge`, or `RAG` alone; broad terms pull in many general AI platforms.

Use the bundled reference when refreshing the keyword row:

- `references/memory-keywords.md`

Include these concept families when relevant:

- Agent memory: `agent memory`, `AI memory`, `LLM memory`, `智能体记忆`, `AI记忆`
- Persistence: `long-term memory`, `persistent memory`, `cross-session memory`, `长期记忆`, `持久化记忆`, `跨会话记忆`
- Memory architecture: `memory layer`, `memory system`, `memory store`, `memory database`, `记忆层`, `记忆系统`, `记忆库`
- Retrieval and compression: `memory extraction`, `memory retrieval`, `memory compression`, `记忆提取`, `记忆检索`, `记忆压缩`
- Memory types: `semantic memory`, `episodic memory`, `procedural memory`, `working memory`, `语义记忆`, `情景记忆`, `程序性记忆`
- Storage modes: `vector memory`, `graph memory`, `knowledge graph memory`, `向量记忆`, `图记忆`, `知识图谱记忆`
- Representative projects: `supermemoryai/supermemory`, `supermemory`, `Supermemory`, `mem0`, `OpenMemory`, `MemGPT`, `Letta`, `Zep`, `claude-supermemory`, `claude-mem`, `opencode-supermemory`, `openclaw-supermemory`, `agentmemory`, `memvid`, `MIRIX`, `MemoryOS`, `MemU`, `Memobase`, `LangMem`

## Recommended Keyword Row

Use this row unless the user asks for a narrower memory subtopic:

```text
AI记忆|agent memory|Agent Memory|AI memory|LLM memory|long-term memory|persistent memory|memory layer|memory system|conversation memory|context memory|semantic memory|episodic memory|procedural memory|working memory|memory extraction|memory retrieval|memory compression|memory store|memory database|vector memory|graph memory|knowledge graph memory|cross-session memory|session memory|user memory|personal memory|Supermemory|supermemory|supermemoryai/supermemory|supermemoryai|openmemory|OpenMemory|mem0|Mem0|MemGPT|Letta|Zep|claude-supermemory|opencode-supermemory|openclaw-supermemory|claude-mem|agentmemory|AgentMemory|memvid|Memvid|MIRIX|MemoryOS|MemU|memU|Memobase|LangMem|LangGraph memory|CrewAI memory|AutoGen memory|智能体记忆|AI记忆|长期记忆|持久化记忆|持久记忆|跨会话记忆|会话记忆|对话记忆|上下文记忆|语义记忆|情景记忆|程序性记忆|工作记忆|记忆层|记忆系统|记忆库|记忆存储|记忆数据库|记忆提取|记忆检索|记忆压缩|用户记忆|用户偏好记忆|个人记忆|向量记忆|图记忆|知识图谱记忆
```

## Search Script Notes

`scripts/search_novels.py --all-parts` searches every `data/repos_data_json/repositories_export_part*.json` shard and writes output using the `repositories_export_all` prefix.

The script uses literal substring matching over repository metadata and overview text, so include common casing variants for project names and English phrases. Repository names, owners, repo names, and URLs matter for branded projects such as `supermemoryai/supermemory`.

The default script behavior reads the final non-empty line from `scripts/search_list.txt`, so append the keyword row immediately before running it. Avoid relying on the script's default file argument for memory searches because that only scans part 1.

## Sentinel Repositories

Use these as quick quality checks for broad AI memory searches when the local export contains them:

- `supermemoryai/supermemory` — memory and context layer for AI agents; should be found in all broad memory searches.
- `plastic-labs/honcho` — agent memory infrastructure.
- `vectorize-io/hindsight` — agent memory system.
- `agentscope-ai/ReMe` — memory management toolkit for AI agents.
- `thedotmack/claude-mem` — Claude Code persistent memory.
- `memvid/memvid` — single-file memory layer for AI agents.

If `supermemoryai/supermemory` is missing, do not present the search as complete until you have checked all shards or explained that the local export does not contain it.

## Reporting

Summarize in Chinese unless the user asks otherwise.

Include:

- the exact keyword row added or updated
- matched repository count from script output
- full and compact export paths
- language distribution when the user asks to distinguish languages
- 5-10 high-signal repositories with `name`, `language`, `url`, and a short reason they match memory

Call out obvious false positives when broad keyword terms match unrelated educational or documentation projects.
