import katex from 'katex';

interface EquationBlockProps {
  latex: string;
  description?: string;
}

export function EquationBlock({ latex, description }: EquationBlockProps) {
  const html = katex.renderToString(latex, { throwOnError: false, displayMode: true });
  return (
    <div style={{ marginBottom: '1rem' }}>
      {description && <p className="muted" style={{ fontSize: '0.85rem', marginBottom: '0.35rem' }}>{description}</p>}
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
