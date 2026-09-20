import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { SettingsProvider } from './context/SettingsContext';
import { MainLayout } from './components/layout/MainLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

import { DashboardPage } from './pages/DashboardPage';
import { HazardAnalysisPage } from './pages/HazardAnalysisPage';
import { RedZoneMapPage } from './pages/RedZoneMapPage';
import { CarryingCapacityPage } from './pages/CarryingCapacityPage';
import { VulnerableHabitationsPage } from './pages/VulnerableHabitationsPage';
import { HabitationDetailPage } from './pages/HabitationDetailPage';
import { RelocationPage } from './pages/RelocationPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AlertsPage } from './pages/AlertsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ExplainableRiskPage } from './pages/ExplainableRiskPage';
import { ScenarioSimulatorPage } from './pages/ScenarioSimulatorPage';
import { EvacuationImpactPage } from './pages/EvacuationImpactPage';
import { CascadingImpactPage } from './pages/CascadingImpactPage';
import { NotFoundPage } from './pages/NotFoundPage';

export function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <BrowserRouter>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Command Center Application Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="hazard-analysis" element={<HazardAnalysisPage />} />
              <Route path="hazard-risk" element={<HazardAnalysisPage />} />
              <Route path="red-zone-map" element={<RedZoneMapPage />} />
              <Route path="carrying-capacity" element={<CarryingCapacityPage />} />
              <Route path="vulnerable-habitations" element={<VulnerableHabitationsPage />} />
              <Route path="habitation/:id" element={<HabitationDetailPage />} />
              <Route path="relocation" element={<RelocationPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="alerts" element={<AlertsPage />} />
              <Route path="settings" element={<SettingsPage />} />

              {/* Intelligence Layer Routes */}
              <Route path="explainable-risk" element={<ExplainableRiskPage />} />
              <Route path="scenario-simulator" element={<ScenarioSimulatorPage />} />
              <Route path="evacuation-impact" element={<EvacuationImpactPage />} />
              <Route path="cascading-impact" element={<CascadingImpactPage />} />
            </Route>
          </Route>

          {/* 404 Not Found Catch-All */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
      </SettingsProvider>
    </ThemeProvider>
  );
}

export default App;

