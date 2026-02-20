import { QueueSection } from './components/QueueSection'

export default function Home() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        padding: '20px',
        maxWidth: '900px',
        margin: '0 auto',
      }}
    >
      {/* Heading — server rendered */}
      <h1
        style={{
          textAlign: 'center',
          fontSize: 'clamp(24px, 5vw, 42px)',
          fontWeight: 'bold',
          marginBottom: '20px',
          color: '#1a0a00',
          textShadow: '2px 2px 0px #8B4513',
        }}
      >
        Tune on a <em>REAL</em> Boss TU3
      </h1>

      {/* Video — static iframe, server rendered */}
      <div
        style={{
          width: '100%',
          maxWidth: '800px',
          margin: '0 auto 20px auto',
          aspectRatio: '16/9',
          position: 'relative',
          border: '3px solid #8B4513',
          overflow: 'hidden',
        }}
      >
        <iframe
          src="https://customer-45m451mk4pl7803c.cloudflarestream.com/887f8fa55974c95626b02dc4f92d9f26/iframe?muted=true&autoplay=true"
          style={{
            border: 'none',
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: '100%',
          }}
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
          allowFullScreen={true}
        />
      </div>

      {/* Queue — client island */}
      <QueueSection />

      {/* FAQ — server rendered */}
      <FAQ />
    </div>
  )
}

function FAQ() {
  const faqStyle: React.CSSProperties = {
    borderTop: '3px solid #8B4513',
    paddingTop: '24px',
    marginTop: '48px',
  }

  const dtStyle: React.CSSProperties = {
    fontWeight: 'bold',
    fontSize: '16px',
    color: '#1a0a00',
    marginBottom: '6px',
    marginTop: '20px',
  }

  const ddStyle: React.CSSProperties = {
    marginLeft: '0',
    color: '#1a0a00',
    marginBottom: '4px',
    lineHeight: '1.5',
  }

  return (
    <section style={faqStyle}>
      <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '8px', color: '#1a0a00' }}>FAQ</h2>
      <dl>
        <dt style={dtStyle}>Why?</dt>
        <dd style={ddStyle}>Real guitarists like us want to tune on a real tuner.</dd>

        <dt style={dtStyle}>What instruments can I tune with this?</dt>
        <dd style={ddStyle}>
          Guitar, bass, ukulele, violin, mandolin, banjo, cello, viola, sitar, pedal steel, lap steel,
          dobro, resonator guitar, bouzouki, oud, dulcimer, autoharp, charango, cuatro, bajo sexto,
          mandocello, tenor guitar, baritone guitar — and probably your kazoo if you try hard enough.
        </dd>

        <dt style={dtStyle}>Where is this tuner physically located?</dt>
        <dd style={ddStyle}>In my living room.</dd>

        <dt style={dtStyle}>How does it work?</dt>
        <dd style={ddStyle}>
          <pre
            style={{
              fontFamily: 'monospace',
              fontSize: '13px',
              backgroundColor: '#EDCDA8',
              border: '2px solid #8B4513',
              padding: '12px',
              overflowX: 'auto',
              color: '#1a0a00',
              marginTop: '8px',
            }}
          >{`  YOU (browser)           SERVER              TUNER
  ──────────              ──────────          ──────────
  mic audio  ──WebSocket──► relay  ──audio──► TU3 input
  video feed ◄─Cloudflare─ camera ◄─camera── TU3 display
  queue join ──WebSocket──► queue mgr`}</pre>
        </dd>
      </dl>
    </section>
  )
}
