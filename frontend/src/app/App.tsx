import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { FunnelAnalysis } from './pages/FunnelAnalysis';
import { AIAssistant } from './pages/AIAssistant';
import { Settings } from './pages/Settings';
import { isLoggedIn } from './services/api';
import { Benchmark } from './pages/Benchmark';
import { GrowthSimulation } from './pages/GrowthSimulation';


function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  if (isLoggedIn()) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />

        <Route path="/login" element={
          <GuestRoute><Login /></GuestRoute>
        } />

        <Route path="/signup" element={
          <GuestRoute><Signup /></GuestRoute>
        } />

        <Route element={
          <ProtectedRoute><Layout /></ProtectedRoute>
        }>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/funnel" element={<FunnelAnalysis />} />
          <Route path="/benchmark" element={<Benchmark />} />
          <Route path="/simulation" element={<GrowthSimulation />} />
          <Route path="/ai-assistant" element={<AIAssistant />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}