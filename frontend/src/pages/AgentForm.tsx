import { type FormEvent, useEffect, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import api from "../services/api";
import type { AgentTone } from "../types/agent";

const AgentForm = () => {
  const navigate = useNavigate();

  const { id } = useParams();

  const isEditing = Boolean(id);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [tone, setTone] = useState<AgentTone>("professional");
  const [model, setModel] = useState("default");
  const [temperature, setTemperature] = useState(0.3);
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      return;
    }

    const fetchAgent = async () => {
      try {
        setInitialLoading(true);

        const response = await api.get(`/agents/${id}`);

        const agent = response.data.agent;

        setName(agent.name);
        setDescription(agent.description || "");
        setInstructions(agent.instructions);
        setTone(agent.tone);
        setModel(agent.model);
        setTemperature(agent.temperature);
        setStatus(agent.status);
      } catch (error: any) {
        setError(error.response?.data?.message || "Failed to load agent");
      } finally {
        setInitialLoading(false);
      }
    };

    fetchAgent();
  }, [id]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const data = {
        name,
        description,
        instructions,
        tone,
        model,
        temperature,
        status,
      };

      if (isEditing && id) {
        await api.patch(`/agents/${id}`, data);
      } else {
        await api.post("/agents", data);
      }

      navigate("/agents");
    } catch (error: any) {
      setError(
        error.response?.data?.message ||
          `Failed to ${isEditing ? "update" : "create"} agent`,
      );
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <div className="loading">Loading agent...</div>;
  }

  return (
    <div className="agent-form-page">
      <div className="agent-form-header">
        <div>
          <button
            type="button"
            className="back-button"
            onClick={() => navigate("/agents")}
          >
            ← Back to Agents
          </button>

          <h1>{isEditing ? "Edit AI Agent" : "Create AI Agent"}</h1>

          <p>Configure how your AI support agent behaves.</p>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form className="agent-form" onSubmit={handleSubmit}>
        <div className="form-section">
          <h2>Basic Information</h2>

          <div className="form-group">
            <label htmlFor="name">Agent Name</label>

            <input
              id="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="AI Agent Name"
              minLength={2}
              maxLength={100}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>

            <input
              id="description"
              type="text"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe the AI agent's purpose"
              maxLength={500}
            />
          </div>
        </div>

        <div className="form-section">
          <h2>AI Behavior</h2>

          <div className="form-group">
            <label htmlFor="instructions">Instructions</label>

            <textarea
              id="instructions"
              value={instructions}
              onChange={(event) => setInstructions(event.target.value)}
              placeholder="Provide specific instructions for the AI agent's behavior."
              rows={8}
              maxLength={5000}
              required
            />

            <small>
              Tell the AI how it should behave, respond, and handle customers.
            </small>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="tone">Response Tone</label>

              <select
                id="tone"
                value={tone}
                onChange={(event) => setTone(event.target.value as AgentTone)}
              >
                <option value="professional">Professional</option>

                <option value="friendly">Friendly</option>

                <option value="casual">Casual</option>

                <option value="formal">Formal</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="model">AI Model</label>

              <select
                id="model"
                value={model}
                onChange={(event) => setModel(event.target.value)}
              >
                <option value="default">Default</option>

                <option value="fast">Fast</option>

                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="temperature">Temperature: {temperature}</label>

            <input
              id="temperature"
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={temperature}
              onChange={(event) => setTemperature(Number(event.target.value))}
            />

            <small>
              Lower values produce more consistent responses. Higher values
              produce more varied responses.
            </small>
          </div>
        </div>

        {isEditing && (
          <div className="form-section">
            <h2>Status</h2>

            <div className="form-group">
              <label htmlFor="status">Agent Status</label>

              <select
                id="status"
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as "active" | "inactive")
                }
              >
                <option value="active">Active</option>

                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        )}

        <div className="form-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate("/agents")}
          >
            Cancel
          </button>

          <button type="submit" className="primary-button" disabled={loading}>
            {loading
              ? isEditing
                ? "Saving..."
                : "Creating..."
              : isEditing
                ? "Save Changes"
                : "Create Agent"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AgentForm;
