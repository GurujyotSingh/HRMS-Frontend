import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClock,
  faCheckCircle,
  faTimesCircle,
  faMapMarkerAlt,
  faWifi,
  faCamera,
  faInfoCircle,

  faArrowRight,
} from '@fortawesome/free-solid-svg-icons';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { useNotification } from '../../../hooks/useNotification';
import { formatTime } from '../../../utils/formatters';

const ClockInOut: React.FC = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [location, setLocation] = useState({ lat: null, lon: null, address: 'Fetching location...' });
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);

  useEffect(() => {
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            address: 'University Campus, Main Building',
          });
          setLocationPermission(true);
        },
        (error) => {
          setLocationPermission(false);
          setLocation({ ...location, address: 'Location access denied' });
        }
      );
    } else {
      setLocationPermission(false);
      setLocation({ ...location, address: 'Geolocation not supported' });
    }

    // Load attendance history
    setAttendanceHistory([
      { date: '2024-03-15', checkIn: '09:00', checkOut: '18:00', hours: '9h', status: 'Present' },
      { date: '2024-03-14', checkIn: '08:55', checkOut: '18:05', hours: '9h 10m', status: 'Present' },
      { date: '2024-03-13', checkIn: '09:15', checkOut: '18:00', hours: '8h 45m', status: 'Late' },
      { date: '2024-03-12', checkIn: '09:00', checkOut: '18:00', hours: '9h', status: 'Present' },
    ]);

    return () => clearInterval(timer);
  }, []);

  const handleClockIn = () => {
    if (!locationPermission) {
      showNotification('Please enable location services to clock in', 'warning');
      return;
    }

    setCheckedIn(true);
    setCheckInTime(formatTime(currentTime.toLocaleTimeString()));
    showNotification('Checked in successfully!', 'success');
  };

  const handleClockOut = () => {
    setCheckedIn(false);
    showNotification('Checked out successfully!', 'success');
  };

  const handleCameraCapture = () => {
    // Simulate camera capture
    showNotification('Photo captured for attendance', 'success');
  };

  return (
    <div className="clock-in-out-page">
      <div className="page-header">
        <h1>Attendance</h1>
        <p>Clock in/out and track your attendance</p>
      </div>

      <div className="clock-grid">
        {/* Main Clock Card */}
        <div className="clock-main">
          <Card className="clock-card">
            <div className="current-time">
              <h2>{formatTime(currentTime.toLocaleTimeString())}</h2>
              <p>{currentTime.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
            </div>

            <div className="clock-status">
              <div className={`status-indicator ${checkedIn ? 'checked-in' : 'checked-out'}`}>
                <div className="pulse"></div>
                <span>{checkedIn ? 'You are checked in' : 'You are checked out'}</span>
              </div>
              {checkedIn && checkInTime && (
                <div className="check-in-time">
                  <FontAwesomeIcon icon={faClock} />
                  <span>Checked in at: {checkInTime}</span>
                </div>
              )}
            </div>

            <div className="clock-actions">
              {!checkedIn ? (
                <Button
                  variant="success"
                  size="large"
                  onClick={handleClockIn}
                  fullWidth
                  disabled={!locationPermission}
                >
                  <FontAwesomeIcon icon={faCheckCircle} /> Clock In
                </Button>
              ) : (
                <Button
                  variant="danger"
                  size="large"
                  onClick={handleClockOut}
                  fullWidth
                >
                  <FontAwesomeIcon icon={faTimesCircle} /> Clock Out
                </Button>
              )}
            </div>

            <div className="location-info">
              <FontAwesomeIcon icon={faMapMarkerAlt} />
              <span>{location.address}</span>
              {!locationPermission && (
                <span className="warning"> (Enable location for accurate tracking)</span>
              )}
            </div>

            <div className="quick-actions">
              <button className="quick-action" onClick={handleCameraCapture}>
                <FontAwesomeIcon icon={faCamera} />
                <span>Take Photo</span>
              </button>
              <button className="quick-action">
                <FontAwesomeIcon icon={faWifi} />
                <span>WiFi Login</span>
              </button>
            </div>
          </Card>

          <Card className="info-card">
            <div className="info-header">
              <FontAwesomeIcon icon={faInfoCircle} />
              <h3>Today's Summary</h3>
            </div>
            <div className="info-stats">
              <div className="stat">
                <span className="label">Expected Hours</span>
                <span className="value">9 hours</span>
              </div>
              <div className="stat">
                <span className="label">Completed</span>
                <span className="value success">4.5 hours</span>
              </div>
              <div className="stat">
                <span className="label">Remaining</span>
                <span className="value warning">4.5 hours</span>
              </div>
            </div>
          </Card>
        </div>

        {/* History Sidebar */}
        <div className="clock-sidebar">
          <Card className="history-card" title="Recent Activity">
            <div className="history-list">
              {attendanceHistory.map((record, index) => (
                <div key={index} className="history-item">
                  <div className="history-date">{record.date}</div>
                  <div className="history-details">
                    <span className="time">{record.checkIn} - {record.checkOut}</span>
                    <span className={`status ${record.status.toLowerCase()}`}>{record.status}</span>
                  </div>
                  <div className="history-hours">{record.hours}</div>
                </div>
              ))}
            </div>
            <Button 
              variant="link" 
              className="view-all"
              onClick={() => navigate('/user/attendance')}
            >
              View Full History <FontAwesomeIcon icon={faArrowRight} />
            </Button>
          </Card>

          <Card className="tips-card" title="Quick Tips">
            <ul className="tips-list">
              <li>
                <FontAwesomeIcon icon={faInfoCircle} />
                <span>Remember to clock in within 15 minutes of arrival</span>
              </li>
              <li>
                <FontAwesomeIcon icon={faInfoCircle} />
                <span>Take a photo for verification if required</span>
              </li>
              <li>
                <FontAwesomeIcon icon={faInfoCircle} />
                <span>WiFi login automatically records your attendance</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ClockInOut;