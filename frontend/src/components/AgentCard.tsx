import type { Agent } from "../types/agent";

interface AgentCardProps {
  agent: Agent;
  canManage: boolean;
  onEdit: (agent: Agent) => void;
  onDelete: (agent: Agent) => void;
  onToggleStatus: (agent: Agent) => void;
}

const AgentCard = ({
  agent,
  canManage,
  onEdit,
  onDelete,
  onToggleStatus,
}: AgentCardProps) => {
  return (
    <div className="agent-card">
      <div className="agent-card-header">
        <div className="agent-icon">🤖</div>

        <div>
          <h3>{agent.name}</h3>

          <span className={`status ${agent.status}`}>
            <span className="status-dot" />
            {agent.status}
          </span>
        </div>
      </div>

      <p className="agent-description">
        {agent.description || "No description provided."}
      </p>

      <div className="agent-details">
        <div>
          <span>Model</span>
          <strong>{agent.modelName}</strong>
        </div>

        <div>
          <span>Tone</span>
          <strong>{agent.tone}</strong>
        </div>

        <div>
          <span>Temperature</span>
          <strong>{agent.temperature}</strong>
        </div>
      </div>

      {canManage && (
        <div className="agent-actions">
          <button onClick={() => onEdit(agent)}>Edit</button>

          <button onClick={() => onToggleStatus(agent)}>
            {agent.status === "active" ? "Deactivate" : "Activate"}
          </button>

          <button className="danger-button" onClick={() => onDelete(agent)}>
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default AgentCard;
