'use client';

// Export PDF via l'impression du navigateur (« Enregistrer au format PDF »).
export default function PrintButton() {
  return (
    <button type="button" className="btn btn-outline" onClick={() => window.print()}>
      Download as PDF
    </button>
  );
}
