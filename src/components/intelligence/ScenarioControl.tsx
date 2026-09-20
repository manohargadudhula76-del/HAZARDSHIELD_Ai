import React from 'react';
import { ScenarioInputs } from '../../types/intelligence';
import { CloudRain, Users, Construction, Hospital, Building, Play, RotateCcw } from 'lucide-react';

interface ScenarioControlProps {
  inputs: ScenarioInputs;
  onChange: (inputs: ScenarioInputs) => void;
  onRunSimulation: () => void;
  onReset: () => void;
  isLoading?: boolean;
}

export const ScenarioControl: React.FC<ScenarioControlProps> = ({
  inputs,
  onChange,
  onRunSimulation,
  onReset,
  isLoading = false
}) => {
  const handleSliderChange = (field: keyof ScenarioInputs, value: number) => {
    onChange({
      ...inputs,
      [field]: value
    });
  };

  const handleToggle = (field: 'mainRoadClosed' | 'hospitalAvailable') => {
    onChange({
      ...inputs,
      [field]: !inputs[field]
    });
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-5 shadow-xl">
      <div className="flex items-center justify-between pb-3 mb-5 border-b border-slate-200 dark:border-[#263246]">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Scenario Stress Controls</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Adjust parametric multipliers to simulate disaster shockwaves
          </p>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-[#263246] transition-colors cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reset Scenario</span>
        </button>
      </div>

      <div className="space-y-5">
        {/* 1. Rainfall Slider */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#263246] bg-slate-50/80 dark:bg-[#0B0F14]/40">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <CloudRain className="h-4 w-4 text-cyan-500" />
              <label className="text-xs font-bold text-slate-900 dark:text-white">
                1. Rainfall Variation
              </label>
            </div>
            <span
              className={`text-xs font-extrabold px-2.5 py-0.5 rounded-lg border ${
                inputs.rainfallChange > 0
                  ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                  : inputs.rainfallChange < 0
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-[#263246]'
              }`}
            >
              {inputs.rainfallChange > 0 ? `+${inputs.rainfallChange}%` : `${inputs.rainfallChange}%`}
            </span>
          </div>
          <input
            type="range"
            min="-30"
            max="50"
            step="5"
            value={inputs.rainfallChange}
            onChange={(e) => handleSliderChange('rainfallChange', Number(e.target.value))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
          <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 mt-1">
            <span>-30% (Drought/Receding)</span>
            <span>0% (Baseline)</span>
            <span>+50% (Extreme Cloudburst)</span>
          </div>
        </div>

        {/* 2. Population Slider */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#263246] bg-slate-50/80 dark:bg-[#0B0F14]/40">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-500" />
              <label className="text-xs font-bold text-slate-900 dark:text-white">
                2. Population Density Change
              </label>
            </div>
            <span
              className={`text-xs font-extrabold px-2.5 py-0.5 rounded-lg border ${
                inputs.populationChange > 0
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                  : inputs.populationChange < 0
                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-[#263246]'
              }`}
            >
              {inputs.populationChange > 0 ? `+${inputs.populationChange}%` : `${inputs.populationChange}%`}
            </span>
          </div>
          <input
            type="range"
            min="-10"
            max="30"
            step="5"
            value={inputs.populationChange}
            onChange={(e) => handleSliderChange('populationChange', Number(e.target.value))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
          <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 mt-1">
            <span>-10% (Pre-evacuated)</span>
            <span>0% (Standard)</span>
            <span>+30% (Displaced Influx)</span>
          </div>
        </div>

        {/* 3. Main Road Closure Toggle */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#263246] bg-slate-50/80 dark:bg-[#0B0F14]/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Construction className="h-4 w-4 text-red-500" />
            <div>
              <label className="text-xs font-bold text-slate-900 dark:text-white block">
                3. Main Evacuation Road (NH-15 Connector)
              </label>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Simulate low-lying bridge submersion / debris block
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleToggle('mainRoadClosed')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all border cursor-pointer ${
              inputs.mainRoadClosed
                ? 'bg-red-600 text-white border-red-700 shadow-md shadow-red-500/20'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
            }`}
          >
            {inputs.mainRoadClosed ? 'CLOSED 🚧' : 'OPEN ✓'}
          </button>
        </div>

        {/* 4. Hospital Availability Toggle */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#263246] bg-slate-50/80 dark:bg-[#0B0F14]/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Hospital className="h-4 w-4 text-blue-500" />
            <div>
              <label className="text-xs font-bold text-slate-900 dark:text-white block">
                4. Civil Hospital Readiness
              </label>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Mangaldai District Civil Hospital status
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleToggle('hospitalAvailable')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all border cursor-pointer ${
              inputs.hospitalAvailable
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                : 'bg-red-600 text-white border-red-700 shadow-md shadow-red-500/20'
            }`}
          >
            {inputs.hospitalAvailable ? 'AVAILABLE 🏥' : 'UNAVAILABLE ❌'}
          </button>
        </div>

        {/* 5. Shelter Capacity Slider */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#263246] bg-slate-50/80 dark:bg-[#0B0F14]/40">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-emerald-500" />
              <label className="text-xs font-bold text-slate-900 dark:text-white">
                5. Shelter Bed Capacity Variation
              </label>
            </div>
            <span
              className={`text-xs font-extrabold px-2.5 py-0.5 rounded-lg border ${
                inputs.shelterCapacityChange < 0
                  ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                  : inputs.shelterCapacityChange > 0
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-[#263246]'
              }`}
            >
              {inputs.shelterCapacityChange > 0 ? `+${inputs.shelterCapacityChange}%` : `${inputs.shelterCapacityChange}%`}
            </span>
          </div>
          <input
            type="range"
            min="-50"
            max="20"
            step="5"
            value={inputs.shelterCapacityChange}
            onChange={(e) => handleSliderChange('shelterCapacityChange', Number(e.target.value))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 mt-1">
            <span>-50% (Severely Damaged)</span>
            <span>0% (Rated Capacity)</span>
            <span>+20% (Temporary Tents)</span>
          </div>
        </div>
      </div>

      {/* Large RUN SIMULATION Button */}
      <div className="mt-6">
        <button
          type="button"
          onClick={onRunSimulation}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-blue-500/20 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
        >
          <Play className="h-4 w-4 fill-white" />
          <span>RUN SIMULATION</span>
        </button>
      </div>
    </div>
  );
};
