import React, { useState } from 'react';
import {
  Container,
  Nav,
  Navbar,
  Button,
} from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

import Admin from './Admin/Admin';
import AdminLogin from './Admin/AdminLogin';
import EvaluatorLogin from './Evaluator/Evaluator';
import StudentLogin from './Student/Student';
import EvaluatorHome from './Evaluator/EvaluatorHome';
import StudentHome from './Student/StudentHome';

/* ─────────────────────────────────────────────────────────────
   HERO RIGHT — animated AI visualisation panel
───────────────────────────────────────────────────────────── */
function HeroVisual() {
  return (
    <div className="hero-visual">
      {/* Main card */}
      <div className="vis-card main-card">
        <div className="vc-label">📊 Live Evaluation</div>
        <div className="vc-title">AI Score Analysis</div>
        <div className="vc-score">94.7%</div>
        <div className="vc-sub">Accuracy · Last 30 days</div>
        <div className="bar-chart">
          <div className="bar" style={{ height: '70%' }}></div>
          <div className="bar" style={{ height: '85%' }}></div>
          <div className="bar" style={{ height: '60%' }}></div>
          <div className="bar" style={{ height: '100%' }}></div>
          <div className="bar" style={{ height: '78%' }}></div>
        </div>
      </div>

      {/* Mini card 1 */}
      <div className="vis-card mini-card-1">
        <div className="vc-label">⚡ Status</div>
        <div className="status-row">
          <span className="status-dot green"></span>
          <span className="s-label">Evaluations</span>
          <span className="s-value" style={{ color: '#10b981' }}>Live</span>
        </div>
        <div className="status-row">
          <span className="status-dot blue"></span>
          <span className="s-label">Reports</span>
          <span className="s-value" style={{ color: '#06b6d4' }}>Ready</span>
        </div>
        <div className="status-row">
          <span className="status-dot purple"></span>
          <span className="s-label">AI Model</span>
          <span className="s-value" style={{ color: '#8b5cf6' }}>Active</span>
        </div>
      </div>

      {/* Mini card 2 */}
      <div className="vis-card mini-card-2">
        <div className="vc-label">🎓 Students</div>
        <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#10b981' }}>1,240+</div>
        <div className="vc-sub">Evaluated this month</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   HOMEPAGE
───────────────────────────────────────────────────────────── */
function Homepage({ onLoginClick }) {
  const [hoveredNav, setHoveredNav] = useState(null);

  const navLinks = [
    { id: 2, name: 'Admin',     href: '#admin' },
    { id: 3, name: 'Evaluator', href: '#evaluator' },
    { id: 4, name: 'Settings',  href: '#settings' },
    { id: 5, name: 'Support',   href: '#support' },
  ];

  const handleNavClick = (name) => {
    if (name === 'Admin')     onLoginClick('admin');
    if (name === 'Evaluator') onLoginClick('evaluator');
  };

  const features = [
    {
      id: 1,
      icon: '📊',
      color: 'blue',
      title: 'AI-Powered Analysis',
      desc: 'Our advanced AI algorithms evaluate and analyse data with precision and efficiency, cutting manual effort by 85%.',
    },
    {
      id: 2,
      icon: '⚡',
      color: 'cyan',
      title: 'Real-time Evaluation',
      desc: 'Get instant feedback and evaluations for your submissions — results in seconds, not days.',
    },
    {
      id: 3,
      icon: '⚙️',
      color: 'violet',
      title: 'Customisable Metrics',
      desc: 'Tailor evaluation criteria to match your specific requirements and academic standards.',
    },
    {
      id: 4,
      icon: '📈',
      color: 'green',
      title: 'Comprehensive Reports',
      desc: 'Generate detailed reports with actionable insights, trend charts, and personalised recommendations.',
    },
  ];

  const whyItems = [
    'Advanced machine learning models trained on diverse datasets',
    'Customisable evaluation criteria per subject or rubric',
    'Real-time analytics, dashboards, and instant feedback',
    'Secure and confidential end-to-end data handling',
    'Seamless integration with popular learning platforms',
  ];

  return (
    <div className="app-container">
      {/* Decorative orbs */}
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div className="orb orb-3"></div>

      {/* ── NAVBAR ── */}
      <nav className="home-navbar">
        <a className="brand" href="#home">
          <div className="brand-logo">🤖</div>
          <span className="brand-name">Agentic AI Assistive<br />Evaluation System</span>
        </a>

        <ul className="nav-links">
          {navLinks.map((link) => (
            <li key={link.id}>
              <a
                href={link.href}
                className={hoveredNav === link.id ? 'nav-hovered' : ''}
                onClick={(e) => { e.preventDefault(); handleNavClick(link.name); }}
                onMouseEnter={() => setHoveredNav(link.id)}
                onMouseLeave={() => setHoveredNav(null)}
              >
                {link.name}
              </a>
            </li>
          ))}
          <li>
            <a href="#login" className="nav-cta"
              onClick={(e) => { e.preventDefault(); onLoginClick('student'); }}>
              Student Portal →
            </a>
          </li>
        </ul>
      </nav>

      {/* ── PAGE MAIN ── */}
      <div className="page-main">

        {/* ── HERO ── */}
        <div className="hero-section">
          {/* Left */}
          <div style={{ flex: 1 }}>
            <div className="hero-badge">
              <span className="dot"></span>
              AI-Powered · Live System
            </div>

            <h1 className="hero-title">
              Intelligent Evaluation<br />
              Powered by&nbsp;
              <span className="gradient-word">Agentic AI</span>
            </h1>

            <p className="hero-subtitle">
              A cutting-edge platform designed to provide intelligent evaluation,
              analysis, and insights for students, evaluators, and administrators —
              making smarter decisions faster than ever.
            </p>

            <div className="hero-actions">
              <button
                className="btn-glow btn-glow-primary"
                onClick={() => onLoginClick('evaluator')}
              >
                🚀 Try as Evaluator
              </button>
              <button
                className="btn-glow btn-glow-outline"
                onClick={() => onLoginClick('student')}
              >
                View Demo
              </button>
            </div>
          </div>

          {/* Right — visual */}
          <div style={{ flex: 1.1, display: 'flex', justifyContent: 'center' }}>
            <HeroVisual />
          </div>
        </div>

        {/* ── STATS STRIP ── */}
        <div className="stats-strip">
          <div className="stats-inner">
            {[
              { n: '12,000+', l: 'Evaluations Completed' },
              { n: '98.5%',   l: 'Accuracy Rate' },
              { n: '500+',    l: 'Institutions' },
              { n: '<2s',     l: 'Avg. Response Time' },
            ].map((s) => (
              <div className="stat-item" key={s.l}>
                <div className="stat-number">{s.n}</div>
                <div className="stat-label">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── FEATURES ── */}
        <div className="features-section">
          <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
            <span className="section-eyebrow">Core Features</span>
            <h2 className="section-heading">
              Everything you need to<br />
              <span className="hl">evaluate smarter</span>
            </h2>
            <p className="section-desc" style={{ marginTop: '1rem' }}>
              Discover the powerful capabilities of our AI evaluation system —
              built for accuracy, speed, and transparency.
            </p>
          </div>

          <div className="features-grid">
            {features.map((f) => (
              <div className="feature-card" key={f.id}>
                <div className={`fc-icon-wrap ${f.color}`}>{f.icon}</div>
                <div className="fc-title">{f.title}</div>
                <div className="fc-desc">{f.desc}</div>
                <a href="#features" className="fc-link"
                  onClick={(e) => e.preventDefault()}>
                  Learn more →
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* ── CHECK RESULTS BANNER ── */}
        <div className="results-banner">
          <div className="results-banner-inner">
            <h3>Ready to See Your Results?</h3>
            <p>Get instant AI-powered evaluation results — detailed, unbiased, and insightful.</p>
            <button
              className="btn-check-results"
              onClick={() => onLoginClick('student')}
            >
              <span>📋</span>
              <span>Check My Results</span>
              <span className="btn-arrow">→</span>
            </button>
            <p style={{ marginTop: '1.2rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Login as a student to view comprehensive AI analysis and detailed performance metrics
            </p>
          </div>
        </div>

        {/* ── ROLES / LOGIN SECTION ── */}
        <div className="roles-section" id="access">
          <div className="roles-inner">
            <div style={{ textAlign: 'center' }}>
              <span className="section-eyebrow">Access Your Account</span>
              <h2 className="section-heading" style={{ marginTop: '0.5rem' }}>
                Choose Your&nbsp;<span className="hl">Role</span>
              </h2>
              <p className="section-desc" style={{ marginTop: '0.8rem' }}>
                Each role has a dedicated portal tailored to your responsibilities.
              </p>
            </div>

            <div className="roles-grid">
              {/* Admin */}
              <div className="role-card admin-card">
                <div className="role-icon-wrap">👨‍💼</div>
                <h4>Administrator</h4>
                <p>Full system control — manage users, configure rubrics, and oversee operations.</p>
                <button className="role-btn admin-btn" onClick={() => onLoginClick('admin')}>
                  Admin Login →
                </button>
              </div>

              {/* Evaluator */}
              <div className="role-card eval-card">
                <div className="role-icon-wrap">📝</div>
                <h4>Evaluator</h4>
                <p>Upload answer scripts, trigger AI evaluation, and review generated reports.</p>
                <button className="role-btn eval-btn" onClick={() => onLoginClick('evaluator')}>
                  Evaluator Login →
                </button>
              </div>

              {/* Student */}
              <div className="role-card student-card">
                <div className="role-icon-wrap">🎓</div>
                <h4>Student</h4>
                <p>View evaluation results, AI feedback, and performance analytics for your work.</p>
                <button className="role-btn student-btn" onClick={() => onLoginClick('student')}>
                  Student Login →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── WHY US ── */}
        <div className="why-section">
          <div className="why-inner">
            <div className="why-left">
              <h3>Why Choose Our AI Evaluation System?</h3>
              <p>
                Our Agentic AI Assistive Evaluation System leverages state-of-the-art machine
                learning to provide accurate, unbiased, and actionable evaluations — adapting
                to your institution's unique needs.
              </p>
              <ul className="why-list">
                {whyItems.map((item) => (
                  <li key={item}>
                    <span className="check-icon">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="why-right">
              <div className="gradient-box">
                <h4>Get Started Today</h4>
                <p>Begin your journey with intelligent AI evaluation — free for institutions.</p>
                <button className="gbox-btn" onClick={() => onLoginClick('student')}>
                  Start Free Trial
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>{/* end page-main */}

      {/* ── FOOTER ── */}
      <footer className="home-footer">
        <div className="footer-inner">
          <div>
            <div className="footer-brand">🤖 Agentic AI Assistive Evaluation System</div>
            <div className="footer-copy">© 2025 All rights reserved.</div>
          </div>
          <div className="footer-links">
            <a href="#privacy" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
            <a href="#terms"   onClick={(e) => e.preventDefault()}>Terms of Service</a>
            <a href="#contact" onClick={(e) => e.preventDefault()}>Contact Us</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   APP ROOT
───────────────────────────────────────────────────────────── */
function App() {
  const [currentView, setCurrentView] = useState('home');
  const [user, setUser] = useState(null);

  const handleLogin = (userData) => {
    console.log('Login data received:', userData);
    if (userData && userData.role) {
      setUser(userData);
      setCurrentView('dashboard');
    } else {
      console.error('Invalid user data received');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('home');
  };

  const handleBackToHome = () => setCurrentView('home');
  const handleLoginClick  = (role) => setCurrentView(role);

  const renderContent = () => {
    if (user) {
      switch (user.role) {
        case 'admin':
          return <Admin user={user} onLogout={handleLogout} />;
        case 'evaluator':
          return <EvaluatorHome user={user} onLogout={handleLogout} />;
        case 'student':
          return <StudentHome user={user} onLogout={handleLogout} />;
        default:
          return (
            <Container className="mt-5 text-center">
              <div className="p-5 bg-white rounded shadow">
                <h2 className="text-danger mb-4">Unknown User Role</h2>
                <p className="lead">Your user role could not be determined.</p>
                <Button variant="outline-danger" onClick={handleLogout}>
                  Return to Homepage
                </Button>
              </div>
            </Container>
          );
      }
    }

    switch (currentView) {
      case 'home':
        return <Homepage onLoginClick={handleLoginClick} />;
      case 'admin':
        return <AdminLogin onLogin={handleLogin} onBack={handleBackToHome} />;
      case 'evaluator':
        return <EvaluatorLogin onLogin={handleLogin} onBack={handleBackToHome} />;
      case 'student':
        return <StudentLogin onLogin={handleLogin} onBack={handleBackToHome} />;
      default:
        return <Homepage onLoginClick={handleLoginClick} />;
    }
  };

  return (
    <div className="App">
      {/* Logged-in shell navbar (non-admin) */}
      {user && user.role !== 'admin' && (
        <Navbar bg="dark" variant="dark" expand="lg">
          <Container>
            <Navbar.Brand>
              <strong>🤖 Agentic AI Evaluation System</strong>
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="me-auto">
                <Nav.Link active>Dashboard</Nav.Link>
              </Nav>
              <Nav>
                <Navbar.Text className="text-light me-3">
                  {user.name || user.email}
                </Navbar.Text>
                <Nav.Link className="text-light" onClick={handleLogout}>
                  Logout
                </Nav.Link>
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>
      )}
      {renderContent()}
    </div>
  );
}

export default App;