import React, { useState } from 'react';
import { 
  Container, 
  Nav, 
  Navbar, 
  Button, 
  Row, 
  Col 
} from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

import Admin from './Admin/Admin';
import AdminLogin from './Admin/AdminLogin';
import EvaluatorLogin from './Evaluator/Evaluator';
import StudentLogin from './Student/Student';
import EvaluatorHome from './Evaluator/EvaluatorHome';
import StudentHome from './Student/StudentHome';

function Homepage({ onLoginClick }) {
  const [hoveredCard, setHoveredCard] = useState(null);
  const [hoveredNav, setHoveredNav] = useState(null);

  const handleCardHover = (cardId) => {
    setHoveredCard(cardId);
  };

  const handleCardLeave = () => {
    setHoveredCard(null);
  };

  const handleNavHover = (navId) => {
    setHoveredNav(navId);
  };

  const handleNavLeave = () => {
    setHoveredNav(null);
  };

  const handleCheckResults = () => {
    onLoginClick('student');
  };

  // Create navLinks array inside the component so it has access to onLoginClick
  const navLinks = [
    {},
    { id: 2, name: 'Admin', href: '#admin' },
    { id: 3, name: 'Evaluator', href: '#evaluator' },
    { id: 4, name: 'Settings', href: '#settings' },
    { id: 5, name: 'Support', href: '#support' }
  ];

  const handleNavClick = (linkName) => {
    if (linkName === 'Admin') {
      onLoginClick('admin');
    } else if (linkName === 'Evaluator') {
      onLoginClick('evaluator');
    }
  };

  const cards = [
    {
      id: 1,
      title: 'AI-Powered Analysis',
      description: 'Our advanced AI algorithms evaluate and analyze data with precision and efficiency.',
      icon: '📊',
      link: '#analysis'
    },
    {
      id: 2,
      title: 'Real-time Evaluation',
      description: 'Get instant feedback and evaluations for your projects and workflows.',
      icon: '⚡',
      link: '#realtime'
    },
    {
      id: 3,
      title: 'Customizable Metrics',
      description: 'Tailor evaluation criteria to match your specific requirements and goals.',
      icon: '⚙️',
      link: '#metrics'
    },
    {
      id: 4,
      title: 'Comprehensive Reports',
      description: 'Generate detailed reports with actionable insights and recommendations.',
      icon: '📈',
      link: '#reports'
    }
  ];

  return (
    <div className={`app-container ${hoveredCard ? 'peach-bg' : ''}`}>
      {/* Navigation Bar */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm fixed-top">
        <div className="container-fluid">
          <a className="navbar-brand fw-bold fs-3 text-primary" href="#home">
            <span className="brand-text">Agentic AI Assistive Evaluation System</span>
          </a>
          
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span className="navbar-toggler-icon"></span>
          </button>
          
          <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
            <ul className="navbar-nav">
              {navLinks.map((link) => (
                <li className="nav-item" key={link.id}>
                  <a 
                    className={`nav-link fw-medium px-3 py-2 mx-1 rounded ${hoveredNav === link.id ? 'nav-hovered' : ''}`}
                    href={link.href}
                    onClick={(e) => {
                      e.preventDefault();
                      if (link.name === 'Admin' || link.name === 'Evaluator') {
                        handleNavClick(link.name);
                      }
                    }}
                    onMouseEnter={() => handleNavHover(link.id)}
                    onMouseLeave={handleNavLeave}
                  >
                    {link.name}
                    <span className="nav-underline"></span>
                  </a>
                </li>
              ))}
              {/* Student Login Button - kept as separate button since it's not in navLinks */}
              <li className="nav-item">
                
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container-fluid mt-5 pt-5">
        {/* Hero Section */}
        <section className="row align-items-center py-5 mt-4">
          <div className="col-lg-6">
            <h1 className="display-4 fw-bold mb-4">
              Welcome to <span className="text-primary">Agentic AI</span> Assistive Evaluation System
            </h1>
            <p className="lead mb-4">
              A cutting-edge AI platform designed to provide intelligent evaluation, 
              analysis, and insights for your projects and processes. Harness the power 
              of artificial intelligence to make better decisions faster.
            </p>
            <button 
              onClick={() => onLoginClick('evaluator')}
              className="btn btn-primary btn-lg px-4 me-2"
            >
              Try Evaluator
            </button>
            <button 
              onClick={() => onLoginClick('student')}
              className="btn btn-outline-primary btn-lg px-4"
            >
              View Demo
            </button>
          </div>
          <div className="col-lg-6 text-center">
            <div className="status-update p-4">
              <div className="status-icon mb-3">
                <span className="display-4">📢</span>
              </div>
              <h3 className="fw-bold mb-3 status-title">Latest Updates</h3>
              <div className="status-content p-3 rounded">
                <div className="mb-4">
                  <h5 className="fw-bold mb-2 status-heading">
                    AI/ML Results Available
                  </h5>
                  <p className="status-text mb-0">
                    The AI and Machine Learning evaluation results have been processed and are now available for review. 
                    Students can check their performance metrics and detailed analysis reports.
                  </p>
                </div>
                <div className="mb-4">
                  <h5 className="fw-bold mb-2 status-heading">
                    Java Evaluation
                  </h5>
                  <p className="status-text mb-0">
                    Java programming assignments evaluation is currently in progress. 
                    Our system is analyzing code quality, efficiency, and best practices. 
                    Results will be available shortly.
                  </p>
                </div>
                <div>
                  <h5 className="fw-bold mb-2 status-heading">
                    Python & Data Science
                  </h5>
                  <p className="status-text mb-0">
                    Python programming and Data Science project evaluations will begin next week. 
                    Please ensure all submissions are completed by the deadline.
                  </p>
                </div>
              </div>
              <p className="text-muted mt-3 status-note">
                All evaluations are conducted using our advanced AI algorithms
              </p>
            </div>
          </div>
        </section>

        {/* Cards Section */}
        <section className="row my-5 py-5 core-features-section">
          <div className="col-12 text-center mb-5">
            <h2 className="fw-bold mb-3 section-title">
              Core Features
            </h2>
            <p className="text-muted fs-5 section-subtitle">
              Discover the powerful capabilities of our AI evaluation system
            </p>
          </div>
          
          {cards.map((card) => (
            <div 
              className="col-md-6 col-lg-3 mb-4" 
              key={card.id}
              onMouseEnter={() => handleCardHover(card.id)}
              onMouseLeave={handleCardLeave}
            >
              <div className={`card h-100 shadow-sm card-hover ${hoveredCard === card.id ? 'card-active' : ''}`}>
                <div className="card-body text-center p-4">
                  <div className="card-icon display-4 mb-3">{card.icon}</div>
                  <h5 className="card-title fw-bold mb-3">{card.title}</h5>
                  <p className="card-text text-muted">{card.description}</p>
                </div>
                <div className="card-footer bg-transparent border-0 pb-4">
                  <a href="#features" className="btn btn-outline-primary">Learn More</a>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Check Results Button Section */}
        <section className="row my-5">
          <div className="col-12 text-center">
            <div className="check-results-container p-5 rounded-4 shadow-lg">
              <h3 className="fw-bold mb-3 display-5">Ready to See Your Results?</h3>
              <p className="lead mb-4 fs-4">
                Get instant AI-powered evaluation results for your projects
              </p>
              <button 
                onClick={handleCheckResults}
                className="btn btn-success btn-lg px-5 py-3 check-results-btn"
              >
                <span className="btn-icon">📋</span>
                <span className="btn-text">Check Results</span>
                <span className="btn-arrow">→</span>
              </button>
              <p className="text-muted mt-3">
                <small>Login as a student to view comprehensive AI analysis and detailed performance metrics</small>
              </p>
            </div>
          </div>
        </section>

        {/* Login Options Section */}
        <section className="row bg-light rounded-3 p-5 my-5">
          <div className="col-12 text-center mb-4">
            <h3 className="fw-bold mb-3">Access Your Account</h3>
            <p className="mb-4">Choose your role to login to the system</p>
          </div>
          
          <div className="col-md-4 text-center mb-3">
            <div className="p-4 h-100 bg-white rounded shadow">
              <div className="mb-3">
                <span className="display-4">👨‍💼</span>
              </div>
              <h4 className="fw-bold mb-3">Administrator</h4>
              <p className="text-muted mb-4">System administration and management</p>
              <button 
                onClick={() => onLoginClick('admin')}
                className="btn btn-primary btn-lg w-100"
              >
                Admin Login
              </button>
            </div>
          </div>
          
          <div className="col-md-4 text-center mb-3">
            <div className="p-4 h-100 bg-white rounded shadow">
              <div className="mb-3">
                <span className="display-4">📝</span>
              </div>
              <h4 className="fw-bold mb-3">Evaluator</h4>
              <p className="text-muted mb-4">Subject evaluation and assessment</p>
              <button 
                onClick={() => onLoginClick('evaluator')}
                className="btn btn-success btn-lg w-100"
              >
                Evaluator Login
              </button>
            </div>
          </div>
          
          <div className="col-md-4 text-center mb-3">
            <div className="p-4 h-100 bg-white rounded shadow">
              <div className="mb-3">
                <span className="display-4">🎓</span>
              </div>
              <h4 className="fw-bold mb-3">Student</h4>
              <p className="text-muted mb-4">Access evaluations and results</p>
              <button 
                onClick={() => onLoginClick('student')}
                className="btn btn-info btn-lg w-100 text-white"
              >
                Student Login
              </button>
            </div>
          </div>
        </section>

        {/* Additional Info Section */}
        <section className="row bg-white rounded-3 p-5 my-5">
          <div className="col-lg-8">
            <h3 className="fw-bold mb-3">Why Choose Our AI Evaluation System?</h3>
            <p className="mb-4">
              Our Agentic AI Assistive Evaluation System leverages state-of-the-art machine learning 
              algorithms to provide accurate, unbiased, and actionable evaluations. Whether you're 
              assessing projects, performance, or processes, our system adapts to your specific needs.
            </p>
            <ul className="list-unstyled">
              <li className="mb-2">✅ Advanced machine learning models</li>
              <li className="mb-2">✅ Customizable evaluation criteria</li>
              <li className="mb-2">✅ Real-time analytics and feedback</li>
              <li className="mb-2">✅ Secure and confidential data handling</li>
              <li className="mb-2">✅ Integration with popular platforms</li>
            </ul>
          </div>
          <div className="col-lg-4 text-center">
            <div className="bg-primary text-white rounded-3 p-4 h-100 d-flex flex-column justify-content-center">
              <h4 className="fw-bold">Get Started Today</h4>
              <p className="mb-3">Begin your journey with intelligent AI evaluation</p>
              <button 
                onClick={() => onLoginClick('student')}
                className="btn btn-light btn-lg"
              >
                Start Free Trial
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-dark text-white py-4 mt-5">
        <div className="container">
          <div className="row">
            <div className="col-md-6">
              <h5 className="fw-bold">Agentic AI Assistive Evaluation System</h5>
              <p className="text-muted">© 2023 All rights reserved.</p>
            </div>
            <div className="col-md-6 text-md-end">
              <a href="#privacy" className="text-white text-decoration-none me-3">Privacy Policy</a>
              <a href="#terms" className="text-white text-decoration-none me-3">Terms of Service</a>
              <a href="#contact" className="text-white text-decoration-none">Contact Us</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

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

  const handleBackToHome = () => {
    setCurrentView('home');
  };

  const handleLoginClick = (role) => {
    setCurrentView(role);
  };

  const renderContent = () => {
    if (user) {
      // Route to appropriate dashboard based on user role
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

    // Login views when no user is logged in
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
      {/* Only show navbar for non-admin users who are logged in */}
      {user && user.role !== 'admin' && (
        <Navbar bg="dark" variant="dark" expand="lg">
          <Container>
            <Navbar.Brand>
              <strong>Agentic AI Evaluation System</strong>
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="me-auto">
                <Nav.Link active>Dashboard</Nav.Link>
              </Nav>
              <Nav>
                <Navbar.Text className="text-light">
                  <i className="bi bi-person-circle me-1"></i>
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