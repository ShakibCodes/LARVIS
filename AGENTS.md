<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:context-awareness-rules -->
# Context-first interpretation

When the user uses ambiguous phrases like "here", "this", "in this", or "run code here", interpret them as the current working context first:
- If an IDE/editor is implied (for example VS Code), answer for that IDE by default.
- If the user is in this repository, prefer repo-specific commands and paths.
- If multiple contexts are possible, choose the most immediate one (current IDE > current repo > general environment) and state the assumption in one short line.
- Ask a clarifying question only if choosing the wrong context could cause harmful or destructive actions.
<!-- END:context-awareness-rules -->
