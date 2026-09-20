import React, { useState, useEffect } from 'react';
import {
  Activity,
  Sparkles,
  AlertTriangle,
  FileText,
  TrendingUp,
  MapPin,
  CheckCircle2,
  Compass,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingAnalysis } from '../components/common/LoadingAnalysis';
import { RiskBadge } from '../components/common/RiskBadge';
import { RiskProgressBar } from '../components/common/RiskProgressBar';
import { AIInsightCard } from '../components/common/AIInsightCard';
import { HazardRadarChart } from '../components/charts/HazardRadarChart';
import { HazardAssessmentInput, HazardAssessmentResult } from '../types/hazard';
import { hazardService } from '../services/hazardService';
import { habitationService } from '../services/habitationService';
import { Habitation } from '../types/habitation';
import { formatNumber } from '../utils/formatters';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line
} from 'recharts';

export const HazardAnalysisPage: React.FC = () => {
  const navigate = useNavigate();
  const [habitations, setHabitations] = useState<Habitation[]>([]);
  const [selectedHabitationId, setSelectedHabitationId] = useState<string>('hab-001');

  const [formData, setFormData] = useState<HazardAssessmentInput>({
    habitationName: 'Rampur Village',
    district: 'Darrang',
    state: 'Assam',
    totalPopulation: 4850,
    areaSqKm: 12.4,
    averageRainfallMm: 2200,
    distanceFromRiverKm: 0.8,
    elevationMeters: 45,
    historicalDisasterFrequency: 14,
    populationDensity: 391,
    infrastructureScore: 42
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<HazardAssessmentResult | null>(null);

  useEffect(() => {
    async function loadHabitations() {
      const list = await habitationService.getHabitations();
      setHabitations(list);
    }
    loadHabitations();
  }, []);

  // When dropdown selection changes, populate form with that habitation's data
  const handleHabitationPresetChange = (id: string) => {
    setSelectedHabitationId(id);
    const hab = habitations.find(h => h.id === id);
    if (hab) {
      setFormData({
        habitationName: hab.name,
        district: hab.district,
        state: hab.state,
        totalPopulation: hab.population,
        areaSqKm: hab.areaSqKm,
        averageRainfallMm: hab.primaryHazard === 'Flood' ? 2200 : hab.primaryHazard === 'Cyclone' ? 1850 : 1450,
        distanceFromRiverKm: hab.distanceFromRiverKm,
        elevationMeters: hab.elevationMeters,
        historicalDisasterFrequency: hab.historicalDisastersCount,
        populationDensity: Math.round(hab.population / hab.areaSqKm),
        infrastructureScore: hab.infrastructureScore
      });
      setAnalysisResult(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: e.target.type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAnalyzing(true);
    setAnalysisResult(null);

    const result = await hazardService.analyzeHazard(formData);
    setAnalysisResult(result);
    setIsAnalyzing(false);
  };

  // Run initial analysis for Rampur Village
  useEffect(() => {
    handleAnalyze({ preventDefault: () => {} } as any);
  }, []);

  // Multi-hazard breakdown data for comparative bar chart
  const multiHazardScores = analysisResult
    ? [
        { hazard: 'Riverine Flood', score: analysisResult.factors.floodRisk, fill: '#3B82F6' },
        { hazard: 'Landslide', score: analysisResult.factors.landslideRisk, fill: '#8B5CF6' },
        { hazard: 'Cyclone', score: analysisResult.factors.cycloneRisk, fill: '#EC4899' },
        { hazard: 'Rainfall Saturation', score: analysisResult.factors.rainfallRisk, fill: '#06B6D4' },
        { hazard: 'Infrastructure Deficit', score: analysisResult.factors.infrastructureRisk, fill: '#F59E0B' },
        { hazard: 'Population Exposure', score: analysisResult.factors.populationExposure, fill: '#EF4444' }
      ]
    : [];

  // Historical trend simulated data
  const historicalTrendData = [
    { year: '2021', score: 68, events: 1 },
    { year: '2022', score: 74, events: 2 },
    { year: '2023', score: 81, events: 3 },
    { year: '2024', score: 85, events: 4 },
    { year: '2025', score: 89, events: 4 },
    { year: '2026', score: analysisResult?.overallHazardScore || 92, events: 5 }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hazard Risk Analysis"
        subtitle="Multi-hazard intelligence engine assessing environmental, geological, and infrastructural vulnerability."
        icon={Activity}
        badgeText="Simulated Risk Assessment • Prototype Data"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Habitation Preset Loader & Spatial Parameter Inputs (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-5 shadow-xl transition-colors">
            {/* Habitation Selector Preset */}
            <div className="mb-5 pb-4 border-b border-slate-200 dark:border-[#263246]">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                Select Habitation Preset
              </label>
              <select
                value={selectedHabitationId}
                onChange={e => handleHabitationPresetChange(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              >
                {habitations.map(h => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.district}, {h.state}) - {h.riskLevel}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                Loads official simulated census and GIS coordinates directly into model.
              </p>
            </div>

            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#263246] mb-4">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Spatial Input Parameters
              </h3>
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900">
                11 Factors
              </span>
            </div>

            <form onSubmit={handleAnalyze} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Habitation Name</label>
                <input
                  type="text"
                  name="habitationName"
                  value={formData.habitationName}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-slate-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">District</label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">State</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-slate-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Population</label>
                  <input
                    type="number"
                    name="totalPopulation"
                    value={formData.totalPopulation}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Area (sq. km)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="areaSqKm"
                    value={formData.areaSqKm}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-slate-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Avg Rainfall (mm/yr)</label>
                  <input
                    type="number"
                    name="averageRainfallMm"
                    value={formData.averageRainfallMm}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Distance to River (km)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="distanceFromRiverKm"
                    value={formData.distanceFromRiverKm}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-slate-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Elevation (meters)</label>
                  <input
                    type="number"
                    name="elevationMeters"
                    value={formData.elevationMeters}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Disaster Events (5yr)</label>
                  <input
                    type="number"
                    name="historicalDisasterFrequency"
                    value={formData.historicalDisasterFrequency}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-slate-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Density (people/km²)</label>
                  <input
                    type="number"
                    name="populationDensity"
                    value={formData.populationDensity}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Infra Score (0-100)</label>
                  <input
                    type="number"
                    name="infrastructureScore"
                    value={formData.infrastructureScore}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-slate-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isAnalyzing}
                className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 px-4 py-3 text-sm font-bold text-white dark:text-slate-900 shadow-lg transition-all cursor-pointer"
              >
                <Sparkles className="h-4 w-4" />
                <span>{isAnalyzing ? 'Computing Inference...' : 'Recompute Risk Model'}</span>
              </button>
            </form>
          </div>

          {/* Qualitative Risk Factors List */}
          <div className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-5 shadow-xl transition-colors">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
              Identified Vulnerability Factors
            </h3>
            <ul className="space-y-2.5 text-xs">
              <li className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                <span><strong>High Rainfall Exposure:</strong> Exceeds monsoon precipitation thresholds ({formData.averageRainfallMm} mm/yr).</span>
              </li>
              <li className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                <span><strong>Riverine Proximity:</strong> Located {formData.distanceFromRiverKm} km from primary surge channel.</span>
              </li>
              <li className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                <span><strong>Recurrent Disaster Profile:</strong> {formData.historicalDisasterFrequency} registered events over last 5 years.</span>
              </li>
              <li className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <span><strong>High Population Density:</strong> {formData.populationDensity} residents/sq.km limits rapid egress.</span>
              </li>
              <li className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <span><strong>Infrastructure Bottleneck:</strong> Score of {formData.infrastructureScore}/100 indicates substandard arterial roads.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column: AI Analysis Result, Charts & Summary (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {isAnalyzing ? (
            <LoadingAnalysis title="AI Risk Engine is evaluating multi-factor spatial inputs..." />
          ) : analysisResult ? (
            <div className="space-y-6">
              {/* Overall Score Badge Card */}
              <div className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-6 shadow-xl relative overflow-hidden transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <span className="text-xs uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
                      Evaluated Habitation
                    </span>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                      {analysisResult.habitationName}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formData.district}, {formData.state} • Primary Hazard: <strong>{analysisResult.primaryHazard}</strong>
                    </p>
                  </div>

                  <div className="sm:text-right">
                    <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium mb-1">
                      Overall Composite Risk Score
                    </span>
                    <div className="flex items-baseline gap-2 sm:justify-end">
                      <span className="text-4xl font-black text-red-600 dark:text-red-500 tracking-tight">
                        {analysisResult.overallHazardScore}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 font-bold text-lg">/100</span>
                    </div>
                    <div className="mt-1">
                      <RiskBadge level={analysisResult.riskLevel} size="lg" pulse={true} />
                    </div>
                  </div>
                </div>

                {/* Progress Breakdown Bars */}
                <div className="mt-6 pt-5 border-t border-slate-100 dark:border-[#263246] space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    Factor Risk Contribution Breakdown
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <RiskProgressBar label="River Flood Risk" value={analysisResult.factors.floodRisk} />
                    </div>
                    <div>
                      <RiskProgressBar label="Geological Landslide Risk" value={analysisResult.factors.landslideRisk} />
                    </div>
                    <div>
                      <RiskProgressBar label="Cyclone / Storm Surge" value={analysisResult.factors.cycloneRisk} />
                    </div>
                    <div>
                      <RiskProgressBar label="Rainfall Saturation Index" value={analysisResult.factors.rainfallRisk} />
                    </div>
                    <div>
                      <RiskProgressBar label="Infrastructure Deficit" value={analysisResult.factors.infrastructureRisk} />
                    </div>
                    <div>
                      <RiskProgressBar label="Population Exposure Load" value={analysisResult.factors.populationExposure} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts Section: Radar Chart + Hazard Comparison Bar Chart */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Radar Chart */}
                <div className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-5 shadow-xl transition-colors">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                    Spatial Factor Radar
                  </h3>
                  <HazardRadarChart
                    data={[
                      { factor: 'Flood', score: analysisResult.factors.floodRisk },
                      { factor: 'Landslide', score: analysisResult.factors.landslideRisk },
                      { factor: 'Cyclone', score: analysisResult.factors.cycloneRisk },
                      { factor: 'Rainfall', score: analysisResult.factors.rainfallRisk },
                      { factor: 'Infrastructure', score: analysisResult.factors.infrastructureRisk },
                      { factor: 'Population', score: analysisResult.factors.populationExposure }
                    ]}
                  />
                </div>

                {/* Hazard Comparison Bar Chart */}
                <div className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-5 shadow-xl transition-colors">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                    Hazard Severity Comparison
                  </h3>
                  <div className="h-[240px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={multiHazardScores} layout="vertical" margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                        <YAxis dataKey="hazard" type="category" width={80} tick={{ fontSize: 9 }} />
                        <Tooltip />
                        <Bar dataKey="score" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Historical Trend Chart */}
              <div className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-5 shadow-xl transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Historical Disaster Risk Trend (2021 - 2026)
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Annual composite vulnerability progression</p>
                  </div>
                  <span className="text-[10px] text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-950/50 px-2 py-0.5 rounded">
                    +35% in 5 years
                  </span>
                </div>
                <div className="h-[180px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historicalTrendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                      <YAxis domain={[50, 100]} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="score" stroke="#EF4444" strokeWidth={3} dot={{ r: 4 }} name="Risk Score (/100)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Risk Assessment Summary Card */}
              <div className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-5 shadow-xl transition-colors">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#263246] mb-3">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <span>Risk Assessment Executive Summary</span>
                  </h3>
                  <span className="text-[10px] text-slate-400">Model Ver: HAZ-AI-3.4</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#0B0F14]/40 border border-slate-200 dark:border-[#263246]">
                    <span className="text-[10px] text-slate-500 uppercase block font-medium">Risk Status</span>
                    <strong className="text-xs text-red-600 dark:text-red-400 font-bold">{analysisResult.riskLevel} RED ZONE</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#0B0F14]/40 border border-slate-200 dark:border-[#263246]">
                    <span className="text-[10px] text-slate-500 uppercase block font-medium">Main Hazard</span>
                    <strong className="text-xs text-slate-900 dark:text-white font-bold">{analysisResult.primaryHazard}</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#0B0F14]/40 border border-slate-200 dark:border-[#263246]">
                    <span className="text-[10px] text-slate-500 uppercase block font-medium">Population Exposed</span>
                    <strong className="text-xs text-slate-900 dark:text-white font-bold">{formatNumber(formData.totalPopulation)}</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#0B0F14]/40 border border-slate-200 dark:border-[#263246]">
                    <span className="text-[10px] text-slate-500 uppercase block font-medium">Action Priority</span>
                    <strong className="text-xs text-blue-600 dark:text-blue-400 font-bold">IMMEDIATE</strong>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                  {analysisResult.aiExplanation}
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-[#263246]">
                  <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Recommended Action: {analysisResult.recommendationSummary}</span>
                  </div>

                  <button
                    onClick={() => navigate('/relocation')}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    <span>View Relocation Match</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
