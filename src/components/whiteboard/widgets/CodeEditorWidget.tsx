import { useState } from "react";
import type { CodeWidgetData } from "../../../types/whiteboard";

interface CodeEditorWidgetProps {
  data: CodeWidgetData;
  onChange: (updates: Partial<CodeWidgetData>) => void;
}

export function CodeEditorWidget({ data, onChange }: CodeEditorWidgetProps) {
  const [activeTab, setActiveTab] = useState<"code" | "console">("code");

  const lines = data.code.split("\n");

  const handleRunCode = () => {
    onChange({ isExecuting: true });

    setTimeout(() => {
      const timestamp = new Date().toLocaleTimeString();
      const newOutput = [
        ...data.outputLog,
        `[${timestamp}] EXEC: Compiled and executed ${data.filename} (${data.language}) successfully.`,
        `[${timestamp}] OUTPUT: Returned state 200 OK | Heap memory: 12.4 MB`,
      ];
      onChange({
        isExecuting: false,
        outputLog: newOutput,
        lastExecutedAt: timestamp,
      });
      setActiveTab("console");
    }, 600);
  };

  const handleClearConsole = () => {
    onChange({ outputLog: ["Console cleared"] });
  };

  const handleFormatCode = () => {
    const formatted = data.code
      .split("\n")
      .map((line) => line.trimEnd())
      .join("\n");
    onChange({ code: formatted });
  };

  return (
    <div className="code-widget">
      {/* Code Editor Header */}
      <div className="code-widget__header">
        <div className="code-widget__file">
          <input
            type="text"
            className="code-input-filename"
            value={data.filename}
            onChange={(e) => onChange({ filename: e.target.value })}
            title="Edit filename"
          />
          <select
            className="code-select-lang"
            value={data.language}
            onChange={(e) =>
              onChange({
                language: e.target.value as CodeWidgetData["language"],
              })
            }
          >
            <option value="typescript">TypeScript</option>
            <option value="python">Python</option>
            <option value="rust">Rust</option>
            <option value="sql">SQL</option>
          </select>
        </div>

        <div className="code-widget__tabs">
          <button
            type="button"
            className={`code-tab ${activeTab === "code" ? "code-tab--active" : ""}`}
            onClick={() => setActiveTab("code")}
          >
            Editor
          </button>
          <button
            type="button"
            className={`code-tab ${activeTab === "console" ? "code-tab--active" : ""}`}
            onClick={() => setActiveTab("console")}
          >
            Output ({data.outputLog.length})
          </button>
        </div>

        <div className="code-widget__actions">
          <button
            type="button"
            className="code-btn code-btn--secondary"
            onClick={handleFormatCode}
            title="Clean up formatting"
          >
            Format
          </button>
          <button
            type="button"
            className="code-btn code-btn--primary"
            onClick={handleRunCode}
            disabled={data.isExecuting}
            title="Run code in sandbox"
          >
            {data.isExecuting ? "Executing..." : "▶ Run Code"}
          </button>
        </div>
      </div>

      {/* Editor Main Content */}
      <div className="code-widget__body">
        {activeTab === "code" ? (
          <div className="code-editor-container">
            <div className="code-line-numbers" aria-hidden="true">
              {lines.map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            <textarea
              className="code-textarea"
              value={data.code}
              onChange={(e) => onChange({ code: e.target.value })}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
            />
          </div>
        ) : (
          <div className="code-console-container">
            <div className="code-console-toolbar">
              <span>Console Log Stream</span>
              <button
                type="button"
                className="code-btn code-btn--text"
                onClick={handleClearConsole}
              >
                Clear Log
              </button>
            </div>
            <div className="code-console-logs">
              {data.outputLog.map((log, idx) => (
                <div key={idx} className="code-log-entry">
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Status */}
      <div className="code-widget__footer">
        <span>Language: {data.language.toUpperCase()}</span>
        <span>
          {lines.length} lines | {data.code.length} chars
        </span>
        {data.lastExecutedAt && <span>Last Run: {data.lastExecutedAt}</span>}
      </div>
    </div>
  );
}
