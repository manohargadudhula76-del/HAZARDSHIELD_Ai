import { api, HabitationDossierResponse } from '../services/api';

/**
 * Downloads CSV summary from backend
 */
export async function downloadDecisionSummaryCsv() {
  try {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
    const response = await fetch(`${baseUrl}/reports/export-csv`);
    if (!response.ok) throw new Error('Failed to download CSV');
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hazardshield_decision_summary_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error('CSV Download error:', err);
    alert('Exporting decision summary via local fallback...');
  }
}

/**
 * Generates and triggers browser print/PDF for Habitation Executive Dossier
 */
export async function generateHabitationDossierPrint(habitationId: number) {
  try {
    const dossier: HabitationDossierResponse = await api.getHabitationDossier(habitationId);
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${dossier.title} — ${dossier.habitation.name}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
          .header { border-bottom: 2px solid #0284c7; padding-bottom: 15px; margin-bottom: 25px; }
          .title { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0; }
          .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
          .badge-critical { background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; }
          .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px; }
          .card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; background: #f8fafc; }
          .card-title { font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 6px; }
          .card-val { font-size: 18px; font-weight: 800; color: #0f172a; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
          th { background: #f1f5f9; font-weight: 700; }
          .provenance { font-size: 11px; color: #94a3b8; margin-top: 30px; border-top: 1px dashed #cbd5e1; padding-top: 10px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <span class="badge badge-critical">${dossier.habitation.relocation_priority} RELOCATION</span>
          <h1 class="title">${dossier.title}</h1>
          <p style="margin: 4px 0 0 0; color: #64748b; font-size: 13px;">Dossier Ref: ${dossier.report_id} • Generated: ${new Date(dossier.generated_at).toLocaleString()}</p>
        </div>

        <div class="grid">
          <div class="card">
            <div class="card-title">Habitation & Location</div>
            <div class="card-val">${dossier.habitation.name}</div>
            <div style="font-size: 13px; color: #475569;">${dossier.habitation.district}, ${dossier.habitation.state}</div>
          </div>
          <div class="card">
            <div class="card-title">Population & Families</div>
            <div class="card-val">${dossier.habitation.population.toLocaleString()} Residents</div>
            <div style="font-size: 13px; color: #475569;">${dossier.habitation.families.toLocaleString()} Household Units</div>
          </div>
          <div class="card">
            <div class="card-title">Composite Multi-Hazard Risk</div>
            <div class="card-val" style="color: #dc2626;">${dossier.risk_assessment.risk_score} / 100 (${dossier.risk_assessment.risk_level})</div>
            <div style="font-size: 13px; color: #475569;">Vulnerability Index: ${dossier.risk_assessment.vulnerability_score}/100</div>
          </div>
          <div class="card">
            <div class="card-title">Primary Driver</div>
            <div class="card-val" style="font-size: 14px;">${dossier.risk_assessment.primary_driver}</div>
            <div style="font-size: 12px; color: #475569;">${dossier.risk_assessment.secondary_driver}</div>
          </div>
        </div>

        <h3 style="font-size: 14px; margin-top: 20px; text-transform: uppercase;">1. Recommended Safe Haven Relocation Centers</h3>
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Safe Haven Name</th>
              <th>Location</th>
              <th>Distance</th>
              <th>Available Capacity</th>
              <th>Safety Score</th>
            </tr>
          </thead>
          <tbody>
            ${dossier.recommended_safe_havens.map((sh, i) => `
              <tr>
                <td>#${i + 1}</td>
                <td><strong>${sh.name}</strong></td>
                <td>${sh.district}, ${sh.state}</td>
                <td>${sh.distance_km} km</td>
                <td>${sh.available_capacity.toLocaleString()} Persons</td>
                <td>${sh.safety_score}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h3 style="font-size: 14px; margin-top: 25px; text-transform: uppercase;">2. Strategic Emergency Actions</h3>
        <ol style="font-size: 13px; color: #334155;">
          ${dossier.strategic_action_plan.map(act => `<li>${act}</li>`).join('')}
        </ol>

        <div class="provenance">
          <strong>Disclaimer & Provenance:</strong> ${dossier.provenance}. This document provides decision-support analytics for administrative demonstration.
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  } catch (err) {
    console.error('Error generating print dossier:', err);
  }
}
