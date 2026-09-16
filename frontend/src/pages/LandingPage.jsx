import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css'; // Force HMR update

/* ── Dynamic Glowing Waves & Particles (Dark Mode) ── */
function ParticleCanvas() {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animId;
    let time = 0;

    const resize = () => { 
      canvas.width = window.innerWidth; 
      canvas.height = window.innerHeight; 
    };
    resize();
    window.addEventListener('resize', resize);

    // Bokeh particles
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      r: Math.random() * 3 + 1,
      alpha: Math.random() * 0.5 + 0.1,
    }));

    // Wave config
    const waves = [
      { yOffset: 0.4, amplitude: 80, frequency: 0.002, speed: 0.01, color: 'rgba(255, 153, 51, 0.15)', lineWidth: 15 },
      { yOffset: 0.5, amplitude: 120, frequency: 0.0015, speed: 0.008, color: 'rgba(245, 158, 11, 0.2)', lineWidth: 25 },
      { yOffset: 0.6, amplitude: 60, frequency: 0.003, speed: 0.015, color: 'rgba(255, 120, 0, 0.1)', lineWidth: 10 },
      { yOffset: 0.55, amplitude: 150, frequency: 0.001, speed: 0.005, color: 'rgba(255, 180, 50, 0.05)', lineWidth: 40 },
    ];

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'screen';
      
      time += 1;

      // Draw Flowing Waves
      waves.forEach(wave => {
        ctx.beginPath();
        ctx.moveTo(0, canvas.height * wave.yOffset);
        for (let x = 0; x < canvas.width; x += 10) {
          const y = canvas.height * wave.yOffset + 
                    Math.sin(x * wave.frequency + time * wave.speed) * wave.amplitude +
                    Math.cos(x * wave.frequency * 0.5 - time * wave.speed * 0.8) * (wave.amplitude * 0.5);
          ctx.lineTo(x, y);
        }
        ctx.strokeStyle = wave.color;
        ctx.lineWidth = wave.lineWidth;
        
        // Add glow to waves
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ff9933';
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      // Draw Bokeh Particles
      particles.forEach(p => {
        p.x += p.vx; 
        p.y += p.vy;
        
        // Wrap around
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;
        if (p.y < -10) p.y = canvas.height + 10;
        if (p.y > canvas.height + 10) p.y = -10;

        ctx.beginPath(); 
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        
        // Glowing bokeh effect
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        gradient.addColorStop(0, `rgba(255, 200, 100, ${p.alpha})`);
        gradient.addColorStop(1, 'rgba(255, 153, 51, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fill();
      });

      animId = requestAnimationFrame(loop);
    };
    loop();
    
    return () => { 
      cancelAnimationFrame(animId); 
      window.removeEventListener('resize', resize); 
    };
  }, []);

  return <canvas ref={canvasRef} className="lp-particle-canvas" />;
}


function Counter({ target, suffix = '', prefix = '', duration = 2000 }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        const tick = (now) => {
          const p = Math.min((now - start) / duration, 1);
          const ease = 1 - Math.pow(1 - p, 3);
          setVal(Math.floor(ease * target));
          if (p < 1) requestAnimationFrame(tick); else setVal(target);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target, duration]);
  return <span ref={ref}>{prefix}{val.toLocaleString()}{suffix}</span>;
}

function FeatureCard({ icon, title, desc, img, delay = 0 }) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect(); } }, { threshold: 0.15 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={'lp-feature-card' + (vis ? ' lp-visible' : '')} style={{ transitionDelay: delay + 'ms' }}>
      {img && <img src={img} alt={title} className="lp-feature-img" loading="lazy" />}
      <div className="lp-feature-body">
        <div className="lp-feature-icon">{icon}</div>
        <h3 className="lp-feature-title">{title}</h3>
        <p className="lp-feature-desc">{desc}</p>
      </div>
    </div>
  );
}

