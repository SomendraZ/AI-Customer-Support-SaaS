import { type FormEventHandler, useEffect, useState } from "react";
import api from "../services/api";
import type { Agent } from "../types/agent";

interface Source {
  chunkId: string;
  documentId: string;
  similarity: number;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
}

interface AskAgentResponse {
  success: boolean;
  answer: string;
  agent: {
    id: string;
    name: string;
  };
  sources: Source[];
}

const SupportChat = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState("");

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");

  const [loadingAgents, setLoadingAgents] = useState(true);
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
  }, []);

  const selectedAgent = agents.find((agent) => agent._id === selectedAgentId);
  const suggestedQuestions = selectedAgent?.suggestedQuestions ?? [];

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();

    const trimmedQuestion = question.trim();

    if (!trimmedQuestion || !selectedAgentId || loading) {
      return;
    }

    setError("");

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmedQuestion,
    };

    setMessages((currentMessages) => [...currentMessages, userMessage]);

    setQuestion("");
    setLoading(true);

    try {
      const response = await api.post<AskAgentResponse>(
        `/agents/${selectedAgentId}/ask`,
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
      setError(error.response?.data?.message || "Failed to get AI response");
    } finally {
      setLoading(false);
    }
  };

  const handleAgentChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedAgentId(event.target.value);

    // Start a fresh conversation when switching agents.
    setMessages([]);
    setError("");
  };

  const clearChat = () => {
    setMessages([]);
    setError("");
  };

  return (
    <div className="support-chat-page">
      <header className="support-chat-header">
        <div>
          <h1>AI Support Chat</h1>

          <p>Chat with one of your AI support agents.</p>
        </div>

        {messages.length > 0 && (
          <button
            type="button"
            className="secondary-button"
            onClick={clearChat}
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
          {messages.length === 0 ? (
            <div className="chat-empty">
              <div className="chat-empty-icon">🤖</div>

              <h2>
                {selectedAgent
                  ? `Chat with ${selectedAgent.name}`
                  : "How can I help?"}
              </h2>

              <p>Ask a question about your knowledge base.</p>

              {suggestedQuestions.length > 0 && (
                <div className="suggested-questions">
                  {suggestedQuestions.map((suggestedQuestion) => (
                    <button
                      type="button"
                      key={suggestedQuestion}
                      onClick={() => setQuestion(suggestedQuestion)}
                    >
                      {suggestedQuestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className={`chat-message ${message.role}`}>
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
            disabled={loading || loadingAgents || agents.length === 0}
          />

          <button
            type="submit"
            className="primary-button"
            disabled={
              loading ||
              loadingAgents ||
              agents.length === 0 ||
              !question.trim()
            }
          >
            {loading ? "..." : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SupportChat;
