import { useState } from 'react';
import { CURRENT_VERSION, CHANGELOG } from '../config/changelog';

export default function Footer() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <footer className="site-footer">
        <p>
          Data provided by{' '}
          <a href="https://www.thesportsdb.com" target="_blank" rel="noopener">
            TheSportsDB
          </a>
        </p>
        <button className="footer-version" onClick={() => setOpen(true)}>
          v{CURRENT_VERSION}
        </button>
      </footer>

      {open && (
        <div className="changelog-backdrop" onClick={() => setOpen(false)}>
          <div className="changelog-modal" onClick={e => e.stopPropagation()}>
            <div className="changelog-header">
              <span className="changelog-title">Changelog</span>
              <button className="changelog-close" onClick={() => setOpen(false)}>×</button>
            </div>
            <div className="changelog-body">
              {CHANGELOG.map(entry => (
                <div key={entry.version} className="changelog-entry">
                  <div className="changelog-version-row">
                    <span className="changelog-version-badge">v{entry.version}</span>
                    <span className="changelog-date">{entry.date}</span>
                  </div>
                  <ul className="changelog-list">
                    {entry.changes.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
