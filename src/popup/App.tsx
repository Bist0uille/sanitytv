import { useState } from 'react';
import { useSettings, useStats } from './hooks';

export function App() {
  const { settings, update, loaded } = useSettings();
  const [refreshKey, setRefreshKey] = useState(0);
  const { stats, reset } = useStats(refreshKey);

  if (!loaded) {
    return (
      <main className="popup">
        <header className="popup__header">
          <h1>SanityTV</h1>
          <span className="popup__badge">loading…</span>
        </header>
      </main>
    );
  }

  return (
    <main className="popup">
      <header className="popup__header">
        <h1>SanityTV</h1>
        <span className="popup__badge">v0.0.1</span>
      </header>

      <section className="popup__row">
        <label className="popup__toggle">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => void update({ enabled: e.target.checked })}
            aria-label="Enable SanityTV"
          />
          <span>{settings.enabled ? 'Active' : 'Paused'}</span>
        </label>
      </section>

      <section className="popup__section">
        <label className="popup__label">
          <span>Sensitivity</span>
          <strong>{settings.sensitivity}</strong>
        </label>
        <input
          type="range"
          min={0}
          max={100}
          value={settings.sensitivity}
          onChange={(e) => void update({ sensitivity: Number(e.target.value) })}
          className="popup__slider"
          aria-label="Sensitivity"
        />
        <p className="popup__hint">Higher = more aggressive filtering. Defaults to 50.</p>
      </section>

      <section className="popup__section">
        <h2 className="popup__h2">Activity</h2>
        <div className="popup__stats">
          <div>
            <strong>{stats.totalHidden}</strong>
            <span>hidden</span>
          </div>
          <div>
            <strong>{stats.totalGreyed}</strong>
            <span>greyed</span>
          </div>
          <button
            type="button"
            className="popup__link"
            onClick={() => {
              void reset();
              setRefreshKey((k) => k + 1);
            }}
          >
            reset
          </button>
        </div>
      </section>

      <section className="popup__section">
        <h2 className="popup__h2">Channel lists</h2>
        <ChannelListEditor
          label="Always show (whitelist)"
          values={settings.whitelist}
          onChange={(whitelist) => void update({ whitelist })}
        />
        <ChannelListEditor
          label="Always hide (blacklist)"
          values={settings.blacklist}
          onChange={(blacklist) => void update({ blacklist })}
        />
      </section>

      <footer className="popup__footer">
        Detection runs locally. No data leaves your browser.
      </footer>
    </main>
  );
}

interface ChannelListEditorProps {
  label: string;
  values: string[];
  onChange: (next: string[]) => void;
}

function ChannelListEditor({ label, values, onChange }: ChannelListEditorProps) {
  const [draft, setDraft] = useState('');

  const add = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (values.some((v) => v.toLowerCase() === trimmed.toLowerCase())) return;
    onChange([...values, trimmed]);
    setDraft('');
  };

  const remove = (channel: string) => {
    onChange(values.filter((v) => v !== channel));
  };

  return (
    <div className="popup__list">
      <span className="popup__label-sm">{label}</span>
      <div className="popup__list-input">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Channel name"
        />
        <button type="button" onClick={add} className="popup__btn">
          Add
        </button>
      </div>
      {values.length > 0 && (
        <ul className="popup__chips">
          {values.map((v) => (
            <li key={v}>
              {v}
              <button
                type="button"
                onClick={() => remove(v)}
                aria-label={`Remove ${v}`}
                className="popup__chip-remove"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
