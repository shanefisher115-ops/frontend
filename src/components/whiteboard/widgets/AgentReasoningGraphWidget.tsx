import React, { useState } from "react";
import type {
  AgentGraphWidgetData,
  AgentNode,
} from "../../../types/whiteboard";

interface AgentReasoningGraphWidgetProps {
  data: AgentGraphWidgetData;
  onChange: (updates: Partial<AgentGraphWidgetData>) => void;
}

const TYPE_BADGES: Record<AgentNode["type"], { label: string; color: string }> = {
  input: { label: "Prompt Input", color: "#60a5fa" },
  reasoning: { label: "LLM Reasoning", color: "#a78bfa" },
  tool: { label: "Tool Action", color: "#f59e0b" },
  database: { label: "Supabase DB", color: "#34d39e" },
  output: { label: "Synthesis", color: "#10b981" },
};

export function AgentReasoningGraphWidget({
  data,
  onChange,
}: AgentReasoningGraphWidgetProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
    data.activeNodeId || data.nodes[0]?.id || null
  );

  const activeNode = data.nodes.find((n) => n.id === selectedNodeId);

  const handleRunSimulation = () => {
    onChange({ executionStatus: "running" });

    // Step through nodes
    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < data.nodes.length) {
        const currentNode = data.nodes[stepIndex];
        setSelectedNodeId(currentNode.id);
        const updatedNodes = data.nodes.map((n, idx) => ({
          ...n,
          status:
            idx < stepIndex
              ? ("completed" as const)
              : idx === stepIndex
              ? ("running" as const)
              : ("idle" as const),
        }));
        onChange({ nodes: updatedNodes, activeNodeId: currentNode.id });
        stepIndex++;
      } else {
        clearInterval(interval);
        const finalNodes = data.nodes.map((n) => ({
          ...n,
          status: "completed" as const,
        }));
        onChange({
          nodes: finalNodes,
          executionStatus: "completed",
          activeNodeId: finalNodes[finalNodes.length - 1]?.id,
        });
      }
    }, 700);
  };

  const handleReset = () => {
    const resetNodes = data.nodes.map((n) => ({
      ...n,
      status: "idle" as const,
    }));
    onChange({
      nodes: resetNodes,
      executionStatus: "idle",
      activeNodeId: resetNodes[0]?.id,
    });
    setSelectedNodeId(resetNodes[0]?.id || null);
  };

  return (
    <div className="agent-widget">
      {/* Agent Top Control Bar */}
      <div className="agent-widget__header">
        <div className="agent-widget__title-block">
          <input
            type="text"
            className="agent-input-name"
            value={data.agentName}
            onChange={(e) => onChange({ agentName: e.target.value })}
          />
          <span className={`agent-status-tag agent-status-tag--${data.executionStatus}`}>
            {data.executionStatus.toUpperCase()}
          </span>
        </div>

        <div className="agent-widget__actions">
          <button
            type="button"
            className="agent-btn agent-btn--secondary"
            onClick={handleReset}
          >
            Reset
          </button>
          <button
            type="button"
            className="agent-btn agent-btn--primary"
            onClick={handleRunSimulation}
            disabled={data.executionStatus === "running"}
          >
            {data.executionStatus === "running" ? "Simulating..." : "▶ Run Graph"}
          </button>
        </div>
      </div>

      {/* Prompt input */}
      <div className="agent-prompt-box">
        <span className="agent-prompt-label">Goal / Prompt:</span>
        <input
          type="text"
          className="agent-prompt-input"
          value={data.promptText}
          onChange={(e) => onChange({ promptText: e.target.value })}
        />
      </div>

      {/* Main Node Graph Canvas / Layout */}
      <div className="agent-graph-container">
        <div className="agent-nodes-flow">
          {data.nodes.map((node, index) => {
            const badge = TYPE_BADGES[node.type];
            const isSelected = node.id === selectedNodeId;

            return (
              <React.Fragment key={node.id}>
                {index > 0 && <div className="agent-flow-connector">➔</div>}
                <div
                  className={`agent-node-card ${isSelected ? "agent-node-card--selected" : ""} agent-node-card--${node.status}`}
                  onClick={() => setSelectedNodeId(node.id)}
                >
                  <div className="agent-node-card__type" style={{ color: badge.color }}>
                    {badge.label}
                  </div>
                  <div className="agent-node-card__label">{node.label}</div>
                  <div className="agent-node-card__footer">
                    <span className={`agent-node-badge agent-node-badge--${node.status}`}>
                      {node.status}
                    </span>
                    {node.durationMs && (
                      <span className="agent-node-duration">{node.durationMs}ms</span>
                    )}
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Selected Node Inspector Drawer */}
        {activeNode && (
          <div className="agent-node-inspector">
            <div className="agent-inspector-header">
              <strong>Node Inspector: {activeNode.label}</strong>
              <span style={{ color: TYPE_BADGES[activeNode.type].color }}>
                {TYPE_BADGES[activeNode.type].label}
              </span>
            </div>
            <p className="agent-inspector-details">{activeNode.details}</p>
            {activeNode.payload && (
              <pre className="agent-inspector-payload">{activeNode.payload}</pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
