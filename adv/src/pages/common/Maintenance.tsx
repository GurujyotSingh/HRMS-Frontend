import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTools, faClock } from '@fortawesome/free-solid-svg-icons';
import Button from '../../components/ui/Button';

const Maintenance: React.FC = () => {
  return (
    <div className="maintenance-page">
      <div className="maintenance-content">
        <FontAwesomeIcon icon={faTools} className="maintenance-icon" />
        <h1>Under Maintenance</h1>
        <p>We're currently performing scheduled maintenance.</p>
        <p className="estimate">
          <FontAwesomeIcon icon={faClock} /> Estimated completion: 2 hours
        </p>
        <Button variant="primary" onClick={() => window.location.reload()}>
          Refresh Page
        </Button>
      </div>
    </div>
  );
};

export default Maintenance;