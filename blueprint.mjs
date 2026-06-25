{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Blueprint: Optimize current file",
      "type": "shell",
      "command": "node",
      "args": ["${workspaceFolder}/.vscode/optimize-file.mjs", "${file}", "balanced"],
      "problemMatcher": [],
      "presentation": { "reveal": "always", "panel": "shared" }
    },
    {
      "label": "Blueprint: Reduce tokens (max)",
      "type": "shell",
      "command": "node",
      "args": ["${workspaceFolder}/.vscode/optimize-file.mjs", "${file}", "reduce"],
      "problemMatcher": []
    }
  ]
}
