---
description: Suggest keywords for a new topic, append to search_list.txt, and run the search
---

When the user wants to search for trending repositories on a specific topic (e.g., by calling `/search-topic 视频生成`), follow these steps:

1. **Brainstorm Comprehensive Keywords:**
   - Analyze the requested theme. (If the user provided reference materials or specific requirements, incorporate them).
   - Brainstorm a rich set of Chinese and English keywords, including synonyms, core concepts, abbreviation, and names of representative tools/frameworks.
   - Ensure the first term is the core Chinese/English concept because it will be used as the file name prefix.
   - Format them with `|` as separators (e.g. `视频生成|video generation|text-to-video|Sora|runway|生成式视频`).

2. **Append to Search List:**
   - Use the appropriate local tool (e.g., `write_to_file` or `replace_file_content`) to append this newly formatted string as a new line at the bottom of `scripts/search_list.txt`.

3. **Execute the Search Script:**
// turbo
   - Automatically run the search script for the latest added line: `python scripts/search_novels.py` (it defaults to reading the last line when no index is provided).
   - Read the console output to verify if the export was successful and how many repositories were found.

4. **Summarize for the User:**
   - Present the user with the generated keywords you added.
   - Inform them of the final result, including how many repositories matched and the names of the saved JSON files (`full` and `compact`).
