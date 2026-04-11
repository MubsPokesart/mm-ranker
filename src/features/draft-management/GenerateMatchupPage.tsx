import "./DraftManagementPage.css";

interface GenerateMatchupPageProps {
  onBack: () => void;
}

export function GenerateMatchupPage({ onBack }: GenerateMatchupPageProps) {
  return (
    <main className="draft-management-page">
      <button className="draft-management-back" onClick={onBack}>
        ← Back
      </button>
      <h1 className="draft-management-title">Generate Matchup</h1>
      <p className="draft-management-body">Coming soon.</p>
    </main>
  );
}
