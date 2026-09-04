import { type FormEventHandler, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../services/api";
import type { Agent } from "../types/agent";

interface Source {
  chunkId: string;
  documentId: string;
  similarity: number;
}

interface ChatMessage {
  _id?: string;
  id?: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  createdAt?: string;
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

interface CreateConversationResponse {
  success: boolean;
  conversation: Conversation;
}

interface SendMessageResponse {
  success: boolean;
  answer: string;
  agent: {
    id: string;
    name: string;
  };
  sources: Source[];
}

const SupportChat = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const requestedConversationId = searchParams.get("conversation");

  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState("");

  const [conversationId, setConversationId] = useState("");

  const [conversationStatus, setConversationStatus] = useState<
    "open" | "closed"
  >("open");

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");

  const [loadingAgents, setLoadingAgents] = useState(true);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [loading, setLoading] = useState(false);

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
            // The conversation-loading effect will handle errors.
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
  }, [requestedConversationId]);

  useEffect(() => {
    const loadConversation = async () => {
      try {
        setLoadingConversation(true);
        setError("");
        setMessages([]);
        setConversationId("");
        setConversationStatus("open");

        if (requestedConversationId) {
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

          setConversationStatus(conversation.status);

          const messagesResponse = await api.get<MessagesResponse>(
            `/conversations/${conversation._id}/messages`,
          );

          setMessages(messagesResponse.data.messages);

          return;
        }

        if (!selectedAgentId) {
          return;
        }

        const response = await api.get<ConversationsResponse>("/conversations");

        const existingConversation = response.data.conversations.find(
          (conversation) => {
            const agentId =
              typeof conversation.agentId === "string"
                ? conversation.agentId
                : conversation.agentId._id;

            return (
              agentId === selectedAgentId && conversation.status === "open"
            );
          },
        );

        let activeConversation: Conversation;

        if (existingConversation) {
          activeConversation = existingConversation;
        } else {
          const createResponse = await api.post<CreateConversationResponse>(
            "/conversations",
            {
              agentId: selectedAgentId,
            },
          );

          activeConversation = createResponse.data.conversation;
        }

        setConversationId(activeConversation._id);

        setConversationStatus(activeConversation.status);

        const messagesResponse = await api.get<MessagesResponse>(
          `/conversations/${activeConversation._id}/messages`,
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
  }, [selectedAgentId, requestedConversationId]);

  const selectedAgent = agents.find((agent) => agent._id === selectedAgentId);

  const suggestedQuestions = selectedAgent?.suggestedQuestions ?? [];

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();

    const trimmedQuestion = question.trim();

    if (
      conversationStatus === "closed" ||
      !trimmedQuestion ||
      !conversationId ||
      loading ||
      loadingConversation
    ) {
      return;
    }

    setError("");

    const temporaryUserMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmedQuestion,
    };

    setMessages((currentMessages) => [
      ...currentMessages,
      temporaryUserMessage,
    ]);

    setQuestion("");
    setLoading(true);

    try {
      const response = await api.post<SendMessageResponse>(
        `/conversations/${conversationId}/messages`,
        {
          question: trimmedQuestion,
        },
      );

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response.data.answer,
        sources: response.data.sources,
      };

      setMessages((currentMessages) => [...currentMessages, assistantMessage]);
    } catch (error: any) {
      setMessages((currentMessages) =>
        currentMessages.filter(
          (message) => message.id !== temporaryUserMessage.id,
        ),
      );

      setError(error.response?.data?.message || "Failed to get AI response");
    } finally {
      setLoading(false);
    }
  };

  const handleAgentChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedAgentId(event.target.value);
    setQuestion("");
    setError("");
    setSearchParams({});
  };

  const clearChat = async () => {
    if (!conversationId || conversationStatus === "closed") {
      return;
    }

    try {
      setError("");

      await api.patch(`/conversations/${conversationId}/close`);

      const response = await api.post<CreateConversationResponse>(
        "/conversations",
        {
          agentId: selectedAgentId,
        },
      );

      setConversationId(response.data.conversation._id);
      setConversationStatus("open");
      setMessages([]);
      setQuestion("");
      setSearchParams({});
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to clear chat");
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
          <button
            type="button"
            className="secondary-button"
            onClick={clearChat}
            disabled={loading || loadingConversation}
          >
            Clear Chat
          </button>
        )}
      </header>

      <div className="chat-container">
        <div className="chat-agent-selector">
          <label htmlFor="agent">AI Agent</label>

          {loadingAgents ? (
            <span>Loading agents...</span>
          ) : agents.length === 0 ? (
            <span>No active agents available.</span>
          ) : (
            <select
              id="agent"
              value={selectedAgentId}
              onChange={handleAgentChange}
              disabled={loadingConversation}
            >
              {agents.map((agent) => (
                <option key={agent._id} value={agent._id}>
                  {agent.name}
                </option>
              ))}
            </select>
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

                  <p>{message.content}</p>

                  {message.sources && message.sources.length > 0 && (
                    <div className="message-sources">
                      <span>Sources:</span>

                      {message.sources.map((source, index) => (
                        <span className="source-badge" key={source.chunkId}>
                          Source {index + 1}
                        </span>
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
                !conversationId ||
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
                !conversationId ||
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
