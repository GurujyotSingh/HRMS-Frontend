import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import Button from '../../components/ui/Button';

const Unauthorized: React.FC = () => {
  return (
    <div className="unauthorized-page">
      <div className="unauthorized-content">
        <FontAwesomeIcon icon={faLock} className="error-icon" />
        <h1>403</h1>
        <h2>Access Denied</h2>
        <p>You don't have permission to access this page.</p>
        <Link to="/">
          <Button variant="primary">
            <FontAwesomeIcon icon={faArrowLeft} /> Go Back
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;