import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

interface Conversation {
  _id: string;
  title?: string;
  status: "open" | "closed";
  resolution: "unresolved" | "ai_resolved" | "human_resolved";
  agentId:
    | string
    | {
        _id: string;
        name: string;
      };
  createdAt: string;
  updatedAt: string;
}

interface Agent {
  _id: string;
  name: string;
  description?: string;
  status: "active" | "inactive";
}

type ConversationFilter =
  | "all"
  | "unresolved"
  | "ai_resolved"
  | "human_resolved";

const Conversations = () => {
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filter, setFilter] = useState<ConversationFilter>("all");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [creatingConversation, setCreatingConversation] = useState(false);
  const [newChatError, setNewChatError] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [conversationsResponse, agentsResponse] = await Promise.all([
        api.get("/conversations"),
        api.get("/agents"),
      ]);

      setConversations(conversationsResponse.data.conversations || []);

      setAgents(
        (agentsResponse.data.agents || []).filter(
          (agent: Agent) => agent.status === "active",
        ),
      );
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to load conversations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const getAgentName = (agentId: Conversation["agentId"]) => {
    if (typeof agentId === "string") {
      return "AI Agent";
    }

    return agentId.name;
  };

  const filteredConversations = useMemo(() => {
    if (filter === "all") {
      return conversations;
    }

    return conversations.filter(
      (conversation) => conversation.resolution === filter,
    );
  }, [conversations, filter]);

  const handleCreateConversation = () => {
    if (!selectedAgentId) {
      setNewChatError("Please select an AI agent.");
      return;
    }

    setShowNewChat(false);
    setSelectedAgentId("");
    setNewChatError("");

    navigate(`/support?new=true&agent=${selectedAgentId}`);
  };

  return (
    <div className="conversations-page">
      <header className="conversations-header">
        <div>
          <h1>Conversations</h1>
          <p>View and manage customer conversations.</p>
        </div>
        <button
          type="button"
          className="secondary-button"
          onClick={fetchConversations}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
        <button
          className="primary-button"
          onClick={() => {
            setShowNewChat(true);
            setNewChatError("");
            setSelectedAgentId("");
          }}
        >
          + New Chat
        </button>
      </header>

      {error && <div className="error-message">{error}</div>}

      {!loading && conversations.length > 0 && (
        <div className="conversation-filters">
          <button
            type="button"
            className={
              filter === "all"
                ? "conversation-filter active"
                : "conversation-filter"
            }
            onClick={() => setFilter("all")}
          >
            All
          </button>

          <button
            type="button"
            className={
              filter === "unresolved"
                ? "conversation-filter active"
                : "conversation-filter"
            }
            onClick={() => setFilter("unresolved")}
          >
            Unresolved
          </button>

          <button
            type="button"
            className={
              filter === "ai_resolved"
                ? "conversation-filter active"
                : "conversation-filter"
            }
            onClick={() => setFilter("ai_resolved")}
          >
            AI Resolved
          </button>

          <button
            type="button"
            className={
              filter === "human_resolved"
                ? "conversation-filter active"
                : "conversation-filter"
            }
            onClick={() => setFilter("human_resolved")}
          >
            Human Resolved
          </button>
        </div>
      )}

      {loading ? (
        <div className="loading">Loading conversations...</div>
      ) : conversations.length === 0 ? (
        <div className="conversation-empty">
          <div className="conversation-empty-icon">💬</div>

          <h2>No conversations yet</h2>

          <p>Start a new AI support conversation to see it here.</p>
        </div>
      ) : filteredConversations.length === 0 ? (
        <div className="conversation-empty">
          <div className="conversation-empty-icon">🔎</div>

          <h2>No matching conversations</h2>

          <p>There are no conversations in this category.</p>
        </div>
      ) : (
        <div className="conversation-list">
          {filteredConversations.map((conversation) => (
            <button
              type="button"
              className="conversation-card"
              key={conversation._id}
              onClick={() =>
                navigate(`/support?conversation=${conversation._id}`)
              }
            >
              <div className="conversation-card-main">
                <h3>{conversation.title || "Untitled Conversation"}</h3>

                <p>{getAgentName(conversation.agentId)}</p>
              </div>

              <div className="conversation-card-meta">
                {conversation.status === "open" &&
                  conversation.resolution === "unresolved" && (
                    <span className="conversation-resolution-badge open">
                      Open
                    </span>
                  )}

                {conversation.resolution === "ai_resolved" && (
                  <span className="conversation-resolution-badge ai_resolved">
                    AI Resolved
                  </span>
                )}

                {conversation.resolution === "human_resolved" && (
                  <span className="conversation-resolution-badge human_resolved">
                    Human Resolved
                  </span>
                )}
                <span className="conversation-updated">
                  Last Updated at{" "}
                  {new Date(conversation.updatedAt).toLocaleString()}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
      {showNewChat && (
        <div className="new-chat-overlay" onClick={() => setShowNewChat(false)}>
          <div
            className="new-chat-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="new-chat-header">
              <div>
                <h2>Start New Chat</h2>
                <p>Choose an AI agent for this conversation.</p>
              </div>

              <button
                type="button"
                className="new-chat-close"
                onClick={() => setShowNewChat(false)}
              >
                ×
              </button>
            </div>

            {agents.length === 0 ? (
              <div className="new-chat-empty">
                <strong>No active AI agents</strong>
                <p>
                  Create and activate an AI agent before starting a
                  conversation.
                </p>
              </div>
            ) : (
              <>
                <div className="agent-selection-list">
                  {agents.map((agent) => (
                    <button
                      type="button"
                      key={agent._id}
                      className={`agent-selection-card ${
                        selectedAgentId === agent._id ? "selected" : ""
                      }`}
                      onClick={() => setSelectedAgentId(agent._id)}
                    >
                      <div className="agent-selection-icon">🤖</div>

                      <div className="agent-selection-info">
                        <strong>{agent.name}</strong>

                        {agent.description && <span>{agent.description}</span>}
                      </div>

                      <div className="agent-selection-check">
                        {selectedAgentId === agent._id ? "✓" : ""}
                      </div>
                    </button>
                  ))}
                </div>

                {newChatError && (
                  <div className="new-chat-error">{newChatError}</div>
                )}

                <div className="new-chat-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setShowNewChat(false)}
                    disabled={creatingConversation}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="primary-button"
                    onClick={handleCreateConversation}
                    disabled={!selectedAgentId || creatingConversation}
                  >
                    {creatingConversation ? "Starting..." : "Start Chat"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Conversations;