function TimelineItem({ phase, title, desc, idx }) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect(); } }, { threshold: 0.2 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={'lp-timeline-item' + (vis ? ' lp-visible' : '') + (idx % 2 === 1 ? ' lp-timeline-right' : '')} style={{ transitionDelay: (idx * 120) + 'ms' }}>
      <div className="lp-timeline-phase">{phase}</div>
      <div className="lp-timeline-body">
        <h3 className="lp-timeline-title">{title}</h3>
        <p className="lp-timeline-desc">{desc}</p>
      </div>
    </div>
  );
}

function PortalCard({ icon, name, desc, path, color, navigate }) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect(); } }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={'lp-portal-card' + (vis ? ' lp-visible' : '')} style={{ '--card-accent': color }} onClick={() => navigate(path)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && navigate(path)}>
      <div className="lp-portal-icon">{icon}</div>
      <div className="lp-portal-name">{name}</div>
      <div className="lp-portal-desc">{desc}</div>
      <div className="lp-portal-arrow">&#8594;</div>
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);
  useEffect(() => {
    setTimeout(() => setHeroVisible(true), 100);
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const features = [
    { icon: '🤖', title: 'AI Risk Engine', desc: 'Statistical z-score anomaly detection, timeline velocity analysis and plain-language explanations for every red flag.', img: '/risk_engine.jpg', delay: 0 },
    { icon: '🔗', title: 'Tamper-Evident Ledger', desc: 'Every action SHA-256 hash-chained. Edit a single record — the chain breaks and the culprit is instantly pinpointed.', img: '/audit_ledger.jpg', delay: 100 },
    { icon: '🕸', title: 'Nexus Corruption Graph', desc: 'D3.js force-directed graph exposing exclusive dealing, shell entity clusters and geographic triangles in real time.', img: '/nexus_network.jpg', delay: 200 },
    { icon: '👥', title: 'Citizen Watchdog', desc: 'Community crowd-intelligence reports validated against official data. Disagreement becomes a quantified fraud signal.', img: '/citizen_portal.jpg', delay: 300 },
  ];
  const stats = [
    { label: 'MPs Monitored', value: 543, prefix: '', suffix: '' },
    { label: 'Projects Tracked', value: 12847, prefix: '', suffix: '+' },
    { label: 'Fraud Flags Raised', value: 2340, prefix: '', suffix: '+' },
    { label: 'Funds Protected', value: 480, prefix: 'Rs ', suffix: 'Cr' },
  ];
  const timeline = [
    { phase: '01', title: 'Proposal Submitted', desc: 'MP creates a fund proposal instantly logged to the immutable audit chain.' },
    { phase: '02', title: 'AI Risk Score', desc: 'Our engine scores cost anomalies, timeline mismatch and agency trust before approval.' },
    { phase: '03', title: 'Ministry Review', desc: 'Ministry approves or rejects with full context, no information asymmetry.' },
    { phase: '04', title: 'Real-Time Monitoring', desc: 'Citizens, agencies and ministry track live progress with community verification.' },
    { phase: '05', title: 'Fraud Detection', desc: 'Nexus graph, double-funding detector and satellite verification catch bad actors.' },
  ];
  const portals = [
    { icon: '🏛', name: 'Citizen Portal', desc: 'No login needed. Full transparency for the public.', path: '/login', color: '#138808' },
    { icon: '🎖', name: 'MP Dashboard', desc: 'Proposals, real-time alerts, AI risk visibility.', path: '/login', color: '#ff9933' },
    { icon: '🏢', name: 'Ministry Dashboard', desc: 'Approve/reject with full AI context and analytics.', path: '/login', color: '#f59e0b' },
    { icon: '🏗', name: 'Agency Dashboard', desc: 'Progress updates, trust score, community feedback.', path: '/login', color: '#e07820' },
    { icon: '🔍', name: 'Nexus Detector', desc: 'Corruption network graph powered by D3 force layout.', path: '/login', color: '#dc2626' },
    { icon: '📋', name: 'MP Scorecards', desc: 'Transparent, formula-driven accountability scores.', path: '/login', color: '#1e3a5f' },
  ];

  return (
    <div className="lp-root">
      <nav className={'lp-nav' + (scrolled ? ' lp-nav-scrolled' : '')}>
        <div className="lp-nav-logo">
          <span className="lp-logo-shield">👁️</span>
          <span className="lp-logo-text">Nirikshan<span className="lp-logo-accent"> AI</span></span>
        </div>
        <div className="lp-nav-links">
          <a href="#features" className="lp-nav-link">Features</a>
          <a href="#stats" className="lp-nav-link">Impact</a>
          <a href="#how" className="lp-nav-link">How It Works</a>
          <button id="launch-app-btn" className="lp-btn-primary" onClick={() => navigate('/login')}>Launch App &rarr;</button>
        </div>
      </nav>

      <section className="lp-hero">
        <ParticleCanvas />

        <div className={`lp-hero-content` + (heroVisible ? ' lp-hero-visible' : '')} style={{ position: 'relative', zIndex: 1 }}>
          <div className="lp-hero-badge-pill">
            <span className="lp-badge-dot" />
            India's Most Advanced MPLAD Monitoring Platform
          </div>
          <h1 className="lp-hero-title">
            Radical Transparency<br />
            <span className="lp-gradient-text">for Public Funds</span>
          </h1>
          <p className="lp-hero-sub">
            Real-time AI risk scoring · Tamper-evident audit ledger · Corruption network graphs · Cross-scheme double-funding detection · MP accountability scorecards
          </p>
          <div className="lp-hero-actions">
            <button id="hero-launch-btn" className="lp-btn-primary lp-btn-lg" onClick={() => navigate('/login')}>Explore Dashboard</button>
            <button id="hero-audit-btn" className="lp-btn-ghost lp-btn-lg" onClick={() => navigate('/login')}>View Audit Ledger</button>
          </div>
          <div className="lp-hero-trust">
            <span>SHA-256 Hash-Chained</span>
            <span>Real-time AI</span>
            <span>Open to All Citizens</span>
          </div>
        </div>
        <div className={`lp-hero-img-wrap` + (heroVisible ? ' lp-hero-visible' : '')} style={{ transitionDelay: '300ms', position: 'relative', zIndex: 1 }}>
          <div className="lp-hero-glow" />
          {/* ── Ashoka Chakra + Data Viz ── */}
          <div className="lp-chakra-wrap" style={{ position: 'relative', zIndex: 1 }}>
            <svg className="lp-chakra-svg" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
              {/* Outer tricolor ring */}
              <circle cx="200" cy="200" r="185" fill="none" stroke="#ff9933" strokeWidth="6" strokeDasharray="8 6" className="lp-ring-saffron" />
              <circle cx="200" cy="200" r="165" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4 4" className="lp-ring-gold" />
              <circle cx="200" cy="200" r="145" fill="none" stroke="#138808" strokeWidth="6" strokeDasharray="8 6" className="lp-ring-green" />
              {/* Center circle */}
              <circle cx="200" cy="200" r="80" fill="rgba(255,153,51,0.06)" stroke="#ff9933" strokeWidth="2" />
              <circle cx="200" cy="200" r="60" fill="rgba(245,158,11,0.08)" stroke="#f59e0b" strokeWidth="1.5" />
              {/* Ashoka Chakra spokes (24 spokes) */}
              {Array.from({length: 24}, (_, i) => {
                const angle = (i * 360 / 24) * Math.PI / 180;
                const x1 = 200 + 20 * Math.cos(angle);
                const y1 = 200 + 20 * Math.sin(angle);
                const x2 = 200 + 70 * Math.cos(angle);
                const y2 = 200 + 70 * Math.sin(angle);
                return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1e3a5f" strokeWidth="2" strokeLinecap="round" opacity="0.7" />;
              })}
              {/* Shield icon in center */}
              <text x="200" y="215" textAnchor="middle" fontSize="48" dominantBaseline="middle">⚖️</text>
              {/* Data nodes on outer ring */}
              {[0, 72, 144, 216, 288].map((deg, i) => {
                const angle = deg * Math.PI / 180;
                const x = 200 + 160 * Math.cos(angle);
                const y = 200 + 160 * Math.sin(angle);
                const colors = ['#ff9933','#138808','#f59e0b','#ff9933','#138808'];
                return <circle key={i} cx={x} cy={y} r="10" fill={colors[i]} opacity="0.9" className="lp-node-pulse" style={{animationDelay: `${i*0.4}s`}} />;
              })}
              {/* Connecting arcs between nodes */}
              <circle cx="200" cy="200" r="160" fill="none" stroke="rgba(255,153,51,0.15)" strokeWidth="1" strokeDasharray="5 3" />
            </svg>
            {/* Floating stat badges */}
            <div className="lp-hero-badge-float lp-float-1">🚨 LIVE: 3 Fraud Flags</div>
            <div className="lp-hero-badge-float lp-float-2">🔐 Chain Integrity: ✓ OK</div>
            <div className="lp-hero-badge-float lp-float-3">📊 Risk Score: 84/100</div>
          </div>
        </div>
      </section>

      <section id="stats" className="lp-stats-section">
        <div className="lp-stats-grid">
          {stats.map(s => (
            <div key={s.label} className="lp-stat-card">
              <div className="lp-stat-value"><Counter target={s.value} prefix={s.prefix} suffix={s.suffix} /></div>
              <div className="lp-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="lp-features-section">
        <div className="lp-section-header">
          <div className="lp-section-tag">Core Capabilities</div>
          <h2 className="lp-section-title">Every Tool a Watchdog Needs</h2>
          <p className="lp-section-sub">From AI anomaly detection to citizen crowd-intelligence, built for zero tolerance on public fund misuse.</p>
        </div>
        <div className="lp-features-grid">
          {features.map(f => <FeatureCard key={f.title} {...f} />)}
        </div>
      </section>

      <section id="how" className="lp-how-section">
        <div className="lp-section-header">
          <div className="lp-section-tag">The Process</div>
          <h2 className="lp-section-title">How Sentinel Works</h2>
          <p className="lp-section-sub">Every rupee's journey from proposal to completion is observable, verified and fraud-resistant.</p>
        </div>
        <div className="lp-timeline">
          {timeline.map((t, i) => <TimelineItem key={t.phase} {...t} idx={i} />)}
        </div>
      </section>

      <section className="lp-portals-section">
        <div className="lp-section-header">
          <div className="lp-section-tag">Access Levels</div>
          <h2 className="lp-section-title">Built for Every Stakeholder</h2>
        </div>
        <div className="lp-portals-grid">
          {portals.map(p => <PortalCard key={p.name} {...p} navigate={navigate} />)}
        </div>
      </section>

      <section className="lp-cta-section">
        <div className="lp-cta-glow" />
        <h2 className="lp-cta-title">India's Public Funds Deserve<br /><span className="lp-gradient-text">Radical Accountability</span></h2>
        <p className="lp-cta-sub">Join the movement for zero tolerance on MPLAD misuse. Real data. Real detection. Real change.</p>
        <div className="lp-cta-actions">
          <button id="cta-citizen-btn" className="lp-btn-primary lp-btn-lg" onClick={() => navigate('/login')}>Enter as Citizen</button>
          <button id="cta-audit-btn" className="lp-btn-ghost lp-btn-lg" onClick={() => navigate('/login')}>Verify Audit Chain</button>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-footer-brand">Nirikshan<span className="lp-logo-accent"> AI</span></div>
        <p className="lp-footer-copy">Built for hackathon demonstration. SHA-256 hash-chain audit, AI risk engine, D3 network graphs.</p>
        <p className="lp-footer-stack">React 18 · Vite · D3.js · Leaflet.js · Node.js · Express</p>
      </footer>
    </div>
  );
}
