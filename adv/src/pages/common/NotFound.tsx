import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faHome } from '@fortawesome/free-solid-svg-icons';
import Button from '../../components/ui/Button';

const NotFound: React.FC = () => {
  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <FontAwesomeIcon icon={faExclamationTriangle} className="error-icon" />
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>The page you are looking for doesn't exist or has been moved.</p>
        <Link to="/">
          <Button variant="primary">
            <FontAwesomeIcon icon={faHome} /> Go to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;