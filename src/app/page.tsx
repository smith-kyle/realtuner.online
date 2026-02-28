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
  const items = [
    {
      q: 'Why?',
      a: <span>Real guitarists use real tuners.</span>,
    },
    {
      q: 'Where is this tuner physically located?',
      a: (
        <>
          Inside this box.
          <div>
            <img style={{ maxWidth: "calc(min(100%, 500px))" }} src="/realtuner.webp" alt="The tuner box" />
          </div>
        </>
      ),
    },
    {
      q: 'And I can use it whenever I like?',
      a: <span>Yes.</span>,
    },
    {
      q: 'How does it work?',
      a: <img style={{ maxWidth: "calc(min(100%, 500px))" }} src="/real-tuner-architecture.svg" alt="Architecture diagram" />,
    },
    {
      q: 'What instruments can I tune?',
      a: <span>Guitar, bass, ukulele, violin, mandolin, banjo, cello.</span>,
    },
  ]

  return (
    <section
      style={{
        borderTop: '3px solid #8B4513',
        paddingTop: '24px',
        marginTop: '48px',
      }}
    >
      <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '16px', color: '#1a0a00' }}>
        FAQ
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {items.map(({ q, a }) => (
          <details
            key={q}
            style={{
              border: '1px solid #c8874a',
              borderRadius: '6px',
              overflow: 'hidden',
            }}
          >
            <summary
              style={{
                padding: '12px 16px',
                fontWeight: 'bold',
                fontSize: '15px',
                color: '#1a0a00',
                background: '#fdf3e7',
                cursor: 'pointer',
                userSelect: 'none',
                listStyle: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <span style={{ color: '#8B4513', fontSize: '12px', flexShrink: 0 }}>▶</span>
              {q}
            </summary>
            <div
              style={{
                padding: '12px 16px',
                color: '#1a0a00',
                lineHeight: '1.6',
                borderTop: '1px solid #c8874a',
                background: '#fffaf5',
              }}
            >
              {a}
            </div>
          </details>
        ))}
      </div>
      <style>{`
        details[open] > summary > span:first-child { transform: rotate(90deg); display: inline-block; }
      `}</style>
    </section>
  )
}
