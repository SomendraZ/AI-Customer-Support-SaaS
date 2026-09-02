import { type FormEvent, useState } from "react";
import api from "../services/api";

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

interface AskResponse {
  success: boolean;
  answer: string;
  sources: Source[];
}

const SupportChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedQuestion = question.trim();

    if (!trimmedQuestion || loading) {
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
      const response = await api.post<AskResponse>("/knowledge/ask", {
        question: trimmedQuestion,
      });

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

  const clearChat = () => {
    setMessages([]);
    setError("");
  };

  return (
    <div className="support-chat-page">
      <header className="support-chat-header">
        <div>
          <h1>AI Support Chat</h1>

          <p>Ask questions about your organization's knowledge base.</p>
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
        <div className="messages">
          {messages.length === 0 ? (
            <div className="chat-empty">
              <div className="chat-empty-icon">🤖</div>

              <h2>How can I help?</h2>

              <p>Ask a question about your knowledge base.</p>

              <div className="suggested-questions">
                <button
                  type="button"
                  onClick={() =>
                    setQuestion("How long do I have to request a refund?")
                  }
                >
                  What is the refund policy?
                </button>

                <button
                  type="button"
                  onClick={() => setQuestion("How can I reset my password?")}
                >
                  How do I reset my password?
                </button>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className={`chat-message ${message.role}`}>
                <div className="message-avatar">
                  {message.role === "user" ? "👤" : "🤖"}
                </div>

                <div className="message-content">
                  <div className="message-role">
                    {message.role === "user" ? "You" : "AI Support"}
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
                <div className="message-role">AI Support</div>

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
            placeholder="Ask a question..."
            disabled={loading}
          />

          <button
            type="submit"
            className="primary-button"
            disabled={loading || !question.trim()}
          >
            {loading ? "..." : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SupportChat;
