import { useEffect, useMemo, useState } from "react";
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

interface ConversationsResponse {
  success: boolean;
  count: number;
  conversations: Conversation[];
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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get<ConversationsResponse>("/conversations");

        setConversations(response.data.conversations);
      } catch (error: any) {
        setError(
          error.response?.data?.message || "Failed to load conversations",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, []);

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

  return (
    <div className="conversations-page">
      <header className="conversations-header">
        <div>
          <h1>Conversations</h1>

          <p>View and manage your AI support conversations.</p>
        </div>
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
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Conversations;
