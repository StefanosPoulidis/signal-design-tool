import { useState } from 'react';

const BIBTEX = `@article{poulidis2026signal,
  title   = {Dynamic Signal Design with Endogenous
             Future Efficacy},
  author  = {Poulidis, Stefanos},
  journal = {Working Paper},
  year    = {2026}
}`;

export function Footer() {
  const [copied, setCopied] = useState(false);

  const copyBib = () => {
    navigator.clipboard.writeText(BIBTEX).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <footer className="bg-gray-50 border-t border-gray-200 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Citation</h3>
            <pre className="bg-white rounded border border-gray-200 p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
              {BIBTEX}
            </pre>
            <button
              onClick={copyBib}
              className="mt-2 text-xs text-primary-600 hover:text-primary-800 font-medium"
            >
              {copied ? 'Copied!' : 'Copy BibTeX'}
            </button>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Links</h3>
            <ul className="space-y-1">
              <li>
                <span className="text-gray-400">Paper PDF (coming soon)</span>
              </li>
              <li>
                <a href="https://github.com/StefanosPoulidis/signal-design-tool" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                  GitHub Repository
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">About</h3>
            <p className="text-gray-500 leading-relaxed">
              This interactive tool accompanies the paper on behavioral-channel MDPs
              for algorithmic signal design. All computations run in your browser.
            </p>
          </div>
        </div>
        <div className="mt-6 pt-4 border-t border-gray-200 text-center text-xs text-gray-400">
          Built as a companion to academic research. No data is collected or stored externally.
        </div>
      </div>
    </footer>
  );
}
