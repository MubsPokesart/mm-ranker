import "./DraftManagementPage.css";

interface GenerateFormPageProps {
  onBack: () => void;
}

export function GenerateFormPage({ onBack }: GenerateFormPageProps) {
  return (
    <main className="draft-management-page">
      <button className="draft-management-back" onClick={onBack}>
        ← Back
      </button>
      <h1 className="draft-management-title">Generate Form</h1>
      <p className="draft-management-body">Coming soon.</p>
    </main>
  );
}
