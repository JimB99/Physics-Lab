import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import 'katex/dist/katex.min.css';
import App from './App';
import './styles/global.css';

const BASENAME = '/Physics-Lab';

/** Restores a deep link that GitHub Pages bounced through public/404.html. */
function consumeSpaRedirect(): void {
  const params = new URLSearchParams(window.location.search);
  const redirect = params.get('spaRedirect');
  if (redirect === null) return;
  const target = redirect.startsWith('/') ? redirect : `/${redirect}`;
  window.history.replaceState(null, '', `${BASENAME}${target}`);
}

consumeSpaRedirect();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={BASENAME}>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
