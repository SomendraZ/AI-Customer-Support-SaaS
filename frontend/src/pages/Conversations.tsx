import { useEffect, useState } from "react";
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

const Conversations = () => {
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<Conversation[]>([]);

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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  return (
    <div className="conversations-page">
      <header className="page-header">
        <div>
          <h1>Conversations</h1>
          <p>View and manage your AI support conversations.</p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={() => navigate("/support")}
        >
          + New Chat
        </button>
      </header>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Loading conversations...</div>
      ) : conversations.length === 0 ? (
        <div className="conversation-empty">
          <div className="conversation-empty-icon">💬</div>

          <h2>No conversations yet</h2>

          <p>Start a new AI support conversation to see it here.</p>

          <button
            type="button"
            className="primary-button"
            onClick={() => navigate("/support")}
          >
            Start New Chat
          </button>
        </div>
      ) : (
        <div className="conversation-list">
          {conversations.map((conversation) => (
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
                <span className={`conversation-status ${conversation.status}`}>
                  {conversation.status}
                </span>

                <span>{formatDate(conversation.updatedAt)}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Conversations;
