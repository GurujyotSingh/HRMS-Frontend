import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faCalendarAlt,
  faClock,
  faMapMarkerAlt,
  faLaptop,
  faChalkboard,
  faVideo,
  faCheckCircle,
  faTimesCircle,
  faHourglassHalf,
  faEye,
  faTimes,
  
} from '@fortawesome/free-solid-svg-icons';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import { useNotification } from '../../../hooks/useNotification';
import { formatDate, formatTime } from '../../../utils/formatters';

interface Booking {
  id: string;
  resourceType: 'room' | 'equipment' | 'vehicle';
  resourceName: string;
  location: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  createdAt: string;
}

const MyBookings: React.FC = () => {
  const { showNotification } = useNotification();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockBookings: Booking[] = [
        {
          id: '1',
          resourceType: 'room',
          resourceName: 'Conference Room A',
          location: 'Main Building, 2nd Floor',
          date: '2024-03-20',
          startTime: '10:00',
          endTime: '12:00',
          purpose: 'Department Meeting',
          status: 'confirmed',
          createdAt: '2024-03-15',
        },
        {
          id: '2',
          resourceType: 'equipment',
          resourceName: 'Laptop (Dell XPS)',
          location: 'IT Store',
          date: '2024-03-18',
          startTime: 'Full Day',
          endTime: 'Full Day',
          purpose: 'Conference Presentation',
          status: 'completed',
          createdAt: '2024-03-10',
        },
        {
          id: '3',
          resourceType: 'room',
          resourceName: 'Seminar Hall',
          location: 'Academic Block',
          date: '2024-03-25',
          startTime: '14:00',
          endTime: '17:00',
          purpose: 'Guest Lecture',
          status: 'pending',
          createdAt: '2024-03-16',
        },
        {
          id: '4',
          resourceType: 'equipment',
          resourceName: 'Projector',
          location: 'AV Room',
          date: '2024-03-22',
          startTime: 'Full Day',
          endTime: 'Full Day',
          purpose: 'Class Presentation',
          status: 'confirmed',
          createdAt: '2024-03-17',
        },
        {
          id: '5',
          resourceType: 'room',
          resourceName: 'Meeting Room 101',
          location: 'CS Department',
          date: '2024-03-19',
          startTime: '09:00',
          endTime: '10:00',
          purpose: 'Research Discussion',
          status: 'cancelled',
          createdAt: '2024-03-12',
        },
      ];
      setBookings(mockBookings);
      setFilteredBookings(mockBookings);
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    if (filter === 'all') {
      setFilteredBookings(bookings);
    } else {
      setFilteredBookings(bookings.filter(b => b.status === filter));
    }
  }, [filter, bookings]);

  const handleCancelBooking = () => {
    if (!selectedBooking) return;

    // Simulate API call
    setTimeout(() => {
      showNotification('Booking cancelled successfully', 'success');
      setShowCancelModal(false);
      setSelectedBooking(null);
    }, 1000);
  };

  const getResourceIcon = (type: string) => {
    switch(type) {
      case 'room': return faChalkboard;
      case 'equipment': return faLaptop;
      case 'vehicle': return faVideo;
      default: return faCalendarAlt;
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'confirmed': return faCheckCircle;
      case 'pending': return faHourglassHalf;
      case 'cancelled': return faTimesCircle;
      case 'completed': return faCheckCircle;
      default: return faClock;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'confirmed': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'cancelled': return '#ef4444';
      case 'completed': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const filters = ['all', 'confirmed', 'pending', 'completed', 'cancelled'];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading your bookings...</p>
      </div>
    );
  }

  return (
    <div className="my-bookings-page">
      <div className="page-header">
        <div className="header-left">
          <h1>My Bookings</h1>
          <p>View and manage your resource bookings</p>
        </div>
        <div className="header-actions">
          <Link to="/user/resources/book">
            <Button variant="primary">
              <FontAwesomeIcon icon={faPlus} /> New Booking
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <Card className="filters-card">
        <div className="filter-tabs">
          {filters.map(f => (
            <button
              key={f}
              className={`filter-tab ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </Card>

      {/* Bookings List */}
      <div className="bookings-list">
        {filteredBookings.length > 0 ? (
          filteredBookings.map(booking => (
            <Card key={booking.id} className="booking-card">
              <div className="booking-header">
                <div className="resource-info">
                  <div className="resource-icon">
                    <FontAwesomeIcon icon={getResourceIcon(booking.resourceType)} />
                  </div>
                  <div>
                    <h3>{booking.resourceName}</h3>
                    <p className="location">
                      <FontAwesomeIcon icon={faMapMarkerAlt} /> {booking.location}
                    </p>
                  </div>
                </div>
                <span
                  className="status-badge"
                  style={{
                    backgroundColor: `${getStatusColor(booking.status)}20`,
                    color: getStatusColor(booking.status),
                  }}
                >
                  <FontAwesomeIcon icon={getStatusIcon(booking.status)} />
                  {booking.status}
                </span>
              </div>

              <div className="booking-details">
                <div className="detail-item">
                  <FontAwesomeIcon icon={faCalendarAlt} />
                  <span>{formatDate(booking.date)}</span>
                </div>
                <div className="detail-item">
                  <FontAwesomeIcon icon={faClock} />
                  <span>{booking.startTime} {booking.endTime !== 'Full Day' && `- ${booking.endTime}`}</span>
                </div>
              </div>

              <div className="booking-purpose">
                <p><strong>Purpose:</strong> {booking.purpose}</p>
              </div>

              <div className="booking-footer">
                <span className="booking-date">
                  Booked on: {formatDate(booking.createdAt)}
                </span>
                <div className="action-buttons">
                  <button
                    className="action-btn view"
                    onClick={() => {
                      setSelectedBooking(booking);
                      setShowDetailsModal(true);
                    }}
                  >
                    <FontAwesomeIcon icon={faEye} /> Details
                  </button>
                  {booking.status === 'confirmed' && (
                    <button
                      className="action-btn cancel"
                      onClick={() => {
                        setSelectedBooking(booking);
                        setShowCancelModal(true);
                      }}
                    >
                      <FontAwesomeIcon icon={faTimes} /> Cancel
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="no-results">
            <FontAwesomeIcon icon={faCalendarAlt} />
            <h3>No bookings found</h3>
            <p>You don't have any bookings matching your criteria</p>
            <Link to="/user/resources/book">
              <Button variant="primary">Book a Resource</Button>
            </Link>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedBooking && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedBooking(null);
          }}
          title="Booking Details"
          size="medium"
        >
          <div className="booking-details-modal">
            <div className="detail-row">
              <span className="label">Resource:</span>
              <span className="value">{selectedBooking.resourceName}</span>
            </div>
            <div className="detail-row">
              <span className="label">Type:</span>
              <span className="value">{selectedBooking.resourceType}</span>
            </div>
            <div className="detail-row">
              <span className="label">Location:</span>
              <span className="value">{selectedBooking.location}</span>
            </div>
            <div className="detail-row">
              <span className="label">Date:</span>
              <span className="value">{formatDate(selectedBooking.date)}</span>
            </div>
            <div className="detail-row">
              <span className="label">Time:</span>
              <span className="value">
                {selectedBooking.startTime} {selectedBooking.endTime !== 'Full Day' && `- ${selectedBooking.endTime}`}
              </span>
            </div>
            <div className="detail-row">
              <span className="label">Purpose:</span>
              <span className="value">{selectedBooking.purpose}</span>
            </div>
            <div className="detail-row">
              <span className="label">Status:</span>
              <span
                className="status-badge"
                style={{
                  backgroundColor: `${getStatusColor(selectedBooking.status)}20`,
                  color: getStatusColor(selectedBooking.status),
                }}
              >
                <FontAwesomeIcon icon={getStatusIcon(selectedBooking.status)} />
                {selectedBooking.status}
              </span>
            </div>
            <div className="detail-row">
              <span className="label">Booked On:</span>
              <span className="value">{formatDate(selectedBooking.createdAt)}</span>
            </div>
          </div>

          <div className="modal-footer">
            <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
              Close
            </Button>
            {selectedBooking.status === 'confirmed' && (
              <Button
                variant="danger"
                onClick={() => {
                  setShowDetailsModal(false);
                  setShowCancelModal(true);
                }}
              >
                Cancel Booking
              </Button>
            )}
          </div>
        </Modal>
      )}

      {/* Cancel Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => {
          setShowCancelModal(false);
          setSelectedBooking(null);
        }}
        title="Cancel Booking"
        size="small"
      >
        <div className="cancel-confirmation">
          <p>Are you sure you want to cancel this booking?</p>
          <p className="warning-text">This action cannot be undone.</p>
          <div className="modal-footer">
            <Button variant="secondary" onClick={() => setShowCancelModal(false)}>
              No, Keep It
            </Button>
            <Button variant="danger" onClick={handleCancelBooking}>
              Yes, Cancel Booking
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MyBookings;