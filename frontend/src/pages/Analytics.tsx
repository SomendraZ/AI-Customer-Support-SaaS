import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "../services/api";

interface ConversationAnalytics {
  date: string;
  conversations: number;
  aiResolved: number;
  humanResolved: number;
}

interface ResolutionAnalytics {
  total: number;
  unresolved: number;
  aiResolved: number;
  humanResolved: number;
}

interface AgentAnalytics {
  agentId: string;
  agentName: string;
  total: number;
  aiResolved: number;
  humanResolved: number;
  unresolved: number;
  aiResolutionRate: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name?: string;
    color?: string;
    value?: number | string;
  }>;
  label?: string;
}

const Analytics = () => {
  const [conversationAnalytics, setConversationAnalytics] = useState<
    ConversationAnalytics[]
  >([]);

  const [resolutionAnalytics, setResolutionAnalytics] =
    useState<ResolutionAnalytics>({
      total: 0,
      unresolved: 0,
      aiResolved: 0,
      humanResolved: 0,
    });

  const [agentAnalytics, setAgentAnalytics] = useState<AgentAnalytics[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError("");

        const [conversationsResponse, resolutionsResponse, agentsResponse] =
          await Promise.all([
            api.get("/analytics/conversations"),
            api.get("/analytics/resolutions"),
            api.get("/analytics/agents"),
          ]);

        setConversationAnalytics(conversationsResponse.data.analytics);

        setResolutionAnalytics(resolutionsResponse.data.analytics);

        setAgentAnalytics(agentsResponse.data.analytics);
      } catch (error: any) {
        setError(error.response?.data?.message || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const getPercentage = (value: number) => {
    if (resolutionAnalytics.total === 0) {
      return 0;
    }

    return Math.round((value / resolutionAnalytics.total) * 100);
  };

  const formatDate = (date: string) => {
    return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const formatTooltipDate = (date: unknown) => {
    if (typeof date !== "string") {
      return "";
    }

    return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (!active || !payload || payload.length === 0) {
      return null;
    }

    const order = ["Conversations", "AI Resolved", "Human Resolved"];

    const sortedPayload = [...payload].sort(
      (a, b) => order.indexOf(a.name || "") - order.indexOf(b.name || ""),
    );

    return (
      <div className="analytics-tooltip">
        <div className="analytics-tooltip-date">{label}</div>

        {sortedPayload.map((item) => (
          <div className="analytics-tooltip-row" key={item.name}>
            <span>
              <i
                style={{
                  background: item.color,
                }}
              />
              {item.name}
            </span>

            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    );
  };

  const CustomLegend = () => {
    return (
      <div className="analytics-custom-legend">
        <span>
          <i className="legend-line" style={{ background: "red" }} />
          Conversations
        </span>

        <span>
          <i className="legend-line" style={{ background: "#22c55e" }} />
          AI Resolved
        </span>

        <span>
          <i className="legend-line" style={{ background: "#6366f1" }} />
          Human Resolved
        </span>
      </div>
    );
  };

  return (
    <div className="analytics-page">
      <header className="analytics-header">
        <div>
          <h1>Analytics</h1>
          <p>Monitor conversations, resolutions, and AI agent performance.</p>
        </div>
      </header>

      {error && <div className="error-message">{error}</div>}

      <section className="analytics-stat-grid">
        <div className="analytics-stat-card">
          <span>Total Conversations</span>
          <strong>{loading ? "—" : resolutionAnalytics.total}</strong>
        </div>

        <div className="analytics-stat-card">
          <span>AI Resolved</span>
          <strong>{loading ? "—" : resolutionAnalytics.aiResolved}</strong>
        </div>

        <div className="analytics-stat-card">
          <span>Human Resolved</span>
          <strong>{loading ? "—" : resolutionAnalytics.humanResolved}</strong>
        </div>

        <div className="analytics-stat-card">
          <span>Unresolved</span>
          <strong>{loading ? "—" : resolutionAnalytics.unresolved}</strong>
        </div>
      </section>

      <section className="analytics-section">
        <div className="analytics-section-header">
          <div>
            <h2>Conversations Over Time</h2>
            <p>Conversation activity and resolution trends.</p>
          </div>
        </div>

        {loading ? (
          <div className="analytics-empty">Loading analytics...</div>
        ) : conversationAnalytics.length === 0 ? (
          <div className="analytics-empty">No conversation data available.</div>
        ) : (
          <div className="analytics-line-chart">
            <ResponsiveContainer width="100%" height={340}>
              <LineChart
                data={conversationAnalytics}
                margin={{
                  top: 15,
                  right: 20,
                  left: -10,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />

                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                />

                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  width={35}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  labelFormatter={formatTooltipDate}
                />

                <Legend content={<CustomLegend />} />

                <Line
                  type="monotone"
                  dataKey="conversations"
                  name="Conversations"
                  stroke="red"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />

                <Line
                  type="monotone"
                  dataKey="aiResolved"
                  name="AI Resolved"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />

                <Line
                  type="monotone"
                  dataKey="humanResolved"
                  name="Human Resolved"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section className="analytics-section">
        <div className="analytics-section-header">
          <div>
            <h2>Resolution Breakdown</h2>
            <p>Distribution of conversation outcomes.</p>
          </div>
        </div>

        {loading ? (
          <div className="analytics-empty">Loading analytics...</div>
        ) : resolutionAnalytics.total === 0 ? (
          <div className="analytics-empty">No resolution data available.</div>
        ) : (
          <div className="resolution-list">
            <div className="resolution-row">
              <div className="resolution-label">
                <span>AI Resolved</span>
                <strong>
                  {getPercentage(resolutionAnalytics.aiResolved)}%
                </strong>
              </div>

              <div className="resolution-progress">
                <div
                  className="resolution-progress-bar"
                  style={{
                    width: `${getPercentage(resolutionAnalytics.aiResolved)}%`,
                  }}
                />
              </div>
            </div>

            <div className="resolution-row">
              <div className="resolution-label">
                <span>Human Resolved</span>
                <strong>
                  {getPercentage(resolutionAnalytics.humanResolved)}%
                </strong>
              </div>

              <div className="resolution-progress">
                <div
                  className="resolution-progress-bar"
                  style={{
                    width: `${getPercentage(
                      resolutionAnalytics.humanResolved,
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="resolution-row">
              <div className="resolution-label">
                <span>Unresolved</span>
                <strong>
                  {getPercentage(resolutionAnalytics.unresolved)}%
                </strong>
              </div>

              <div className="resolution-progress">
                <div
                  className="resolution-progress-bar"
                  style={{
                    width: `${getPercentage(resolutionAnalytics.unresolved)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="analytics-section">
        <div className="analytics-section-header">
          <div>
            <h2>Agent Performance</h2>
            <p>Compare how your AI agents are performing.</p>
          </div>
        </div>

        {loading ? (
          <div className="analytics-empty">Loading analytics...</div>
        ) : agentAnalytics.length === 0 ? (
          <div className="analytics-empty">No agent data available.</div>
        ) : (
          <div className="agent-performance-table">
            <div className="agent-performance-header">
              <span>Agent</span>
              <span>Conversations</span>
              <span>AI Resolved</span>
              <span>Human Resolved</span>
              <span>Unresolved</span>
              <span>AI Resolution Rate</span>
            </div>

            {agentAnalytics.map((agent) => (
              <div className="agent-performance-row" key={agent.agentId}>
                <strong>{agent.agentName}</strong>

                <span>{agent.total}</span>

                <span>{agent.aiResolved}</span>

                <span>{agent.humanResolved}</span>

                <span>{agent.unresolved}</span>

                <strong>{Math.round(agent.aiResolutionRate)}%</strong>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Analytics;
