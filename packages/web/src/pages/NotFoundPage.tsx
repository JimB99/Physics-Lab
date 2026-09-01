import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function NotFoundPage() {
  useDocumentTitle('Page not found');
  return (
    <div style={{ padding: '2rem 1.5rem', maxWidth: 800, margin: '0 auto' }}>
      <h1>Page not found</h1>
      <p className="muted">That route does not exist. Try one of these:</p>
      <ul>
        <li><Link to="/motion">Motion scenarios</Link></li>
        <li><Link to="/compare">Comparison mode</Link></li>
        <li><Link to="/solar-system">Solar system</Link></li>
      </ul>
    </div>
  );
}
