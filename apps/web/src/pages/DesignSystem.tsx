import {
  STAGES,
  COMPONENT_GROUPS,
  COMPONENT_METADATA,
  TENOR_CHOICES,
} from '@sage-codex/shared-types';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 48 }}>
      <h2 style={{ marginBottom: 16 }}>{title}</h2>
      {children}
    </section>
  );
}

function ColorSwatch({ name, value }: { name: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 'var(--radius-sm)',
          background: value,
          border: '1px solid var(--border-medium)',
        }}
      />
      <div>
        <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{name}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{value}</div>
      </div>
    </div>
  );
}

export function DesignSystem() {
  return (
    <div className="app-layout">
      {/* Header */}
      <header className="app-header">
        <span className="font-serif text-[16px] font-semibold" style={{ color: 'var(--accent-gold)' }}>
          Sage Codex
        </span>
        <span style={{ marginLeft: 12, fontSize: 12, color: 'var(--text-muted)' }}>
          Design System Verification
        </span>
      </header>

      {/* Chat Panel (left) */}
      <div className="chat-panel">
        <div className="message-area scrollbar-thin" style={{ maxWidth: '100%', padding: 'var(--section-padding)' }}>

          <Section title="Color Tokens">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
              <div>
                <h3 style={{ fontSize: 13, marginBottom: 12, color: 'var(--text-secondary)' }}>Backgrounds</h3>
                <ColorSwatch name="bg-primary" value="var(--bg-primary)" />
                <ColorSwatch name="bg-secondary" value="var(--bg-secondary)" />
                <ColorSwatch name="bg-surface" value="var(--bg-surface)" />
                <ColorSwatch name="bg-surface-hover" value="var(--bg-surface-hover)" />
              </div>
              <div>
                <h3 style={{ fontSize: 13, marginBottom: 12, color: 'var(--text-secondary)' }}>Text</h3>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ color: 'var(--text-primary)' }}>Primary text</span>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Secondary text</span>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Muted text</span>
                </div>
              </div>
              <div>
                <h3 style={{ fontSize: 13, marginBottom: 12, color: 'var(--text-secondary)' }}>Gold Accent</h3>
                <ColorSwatch name="accent-gold" value="var(--accent-gold)" />
                <ColorSwatch name="accent-gold-hover" value="var(--accent-gold-hover)" />
                <ColorSwatch name="accent-gold-dim" value="var(--accent-gold-dim)" />
                <ColorSwatch name="accent-gold-border" value="var(--accent-gold-border)" />
              </div>
            </div>
          </Section>

          <Section title="Typography">
            <div style={{ marginBottom: 16 }}>
              <h1 style={{ fontSize: 24 }}>Heading 1 — Source Serif 4</h1>
              <h2 style={{ fontSize: 20 }}>Heading 2 — Source Serif 4</h2>
              <h3 style={{ fontSize: 16 }}>Heading 3 — Source Serif 4</h3>
            </div>
            <p style={{ fontSize: 15, lineHeight: 1.6 }}>
              Body text in Inter — The Sage speaks, and the Codex listens. Every adventure
              begins with a spark of imagination, a thread of story waiting to be woven.
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>
              Secondary text at 13px — metadata, labels, and supporting information.
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
              Muted text at 11px — timestamps, placeholders, and lowest-priority content.
            </p>
          </Section>

          <Section title="Animations">
            <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>Thinking Pulse</div>
                <div className="thinking-dots">
                  <div className="thinking-dot" />
                  <div className="thinking-dot" />
                  <div className="thinking-dot" />
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>Streaming Cursor</div>
                <span style={{ color: 'var(--text-primary)' }}>
                  The tale unfolds<span className="streaming-cursor" />
                </span>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>Message Appear</div>
                <div className="animate-message-appear" style={{ color: 'var(--text-primary)' }}>
                  Faded in with slide-up
                </div>
              </div>
            </div>
          </Section>

          <Section title="Sage Speaking Indicator">
            <div className="sage-speaking">
              <span className="sage-label">Sage</span>
              <div className="thinking-dots">
                <div className="thinking-dot" />
                <div className="thinking-dot" />
                <div className="thinking-dot" />
              </div>
            </div>
          </Section>

          <Section title="Chat Input">
            <div className="input-area" style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
              <textarea
                className="chat-input"
                placeholder="Share your vision for this adventure..."
                readOnly
              />
            </div>
          </Section>

          <Section title="User Message">
            <div
              style={{
                maxWidth: '88%',
                marginLeft: 'auto',
                padding: '12px 16px',
                background: 'var(--user-msg-bg)',
                borderRadius: 'var(--radius-md)',
                fontSize: 15,
                lineHeight: 1.65,
              }}
            >
              I want an adventure about a cursed forest where the trees whisper secrets.
            </div>
          </Section>

        </div>
      </div>

      {/* Content Panel (right) */}
      <div className="content-panel">
        <div className="scrollbar-panel" style={{ flex: 1, overflow: 'auto', padding: 'var(--panel-padding)' }}>

          <Section title="Entity Labels — NPC Roles">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <span className="entity-tag role-leader">Leader</span>
              <span className="entity-tag role-antagonist">Antagonist</span>
              <span className="entity-tag role-oracle">Oracle</span>
              <span className="entity-tag role-scout">Scout</span>
              <span className="entity-tag role-minor">Minor</span>
            </div>
          </Section>

          <Section title="Entity Labels — Adversary Types">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <span className="entity-tag type-bruiser">Bruiser</span>
              <span className="entity-tag type-minion">Minion</span>
              <span className="entity-tag type-leader">Leader</span>
              <span className="entity-tag type-solo">Solo</span>
            </div>
          </Section>

          <Section title="Entity Labels — Item Types">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <span className="entity-tag type-weapon">Weapon</span>
              <span className="entity-tag type-armor">Armor</span>
              <span className="entity-tag type-consumable">Consumable</span>
              <span className="entity-tag type-item">Item</span>
            </div>
          </Section>

          <Section title="Scene Badges">
            <div style={{ display: 'flex', gap: 6 }}>
              <span className="scene-badge scene-badge--confirmed">1</span>
              <span className="scene-badge scene-badge--active">2</span>
              <span className="scene-badge scene-badge--inactive">3</span>
              <span className="scene-badge scene-badge--inactive">4</span>
            </div>
          </Section>

          <Section title="Read-Aloud Block">
            <div className="read-aloud">
              The forest breathes around you. Ancient oaks creak and groan, their bark
              etched with runes that pulse faintly in the twilight. A voice, old as the
              roots beneath your feet, whispers your name.
            </div>
          </Section>

          <Section title="Detail Cards">
            <div className="detail-card" style={{ marginBottom: 12 }}>
              <h4 style={{ fontSize: 14, marginBottom: 4 }}>Standard Card</h4>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                A surface-level card with subtle border.
              </p>
            </div>
            <div className="detail-card detail-card--gold">
              <h4 style={{ fontSize: 14, marginBottom: 4, color: 'var(--accent-gold-hover)' }}>Gold Card</h4>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Selected/confirmed state with gold treatment.
              </p>
            </div>
          </Section>

          <Section title="Footer Button">
            <div className="panel-footer" style={{ borderRadius: 'var(--radius-md)' }}>
              <button className="footer-button">Continue to Binding</button>
            </div>
            <div className="panel-footer" style={{ borderRadius: 'var(--radius-md)', marginTop: 8 }}>
              <button className="footer-button" disabled>Continue to Binding</button>
            </div>
          </Section>

          <Section title="Stages (from shared-types)">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {STAGES.map(stage => (
                <div key={stage.id} style={{ fontSize: 13, display: 'flex', gap: 8 }}>
                  <span style={{ color: 'var(--accent-gold)', width: 80 }}>{stage.label}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{stage.description}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Components (from shared-types)">
            {COMPONENT_GROUPS.map(group => (
              <div key={group.id} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                  {group.label}
                </div>
                {group.components.map(compId => {
                  const meta = COMPONENT_METADATA.find(m => m.id === compId);
                  return (
                    <div key={compId} style={{ fontSize: 13, padding: '4px 0', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-primary)' }}>{meta?.label}</span>
                      <span style={{ color: 'var(--text-muted)' }}>&mdash;</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </Section>

          <Section title="Borders">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ padding: 12, border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
                border-subtle (6% white)
              </div>
              <div style={{ padding: 12, border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-sm)' }}>
                border-medium (10% white)
              </div>
              <div style={{ padding: 12, border: '1px solid var(--border-hover)', borderRadius: 'var(--radius-sm)' }}>
                border-hover (14% white)
              </div>
              <div style={{ padding: 12, border: '1px solid var(--accent-gold-border)', borderRadius: 'var(--radius-sm)' }}>
                accent-gold-border (25% gold)
              </div>
            </div>
          </Section>

          <Section title="Choice Options (Tenor)">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {TENOR_CHOICES.map(choice => (
                <div key={choice.value} className="detail-card" style={{ padding: '10px 14px' }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{choice.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{choice.description}</div>
                </div>
              ))}
            </div>
          </Section>

        </div>
      </div>
    </div>
  );
}
