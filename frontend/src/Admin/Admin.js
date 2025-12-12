import React from 'react';
import { Container, Button, Alert } from 'react-bootstrap';
import AdminDashboard from './AdminDashboard'; // Same folder// Import from Admin folder

const Admin = ({ user, onLogout }) => {
  // Add null check for user
  if (!user) {
    return (
      <Container className="mt-5 text-center">
        <div className="p-5 bg-white rounded shadow">
          <h2 className="text-danger mb-4">User Not Found</h2>
          <p className="lead mb-4">
            Unable to load user information. Please try logging in again.
          </p>
          <Button variant="outline-danger" onClick={onLogout}>
            Return to Login
          </Button>
        </div>
      </Container>
    );
  }


  // Check if user has admin privileges
  if (user.role !== 'admin') {
    return (
      <Container className="mt-5 text-center">
        <div className="p-5 bg-white rounded shadow">
          <h2 className="text-danger mb-4">Access Denied</h2>
          <h4 className="mb-3">Insufficient Permissions</h4>
          <p className="lead">
            You don't have admin privileges to access this section.
          </p>
          <Button variant="outline-danger" onClick={onLogout}>
            Return to Login
          </Button>
        </div>
      </Container>
    );
  }

  // Show admin dashboard
  return (
    <div>
      <Alert variant="info" className="mb-0 text-center">
        <strong>Admin Mode Active</strong> - You have full system access
      </Alert>
      
      <AdminDashboard user={user} onLogout={onLogout} />
    </div>
  );
};

export default Admin;