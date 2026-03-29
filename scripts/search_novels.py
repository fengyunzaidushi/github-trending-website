#!/usr/bin/env python3
import json
import argparse
import sys
import os

def read_keywords_from_list(list_file, idx=-1, start_range=-1):
    try:
        with open(list_file, 'r', encoding='utf-8') as f:
            lines = [line.strip() for line in f if line.strip()]
        if not lines:
            print(f"Error: '{list_file}' is empty.")
            sys.exit(1)
            
        target_lines = []
        if start_range != -1:
            if 1 <= start_range <= len(lines):
                for i in range(start_range - 1, len(lines)):
                    target_lines.append((i + 1, lines[i]))
            else:
                print(f"Error: range start {start_range} is out of bounds. The file '{list_file}' has {len(lines)} lines.")
                sys.exit(1)
        elif idx == -1:
            target_lines = [(len(lines), lines[-1])]
        else:
            if 1 <= idx <= len(lines):
                target_lines = [(idx, lines[idx - 1])]
            else:
                print(f"Error: idx {idx} is out of range. The file '{list_file}' has {len(lines)} lines.")
                sys.exit(1)
        
        parsed_themes = []
        for line_idx, target_line in target_lines:
            keywords = [k.strip() for k in target_line.split('|') if k.strip()]
            safe_theme_name = keywords[0].replace('.', '').replace(' ', '') if keywords else "unknown"
            numbered_theme_name = f"{line_idx:03d}_{safe_theme_name}"
            parsed_themes.append((keywords, numbered_theme_name))
            
        return parsed_themes
    except FileNotFoundError:
        print(f"Error: File '{list_file}' not found.")
        sys.exit(1)

def search_repositories(json_file, keywords, theme_name, data=None):
    if data is None:
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            print(f"Loading {len(data)} repositories from {json_file}...")
        except FileNotFoundError:
            print(f"Error: File '{json_file}' not found.")
            sys.exit(1)
        except json.JSONDecodeError:
            print(f"Error: File '{json_file}' is not a valid JSON.")
            sys.exit(1)
        
    print(f"\n=======================================================")
    print(f"Searching for keywords: {keywords}")
    
    results = []
    for repo in data:
        desc = repo.get('description') or ''
        zh_desc = repo.get('zh_description') or ''
        overview = repo.get('overview') or ''
        
        
        matched = False
        for k in keywords:
            if k in desc or k in zh_desc or k in overview:
                matched = True
                break
                
        if matched:
            results.append(repo)

    print(f"\nFound {len(results)} repositories matching '{theme_name}':")
    
    full_output_dir = os.path.join('data', 'search', 'full')
    compact_output_dir = os.path.join('data', 'search', 'compact')
    os.makedirs(full_output_dir, exist_ok=True)
    os.makedirs(compact_output_dir, exist_ok=True)
    
    base_name = os.path.basename(json_file).replace('.json', '')
    
    output_file = os.path.join(full_output_dir, f"{base_name}_{theme_name}.json")
    output_file_compact = os.path.join(compact_output_dir, f"{base_name}_{theme_name}_compact.json")
    
    with open(output_file, 'w', encoding='utf-8') as out_f:
        json.dump(results, out_f, ensure_ascii=False, indent=2)
        
    compact_results = []
    for r in results:
        overview_text = r.get('overview') or ''
        compact_results.append({
            'name': r.get('name'),
            'url': r.get('url'),
            'language': r.get('language'),
            'description': r.get('description'),
            'github_created_at': r.get('github_created_at'),
            'pushed_at': r.get('pushed_at'),
            'overview': overview_text[:300]
        })

    with open(output_file_compact, 'w', encoding='utf-8') as out_f:
        json.dump(compact_results, out_f, ensure_ascii=False, indent=2)
            
    print(f"✅ 完整搜索已导出: {output_file}")
    print(f"✅ 精简搜索已导出: {output_file_compact}")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Search exported GitHub repositories JSON file.")
    parser.add_argument('--file', '-f', default='data/repos_data_json/repositories_export_part1.json', help='Path to the JSON file')
    parser.add_argument('--list', '-l', default='scripts/search_list.txt', help='Path to the search list text file')
    parser.add_argument('--idx', '-i', type=int, default=-1, help='Line index to search (1-indexed). Defaults to -1 (last line).')
    parser.add_argument('--range', '-r', type=int, default=-1, help='Start line index to process till the end (1-indexed). Overrides --idx if provided.')
    args = parser.parse_args()
    
    themes = read_keywords_from_list(args.list, args.idx, args.range)
    
    # Load data once to avoid reloading for every theme
    try:
        with open(args.file, 'r', encoding='utf-8') as f:
            preloaded_data = json.load(f)
            print(f"Loading {len(preloaded_data)} repositories from {args.file}...")
    except FileNotFoundError:
        print(f"Error: File '{args.file}' not found.")
        sys.exit(1)
        
    for keywords, theme_name in themes:
        search_repositories(args.file, keywords, theme_name, data=preloaded_data)
        
    print(f"\n✨ All search tasks completed!")
