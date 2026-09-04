import { Navigate, Route, Routes } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Agents from "./pages/Agents";

import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import AgentForm from "./pages/AgentForm";
import KnowledgeBase from "./pages/KnowledgeBase";
import SupportChat from "./pages/SupportChat";
import Conversations from "./pages/Conversations";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route path="/login" element={<Login />} />

      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/agents" element={<Agents />} />

          <Route path="/agents/new" element={<AgentForm />} />

          <Route path="/agents/:id/edit" element={<AgentForm />} />

          <Route path="/knowledge" element={<KnowledgeBase />} />

          <Route path="/support" element={<SupportChat />} />

          <Route path="/conversations" element={<Conversations />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default App;
