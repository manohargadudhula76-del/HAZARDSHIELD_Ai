import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Compass,
  AlertTriangle,
  Building2,
  Calendar,
  ShieldAlert,
  ArrowRight,
  Heart,
  Baby,
  Accessibility,
  FileDown
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { RiskBadge } from '../components/common/RiskBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { Habitation, HabitationFilterOptions } from '../types/habitation';
import { habitationService } from '../services/habitationService';
import { formatNumber } from '../utils/formatters';
import { downloadDecisionSummaryCsv } from '../utils/reportGenerator';

export const VulnerableHabitationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [habitations, setHabitations] = useState<Habitation[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('ALL');
  const [selectedDistrict, setSelectedDistrict] = useState('ALL');
  const [selectedRisk, setSelectedRisk] = useState('ALL');
  const [selectedHazard, setSelectedHazard] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [selectedPopRange, setSelectedPopRange] = useState('ALL');

  // Sorting state
  const [sortBy, setSortBy] = useState<'rank' | 'hazardScore' | 'population' | 'carryingCapacityPercentage'>('rank');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Detailed Modal State
  const [modalHabitation, setModalHabitation] = useState<Habitation | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const options: HabitationFilterOptions = {
        searchQuery,
        state: selectedState,
        district: selectedDistrict,
        riskLevel: selectedRisk as HabitationFilterOptions['riskLevel'],
        hazardType: selectedHazard as HabitationFilterOptions['hazardType'],
        sortBy,
        sortOrder
      };
      let result = await habitationService.getHabitations(options);

      // Apply population filter
      if (selectedPopRange !== 'ALL') {
        if (selectedPopRange === '<3000') result = result.filter(h => h.population < 3000);
        else if (selectedPopRange === '3000-5000') result = result.filter(h => h.population >= 3000 && h.population <= 5000);
        else if (selectedPopRange === '>5000') result = result.filter(h => h.population > 5000);
      }

      // Apply priority filter
      if (selectedPriority !== 'ALL') {
        result = result.filter(h => h.relocationStatus === selectedPriority);
      }

      setHabitations(result);
      setCurrentPage(1);
      setLoading(false);
    }
    loadData();
  }, [searchQuery, selectedState, selectedDistrict, selectedRisk, selectedHazard, selectedPriority, selectedPopRange, sortBy, sortOrder]);

  const totalPages = Math.ceil(habitations.length / pageSize) || 1;
  const paginatedData = habitations.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Distinct states for filter dropdown
  const availableStates = useMemo(() => {
    return Array.from(new Set(habitations.map(h => h.state))).sort();
  }, [habitations]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vulnerable Habitations"
        subtitle="Ranked vulnerability census identifying habitations requiring immediate relocation or critical reinforcement."
        icon={Users}
        badgeText="Vulnerability Roster • Prototype Data"
        actionButton={
          <button
            onClick={downloadDecisionSummaryCsv}
            className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            <FileDown className="h-4 w-4" />
            <span>Export CSV Summary</span>
          </button>
        }
      />

      {/* Search and Filters Bar */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-4 shadow-xl space-y-3 transition-colors">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search village name, district, state..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-xl bg-slate-50 dark:bg-[#1B2435] border border-slate-300 dark:border-[#263246] pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Page size selector */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
            <span>Show:</span>
            <select
              value={pageSize}
              onChange={e => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="rounded-lg bg-slate-50 dark:bg-[#1B2435] border border-slate-300 dark:border-[#263246] px-2 py-1 text-xs text-slate-900 dark:text-white focus:outline-none cursor-pointer"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
            </select>
          </div>
        </div>

        {/* Filter Dropdowns Row */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs pt-2 border-t border-slate-100 dark:border-[#263246]">
          {/* State Filter */}
          <select
            value={selectedState}
            onChange={e => setSelectedState(e.target.value)}
            className="rounded-lg bg-slate-50 dark:bg-[#1B2435] border border-slate-300 dark:border-[#263246] px-2.5 py-1.5 text-slate-900 dark:text-white focus:outline-none cursor-pointer"
          >
            <option value="ALL">All States</option>
            <option value="Assam">Assam</option>
            <option value="Uttarakhand">Uttarakhand</option>
            <option value="Himachal Pradesh">Himachal Pradesh</option>
            <option value="Odisha">Odisha</option>
            <option value="West Bengal">West Bengal</option>
            <option value="Bihar">Bihar</option>
            <option value="Kerala">Kerala</option>
            <option value="Andhra Pradesh">Andhra Pradesh</option>
            <option value="Maharashtra">Maharashtra</option>
          </select>

          {/* Hazard Filter */}
          <select
            value={selectedHazard}
            onChange={e => setSelectedHazard(e.target.value)}
            className="rounded-lg bg-slate-50 dark:bg-[#1B2435] border border-slate-300 dark:border-[#263246] px-2.5 py-1.5 text-slate-900 dark:text-white focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Hazards</option>
            <option value="Flood">Flood</option>
            <option value="Landslide">Landslide</option>
            <option value="Cyclone">Cyclone</option>
            <option value="Earthquake">Earthquake</option>
            <option value="Coastal Risk">Coastal Risk</option>
          </select>

          {/* Risk Level Filter */}
          <select
            value={selectedRisk}
            onChange={e => setSelectedRisk(e.target.value)}
            className="rounded-lg bg-slate-50 dark:bg-[#1B2435] border border-slate-300 dark:border-[#263246] px-2.5 py-1.5 text-slate-900 dark:text-white focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="CRITICAL">Critical Red Zone</option>
            <option value="HIGH">High Risk</option>
            <option value="MODERATE">Moderate Risk</option>
            <option value="LOW">Safe / Low</option>
          </select>

          {/* Population Range Filter */}
          <select
            value={selectedPopRange}
            onChange={e => setSelectedPopRange(e.target.value)}
            className="rounded-lg bg-slate-50 dark:bg-[#1B2435] border border-slate-300 dark:border-[#263246] px-2.5 py-1.5 text-slate-900 dark:text-white focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Populations</option>
            <option value="<3000">&lt; 3,000</option>
            <option value="3000-5000">3,000 - 5,000</option>
            <option value=">5000">&gt; 5,000</option>
          </select>

          {/* Relocation Priority Filter */}
          <select
            value={selectedPriority}
            onChange={e => setSelectedPriority(e.target.value)}
            className="rounded-lg bg-slate-50 dark:bg-[#1B2435] border border-slate-300 dark:border-[#263246] px-2.5 py-1.5 text-slate-900 dark:text-white focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Priorities</option>
            <option value="Immediate Relocation Required">Immediate Relocation</option>
            <option value="High Priority Relocation">High Priority</option>
            <option value="Monitoring Required">Monitoring</option>
            <option value="Safe / No Relocation">Safe / None</option>
          </select>

          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium pl-2">
            Found <strong className="text-slate-900 dark:text-white">{habitations.length}</strong> settlements
          </span>
        </div>
      </div>

      {/* Main Table View */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] shadow-xl overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-slate-700 dark:border-[#263246] dark:bg-[#0B0F14]/70 dark:text-slate-300">
              <tr>
                <th
                  onClick={() => toggleSort('rank')}
                  className="px-4 py-3.5 font-bold uppercase tracking-wider cursor-pointer select-none hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Rank</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
                <th className="px-4 py-3.5 font-bold uppercase tracking-wider">Habitation</th>
                <th className="px-4 py-3.5 font-bold uppercase tracking-wider">District / State</th>
                <th
                  onClick={() => toggleSort('population')}
                  className="px-4 py-3.5 font-bold uppercase tracking-wider cursor-pointer select-none hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Population</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('hazardScore')}
                  className="px-4 py-3.5 font-bold uppercase tracking-wider cursor-pointer select-none hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Risk Score</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
                <th className="px-4 py-3.5 font-bold uppercase tracking-wider">Vulnerability</th>
                <th
                  onClick={() => toggleSort('carryingCapacityPercentage')}
                  className="px-4 py-3.5 font-bold uppercase tracking-wider cursor-pointer select-none hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Capacity</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
                <th className="px-4 py-3.5 font-bold uppercase tracking-wider">Priority</th>
                <th className="px-4 py-3.5 font-bold uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-[#263246]">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <div className="animate-spin inline-block rounded-full h-6 w-6 border-b-2 border-blue-500" />
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    No habitations found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedData.map(h => (
                  <tr
                    key={h.id}
                    onClick={() => setModalHabitation(h)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3.5 font-extrabold text-slate-400">
                      #{h.relocationPriorityRank}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                      {h.name}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400">
                      {h.district}, {h.state}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-900 dark:text-white">
                      {formatNumber(h.population)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-extrabold text-red-600 dark:text-red-400">
                        {h.hazardScore}/100
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <RiskBadge level={h.riskLevel} size="sm" />
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`font-bold ${
                        h.carryingCapacityPercentage > 100 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {h.carryingCapacityPercentage}%
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300">
                      {h.relocationStatus}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setModalHabitation(h);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-[#263246] dark:bg-[#1B2435] dark:text-slate-200 dark:hover:bg-[#263246] cursor-pointer shadow-sm"
                      >
                        <FileText className="h-3 w-3" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 dark:border-[#263246] px-4 py-3 bg-slate-50/50 dark:bg-[#0B0F14]/50">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Page <strong className="text-slate-900 dark:text-white">{currentPage}</strong> of{' '}
            <strong className="text-slate-900 dark:text-white">{totalPages}</strong>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 rounded-lg border border-slate-300 dark:border-[#263246] bg-white dark:bg-[#1B2435] px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed shadow-sm"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Previous</span>
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 rounded-lg border border-slate-300 dark:border-[#263246] bg-white dark:bg-[#1B2435] px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed shadow-sm"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Comprehensive Habitation Inspection Detail Modal */}
      {modalHabitation && (
        <Modal
          isOpen={!!modalHabitation}
          onClose={() => setModalHabitation(null)}
          title={`Vulnerability Assessment: ${modalHabitation.name}`}
          size="lg"
        >
          <div className="space-y-4 text-xs">
            {/* Header Telemetry */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl bg-slate-50 dark:bg-[#0B0F14]/60 border border-slate-200 dark:border-[#263246]">
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                  Location Metadata
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">{modalHabitation.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {modalHabitation.district} District, {modalHabitation.state} • Elev: {modalHabitation.elevationMeters}m
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 uppercase block font-medium">Composite Score</span>
                  <span className="text-2xl font-black text-red-600 dark:text-red-400">
                    {modalHabitation.hazardScore}/100
                  </span>
                </div>
                <RiskBadge level={modalHabitation.riskLevel} size="md" pulse={true} />
              </div>
            </div>

            {/* Demographics Breakdown (Families, Elderly, Children, PWD) */}
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] mb-2">
                Demographic Vulnerability Profile
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F14]/40 border border-slate-200 dark:border-[#263246]">
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Users className="h-3 w-3 text-blue-500" /> Total Residents
                  </span>
                  <strong className="text-sm font-bold text-slate-900 dark:text-white mt-1 block">
                    {formatNumber(modalHabitation.population)}
                  </strong>
                  <span className="text-[10px] text-slate-400">
                    ~{modalHabitation.families || Math.round(modalHabitation.population / 4.5)} Families
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F14]/40 border border-slate-200 dark:border-[#263246]">
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Heart className="h-3 w-3 text-rose-500" /> Elderly (60+)
                  </span>
                  <strong className="text-sm font-bold text-slate-900 dark:text-white mt-1 block">
                    {formatNumber(modalHabitation.elderlyPopulation || Math.round(modalHabitation.population * 0.14))}
                  </strong>
                  <span className="text-[10px] text-slate-400">High evacuation aid</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F14]/40 border border-slate-200 dark:border-[#263246]">
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Baby className="h-3 w-3 text-amber-500" /> Children (&lt;12)
                  </span>
                  <strong className="text-sm font-bold text-slate-900 dark:text-white mt-1 block">
                    {formatNumber(modalHabitation.childrenPopulation || Math.round(modalHabitation.population * 0.28))}
                  </strong>
                  <span className="text-[10px] text-slate-400">Pediatric priority</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F14]/40 border border-slate-200 dark:border-[#263246]">
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Accessibility className="h-3 w-3 text-emerald-500" /> PwD Population
                  </span>
                  <strong className="text-sm font-bold text-slate-900 dark:text-white mt-1 block">
                    {formatNumber(modalHabitation.personsWithDisabilities || Math.round(modalHabitation.population * 0.03))}
                  </strong>
                  <span className="text-[10px] text-slate-400">Special assistance</span>
                </div>
              </div>
            </div>

            {/* Environmental & Infrastructure Conditions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0B0F14]/40 border border-slate-200 dark:border-[#263246] space-y-2">
                <span className="font-bold text-slate-900 dark:text-white text-[11px] block uppercase">
                  Hazard & Environmental Exposure
                </span>
                <div className="space-y-1.5 text-slate-600 dark:text-slate-300">
                  <p>• Primary Threat: <strong>{modalHabitation.primaryHazard}</strong></p>
                  <p>• Distance to River/Coast: <strong>{modalHabitation.distanceFromRiverKm} km</strong></p>
                  <p>• Registered Inundations (5yr): <strong>{modalHabitation.historicalDisastersCount} Major Events</strong></p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0B0F14]/40 border border-slate-200 dark:border-[#263246] space-y-2">
                <span className="font-bold text-slate-900 dark:text-white text-[11px] block uppercase">
                  Infrastructure & Capacity Health
                </span>
                <div className="space-y-1.5 text-slate-600 dark:text-slate-300">
                  <p>• Infrastructure Index: <strong>{modalHabitation.infrastructureScore}/100</strong></p>
                  <p>• Carrying Capacity Stress: <strong className="text-red-600 dark:text-red-400">{modalHabitation.carryingCapacityPercentage}% ({modalHabitation.carryingCapacityStatus})</strong></p>
                  <p>• Citizens Requiring Relocation: <strong className="text-blue-600 dark:text-blue-400">{formatNumber(modalHabitation.peopleNeedingRelocation)}</strong></p>
                </div>
              </div>
            </div>

            {/* Disaster History Timeline */}
            {modalHabitation.disasterHistory && modalHabitation.disasterHistory.length > 0 && (
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] mb-2">
                  Recorded Historical Disasters
                </h4>
                <div className="space-y-1.5">
                  {modalHabitation.disasterHistory.map((hist, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-[#0B0F14]/30 border border-slate-200 dark:border-[#263246]"
                    >
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {hist.year} - {hist.event}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300">
                        {hist.severity} Severity
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Vulnerability Reason Quote */}
            <p className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800/40 italic">
              &quot;{modalHabitation.vulnerabilityReason}&quot;
            </p>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-slate-200 dark:border-[#263246]">
              <button
                onClick={() => {
                  setModalHabitation(null);
                  navigate(`/habitation/${modalHabitation.id}`);
                }}
                className="w-full sm:w-auto rounded-xl border border-slate-300 dark:border-[#263246] px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1B2435] cursor-pointer"
              >
                View Full Dossier
              </button>

              <button
                onClick={() => {
                  setModalHabitation(null);
                  navigate('/relocation');
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white transition-colors shadow-md cursor-pointer"
              >
                <Compass className="h-3.5 w-3.5" />
                <span>View Relocation Recommendation</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
