import { type FormEvent, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import type { Agent } from "../types/agent";

interface Source {
  chunkId: string;
  documentId: string;
  pageNumber?: number;
  similarity: number;
}

interface ChatMessage {
  _id?: string;
  id?: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  createdAt?: string;
  status?: "sending" | "completed" | "failed";
}

interface Conversation {
  _id: string;
  organizationId: string;
  agentId:
    | string
    | {
        _id: string;
        name: string;
      };
  userId: string;
  title?: string;
  status: "open" | "closed";
  resolution: "unresolved" | "ai_resolved" | "human_resolved";
  createdAt: string;
  updatedAt: string;
}

interface ConversationsResponse {
  success: boolean;
  count: number;
  conversations: Conversation[];
}

interface MessagesResponse {
  success: boolean;
  count: number;
  messages: ChatMessage[];
}

interface SendMessageResponse {
  success: boolean;
  answer: string;
  title?: string;
  agent: {
    id: string;
    name: string;
  };
  sources: Source[];
  assistantMessage?: {
    _id: string;
  };
}

const SupportChat = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const requestedConversationId = searchParams.get("conversation");
  const requestedAgentId = searchParams.get("agent");
  const [conversationTitle, setConversationTitle] = useState("");

  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState("");

  const [conversationId, setConversationId] = useState("");

  const [conversationStatus, setConversationStatus] = useState<
    "open" | "closed"
  >("open");

  const [conversationResolution, setConversationResolution] = useState<
    "unresolved" | "ai_resolved" | "human_resolved"
  >("unresolved");

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [question, setQuestion] = useState("");

  const [loadingAgents, setLoadingAgents] = useState(true);

  const [loadingConversation, setLoadingConversation] = useState(false);

  const [loading, setLoading] = useState(false);

  const [showResolveOptions, setShowResolveOptions] = useState(false);

  const [resolving, setResolving] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setLoadingAgents(true);
        setError("");

        const response = await api.get("/agents");

        const activeAgents = response.data.agents.filter(
          (agent: Agent) => agent.status === "active",
        );

        setAgents(activeAgents);

        if (requestedConversationId) {
          try {
            const conversationsResponse =
              await api.get<ConversationsResponse>("/conversations");

            const requestedConversation =
              conversationsResponse.data.conversations.find(
                (conversation) => conversation._id === requestedConversationId,
              );

            if (requestedConversation) {
              const agentId =
                typeof requestedConversation.agentId === "string"
                  ? requestedConversation.agentId
                  : requestedConversation.agentId._id;

              const agentExists = activeAgents.some(
                (agent: Agent) => agent._id === agentId,
              );

              if (agentExists) {
                setSelectedAgentId(agentId);
                return;
              }
            }
          } catch {
            setError("Failed to load conversation");
          }
        }

        if (requestedAgentId) {
          const requestedAgent = activeAgents.find(
            (agent: Agent) => agent._id === requestedAgentId,
          );

          if (requestedAgent) {
            setSelectedAgentId(requestedAgent._id);
            return;
          }
        }

        if (activeAgents.length > 0) {
          setSelectedAgentId(activeAgents[0]._id);
        }
      } catch (error: any) {
        setError(error.response?.data?.message || "Failed to load AI agents");
      } finally {
        setLoadingAgents(false);
      }
    };

    fetchAgents();
  }, [requestedConversationId, requestedAgentId]);

  useEffect(() => {
    const loadConversation = async () => {
      if (!requestedConversationId) {
        setLoadingConversation(false);
        return;
      }

      try {
        setLoadingConversation(true);
        setError("");
        setMessages([]);
        setConversationId("");
        setConversationTitle("");
        setConversationStatus("open");
        setConversationResolution("unresolved");
        setShowResolveOptions(false);

        const conversationResponse = await api.get(
          `/conversations/${requestedConversationId}`,
        );

        const conversation = conversationResponse.data.conversation;

        const agentId =
          typeof conversation.agentId === "string"
            ? conversation.agentId
            : conversation.agentId._id;

        setSelectedAgentId(agentId);
        setConversationId(conversation._id);
        setConversationTitle(conversation.title || "");
        setConversationStatus(conversation.status);
        setConversationResolution(conversation.resolution || "unresolved");

        const messagesResponse = await api.get<MessagesResponse>(
          `/conversations/${conversation._id}/messages`,
        );

        setMessages(messagesResponse.data.messages);
      } catch (error: any) {
        setError(
          error.response?.data?.message || "Failed to load conversation",
        );
      } finally {
        setLoadingConversation(false);
      }
    };

    loadConversation();
  }, [requestedConversationId]);

  const selectedAgent = agents.find((agent) => agent._id === selectedAgentId);

  const suggestedQuestions = selectedAgent?.suggestedQuestions ?? [];

  const sendQuestion = async (messageContent: string, messageId?: string) => {
    const trimmedQuestion = messageContent.trim();

    if (
      conversationStatus === "closed" ||
      !trimmedQuestion ||
      loading ||
      loadingConversation
    ) {
      return;
    }

    setError("");

    const temporaryMessageId = messageId || crypto.randomUUID();

    if (messageId) {
      setMessages((currentMessages) =>
        currentMessages.map((message) =>
          message.id === messageId
            ? {
                ...message,
                status: "sending" as const,
              }
            : message,
        ),
      );
    } else {
      const temporaryUserMessage: ChatMessage = {
        id: temporaryMessageId,
        role: "user",
        content: trimmedQuestion,
        createdAt: new Date().toISOString(),
        status: "sending",
      };

      setMessages((currentMessages) => [
        ...currentMessages,
        temporaryUserMessage,
      ]);
    }

    setQuestion("");
    setLoading(true);

    try {
      let response: {
        data: SendMessageResponse & {
          conversationId?: string;
        };
      };

      // First message of a new chat
      if (!conversationId) {
        if (!selectedAgentId) {
          throw new Error("AI agent is required");
        }

        response = await api.post("/conversations/first-message", {
          agentId: selectedAgentId,
          question: trimmedQuestion,
        });

        const newConversationId = response.data.conversationId;

        if (!newConversationId) {
          throw new Error("Conversation ID was not returned");
        }

        setConversationId(newConversationId);

        // Change URL only after backend successfully
        // generated the answer and created the conversation.
        navigate(`/support?conversation=${newConversationId}`, {
          replace: true,
        });
      } else {
        // Existing conversation
        response = await api.post(`/conversations/${conversationId}/messages`, {
          question: trimmedQuestion,
        });
      }

      if (response.data.title) {
        setConversationTitle(response.data.title);
      }

      setMessages((currentMessages) => [
        ...currentMessages.map((message) =>
          message.id === temporaryMessageId
            ? {
                ...message,
                status: "completed" as const,
              }
            : message,
        ),
        {
          id: response.data.assistantMessage?._id || crypto.randomUUID(),
          role: "assistant",
          content: response.data.answer,
          sources: response.data.sources,
          createdAt: new Date().toISOString(),
          status: "completed",
        },
      ]);
    } catch (error: any) {
      setMessages((currentMessages) =>
        currentMessages.map((message) =>
          message.id === temporaryMessageId
            ? {
                ...message,
                status: "failed" as const,
              }
            : message,
        ),
      );

      setError(error.response?.data?.message || "Failed to get AI response");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await sendQuestion(question);
  };

  const retryMessage = async (message: ChatMessage) => {
    if (
      message.role !== "user" ||
      message.status !== "failed" ||
      !message._id ||
      !conversationId ||
      loading
    ) {
      return;
    }

    try {
      setError("");
      setLoading(true);

      setMessages((currentMessages) =>
        currentMessages.map((currentMessage) =>
          currentMessage._id === message._id
            ? {
                ...currentMessage,
                status: "sending",
              }
            : currentMessage,
        ),
      );

      const response = await api.post<SendMessageResponse>(
        `/conversations/${conversationId}/messages/${message._id}/retry`,
      );

      setMessages((currentMessages) => [
        ...currentMessages.map((currentMessage) =>
          currentMessage._id === message._id
            ? {
                ...currentMessage,
                status: "completed" as const,
              }
            : currentMessage,
        ),
        {
          _id: response.data.assistantMessage?._id,
          id: crypto.randomUUID(),
          role: "assistant",
          content: response.data.answer,
          sources: response.data.sources,
          status: "completed",
        },
      ]);
    } catch (error: any) {
      setMessages((currentMessages) =>
        currentMessages.map((currentMessage) =>
          currentMessage._id === message._id
            ? {
                ...currentMessage,
                status: "failed",
              }
            : currentMessage,
        ),
      );

      setError(error.response?.data?.message || "Failed to retry message");
    } finally {
      setLoading(false);
    }
  };

  const resolveConversation = async (
    resolution: "ai_resolved" | "human_resolved",
  ) => {
    if (!conversationId || conversationStatus === "closed" || resolving) {
      return;
    }

    try {
      setError("");
      setResolving(true);

      const response = await api.patch(
        `/conversations/${conversationId}/resolve`,
        {
          resolution,
        },
      );

      setConversationStatus(response.data.conversation.status);

      setConversationResolution(response.data.conversation.resolution);

      setShowResolveOptions(false);
    } catch (error: any) {
      setError(
        error.response?.data?.message || "Failed to resolve conversation",
      );
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="support-chat-page">
      <header className="support-chat-header">
        <div>
          <h1>AI Support Chat</h1>

          <p>Chat with one of your AI support agents.</p>
        </div>

        {conversationStatus === "open" && messages.length > 0 && (
          <div className="chat-header-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => setShowResolveOptions((current) => !current)}
              disabled={loading || loadingConversation || resolving}
            >
              Resolve
            </button>
          </div>
        )}
      </header>

      {showResolveOptions && conversationStatus === "open" && (
        <div className="resolve-options">
          <span>Resolve conversation as:</span>

          <button
            type="button"
            onClick={() => resolveConversation("ai_resolved")}
            disabled={resolving}
          >
            AI Resolved
          </button>

          <button
            type="button"
            onClick={() => resolveConversation("human_resolved")}
            disabled={resolving}
          >
            Human Resolved
          </button>
        </div>
      )}

      <div className="chat-container">
        <div className="chat-agent-selector">
          <div>
            {conversationTitle && (
              <strong className="chat-title">{conversationTitle}</strong>
            )}

            <span className="chat-agent-name">
              {selectedAgent?.name || "AI Support"}
            </span>
          </div>

          {conversationStatus === "closed" && (
            <strong
              className={`conversation-resolution ${conversationResolution}`}
            >
              {conversationResolution === "ai_resolved"
                ? "AI Resolved"
                : conversationResolution === "human_resolved"
                  ? "Human Resolved"
                  : "Unresolved"}
            </strong>
          )}
        </div>

        <div className="messages">
          {loadingConversation ? (
            <div className="chat-empty">
              <div className="chat-empty-icon">🤖</div>

              <h2>Loading conversation...</h2>

              <p>Loading your conversation history.</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="chat-empty">
              <div className="chat-empty-icon">🤖</div>

              <h2>
                {selectedAgent
                  ? `Chat with ${selectedAgent.name}`
                  : "How can I help?"}
              </h2>

              <p>Ask a question about your knowledge base.</p>

              {suggestedQuestions.length > 0 && selectedAgent && (
                <div className="suggested-questions">
                  {suggestedQuestions.map((suggestedQuestion) => (
                    <button
                      type="button"
                      key={suggestedQuestion}
                      onClick={() => setQuestion(suggestedQuestion)}
                      disabled={conversationStatus === "closed"}
                    >
                      {suggestedQuestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message._id || message.id}
                className={`chat-message ${message.role}`}
              >
                <div className="message-avatar">
                  {message.role === "user" ? "👤" : "🤖"}
                </div>

                <div className="message-content">
                  <div className="message-role">
                    {message.role === "user"
                      ? "You"
                      : selectedAgent?.name || "AI Support"}
                  </div>

                  {message.createdAt && (
                    <span className="message-time">
                      {new Date(message.createdAt).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </span>
                  )}

                  <div className="message-content">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>

                  {message.status === "sending" && (
                    <span className="message-status">Sending...</span>
                  )}

                  {message.status === "failed" &&
                    conversationStatus === "open" && (
                      <div className="message-failed">
                        <span>Failed to send</span>
                        <button
                          type="button"
                          onClick={() => retryMessage(message)}
                          disabled={loading}
                        >
                          Retry
                        </button>
                      </div>
                    )}

                  {message.sources && message.sources.length > 0 && (
                    <div className="message-sources">
                      {message.sources.map((source, index) => (
                        <div className="message-source" key={source.chunkId}>
                          <span>📄 Source {index + 1}</span>

                          {source.pageNumber && (
                            <span>Page {source.pageNumber}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="chat-message assistant">
              <div className="message-avatar">🤖</div>

              <div className="message-content">
                <div className="message-role">
                  {selectedAgent?.name || "AI Support"}
                </div>

                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
        </div>

        {error && <div className="error-message">{error}</div>}

        {conversationStatus === "open" ? (
          <form className="chat-input-container" onSubmit={handleSubmit}>
            <input
              type="text"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder={
                selectedAgent
                  ? `Ask ${selectedAgent.name}...`
                  : "Ask a question..."
              }
              disabled={
                loading ||
                loadingAgents ||
                loadingConversation ||
                resolving ||
                agents.length === 0
              }
            />

            <button
              type="submit"
              className="primary-button"
              disabled={
                loading ||
                loadingAgents ||
                loadingConversation ||
                resolving ||
                agents.length === 0 ||
                !question.trim()
              }
            >
              {loading ? "..." : "Send"}
            </button>
          </form>
        ) : (
          <div className="closed-conversation-message">
            <span>🔒</span>
            This conversation is closed.
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportChat;
