import "./DraftManagementPage.css";

interface DraftManagementPageProps {
  onBack: () => void;
  onOpenMatchup: () => void;
  onOpenForm: () => void;
}

export function DraftManagementPage({ onBack, onOpenMatchup, onOpenForm }: DraftManagementPageProps) {
  return (
    <main className="draft-management-page">
      <button className="draft-management-back" onClick={onBack}>
        ← Back
      </button>
      <h1 className="draft-management-title">Draft Management</h1>
      <nav className="draft-management-grid" aria-label="Draft Management sections">
        <button className="draft-management-card" onClick={onOpenMatchup}>
          <div className="draft-management-card-name">Generate Matchup</div>
        </button>
        <button className="draft-management-card" onClick={onOpenForm}>
          <div className="draft-management-card-name">Generate Form</div>
        </button>
      </nav>
    </main>
  );
}
