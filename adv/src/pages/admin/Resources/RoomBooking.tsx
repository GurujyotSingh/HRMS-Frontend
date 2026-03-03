import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  
  faPlus,
  
  faCheck,
  faTimes,
  
  faMapMarkerAlt,
  faUsers,
  faLaptop,
  faVideo,
  faChalkboard,
  
} from '@fortawesome/free-solid-svg-icons';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Table from '../../../components/ui/Table';
import Modal from '../../../components/ui/Modal';
import Calendar from '../../../components/ui/Calendar';
import { useNotification } from '../../../hooks/useNotification';
import { usePermissions } from '../../../hooks/usePermissions';
import { Room, ResourceBooking } from '../../../types/resource';
import { formatDate, formatTime } from '../../../utils/formatters';

const RoomBooking: React.FC = () => {
  const { showNotification } = useNotification();
  const { hasPermission } = usePermissions();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<ResourceBooking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<ResourceBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<string>('All');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<ResourceBooking | null>(null);
  const [formData, setFormData] = useState({
    room_id: '',
    purpose: '',
    start_datetime: '',
    end_datetime: '',
    attendees: 0,
    requirements: [] as string[],
  });

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockRooms: Room[] = [
        {
          room_id: 1,
          name: 'Conference Room A',
          capacity: 20,
          location: 'Main Building, 2nd Floor',
          facilities: ['Projector', 'Whiteboard', 'Video Conferencing'],
          is_available: true,
        },
        {
          room_id: 2,
          name: 'Seminar Hall',
          capacity: 100,
          location: 'Academic Block, Ground Floor',
          facilities: ['Projector', 'Sound System', 'Stage', 'AC'],
          is_available: true,
        },
        {
          room_id: 3,
          name: 'Meeting Room 101',
          capacity: 8,
          location: 'CS Department, 3rd Floor',
          facilities: ['TV Screen', 'Whiteboard'],
          is_available: true,
        },
        {
          room_id: 4,
          name: 'Lecture Hall 201',
          capacity: 60,
          location: 'Science Block, 2nd Floor',
          facilities: ['Projector', 'Computer', 'Document Camera'],
          is_available: true,
        },
        {
          room_id: 5,
          name: 'Conference Room B',
          capacity: 15,
          location: 'Admin Building, 1st Floor',
          facilities: ['Projector', 'Whiteboard', 'Video Conferencing'],
          is_available: false,
        },
      ];

      const mockBookings: ResourceBooking[] = [
        {
          booking_id: 1,
          resource_type: 'Room',
          resource_id: 1,
          booked_by: 1,
          employee: { emp_id: 1, name: 'John Doe' },
          start_datetime: '2024-03-15T10:00:00',
          end_datetime: '2024-03-15T12:00:00',
          purpose: 'Department Meeting',
          status: 'Approved',
        },
        {
          booking_id: 2,
          resource_type: 'Room',
          resource_id: 2,
          booked_by: 2,
          employee: { emp_id: 2, name: 'Jane Smith' },
          start_datetime: '2024-03-16T14:00:00',
          end_datetime: '2024-03-16T17:00:00',
          purpose: 'Guest Lecture',
          status: 'Pending',
        },
        {
          booking_id: 3,
          resource_type: 'Room',
          resource_id: 1,
          booked_by: 3,
          employee: { emp_id: 3, name: 'Rahul Kumar' },
          start_datetime: '2024-03-17T09:00:00',
          end_datetime: '2024-03-17T11:00:00',
          purpose: 'Research Discussion',
          status: 'Approved',
        },
      ];

      setRooms(mockRooms);
      setBookings(mockBookings);
      setFilteredBookings(mockBookings);
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    let filtered = bookings;

    if (searchTerm) {
      filtered = filtered.filter(b =>
        b.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.purpose?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedRoom !== 'All') {
      const roomId = parseInt(selectedRoom);
      filtered = filtered.filter(b => b.resource_id === roomId);
    }

    if (selectedDate) {
      filtered = filtered.filter(b => 
        b.start_datetime.startsWith(selectedDate)
      );
    }

    setFilteredBookings(filtered);
  }, [searchTerm, selectedRoom, selectedDate, bookings]);

  const handleBooking = () => {
    if (!formData.room_id || !formData.purpose || !formData.start_datetime || !formData.end_datetime) {
      showNotification('Please fill in all required fields', 'warning');
      return;
    }

    // Simulate API call
    setTimeout(() => {
      showNotification('Booking request submitted successfully', 'success');
      setShowBookingModal(false);
      setFormData({
        room_id: '',
        purpose: '',
        start_datetime: '',
        end_datetime: '',
        attendees: 0,
        requirements: [],
      });
    }, 1000);
  };

  const handleApprove = (bookingId: number) => {
    // Simulate API call
    setTimeout(() => {
      showNotification('Booking approved', 'success');
    }, 500);
  };

  const handleReject = (bookingId: number) => {
    // Simulate API call
    setTimeout(() => {
      showNotification('Booking rejected', 'info');
    }, 500);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      Pending: { bg: '#f59e0b20', color: '#f59e0b' },
      Approved: { bg: '#10b98120', color: '#10b981' },
      Rejected: { bg: '#ef444420', color: '#ef4444' },
      Cancelled: { bg: '#6b728020', color: '#6b7280' },
      Completed: { bg: '#3b82f620', color: '#3b82f6' },
    };
    const style = styles[status as keyof typeof styles] || styles.Pending;

    return (
      <span className="status-badge" style={{ backgroundColor: style.bg, color: style.color }}>
        {status}
      </span>
    );
  };

  const getRoomIcon = (facilities: string[]) => {
    if (facilities.includes('Video Conferencing')) return faVideo;
    if (facilities.includes('Computer')) return faLaptop;
    if (facilities.includes('Projector')) return faChalkboard;
    return faMapMarkerAlt;
  };

  const columns = [
    {
      key: 'room',
      title: 'Room',
      render: (row: ResourceBooking) => {
        const room = rooms.find(r => r.room_id === row.resource_id);
        return (
          <div>
            <div className="room-name">{room?.name}</div>
            <small>{room?.location}</small>
          </div>
        );
      },
    },
    {
      key: 'bookedBy',
      title: 'Booked By',
      render: (row: ResourceBooking) => row.employee?.name,
    },
    {
      key: 'purpose',
      title: 'Purpose',
      render: (row: ResourceBooking) => row.purpose,
    },
    {
      key: 'datetime',
      title: 'Date & Time',
      render: (row: ResourceBooking) => (
        <div>
          <div>{formatDate(row.start_datetime)}</div>
          <small>{formatTime(row.start_datetime)} - {formatTime(row.end_datetime)}</small>
        </div>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      render: (row: ResourceBooking) => getStatusBadge(row.status),
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (row: ResourceBooking) => (
        <div className="action-buttons">
          {row.status === 'Pending' && hasPermission('ApproveResource') && (
            <>
              <button
                className="action-btn approve"
                onClick={() => handleApprove(row.booking_id)}
                title="Approve"
              >
                <FontAwesomeIcon icon={faCheck} />
              </button>
              <button
                className="action-btn reject"
                onClick={() => handleReject(row.booking_id)}
                title="Reject"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </>
          )}
          <button
            className="action-btn view"
            onClick={() => {
              setSelectedBooking(row);
              // Show details
            }}
            title="View Details"
          >
            <FontAwesomeIcon icon={faSearch} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="room-booking-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Room Booking</h1>
          <p>Manage room reservations and availability</p>
        </div>
        <div className="header-actions">
          <div className="view-toggle">
            <button
              className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              List View
            </button>
            <button
              className={`toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`}
              onClick={() => setViewMode('calendar')}
            >
              Calendar View
            </button>
          </div>
          <Button variant="primary" onClick={() => setShowBookingModal(true)}>
            <FontAwesomeIcon icon={faPlus} /> New Booking
          </Button>
        </div>
      </div>

      {/* Room Cards */}
      <div className="room-cards">
        {rooms.map(room => (
          <Card key={room.room_id} className={`room-card ${!room.is_available ? 'unavailable' : ''}`}>
            <div className="room-header">
              <div className="room-icon">
                <FontAwesomeIcon icon={getRoomIcon(room.facilities)} />
              </div>
              <h3>{room.name}</h3>
              {!room.is_available && <span className="unavailable-badge">Maintenance</span>}
            </div>
            <div className="room-details">
              <p>
                <FontAwesomeIcon icon={faMapMarkerAlt} />
                {room.location}
              </p>
              <p>
                <FontAwesomeIcon icon={faUsers} />
                Capacity: {room.capacity} people
              </p>
              <div className="facilities">
                {room.facilities.map((facility, index) => (
                  <span key={index} className="facility-tag">{facility}</span>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="filters-card">
        <div className="filters-grid">
          <div className="search-box">
            <FontAwesomeIcon icon={faSearch} className="search-icon" />
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <select
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)}
            className="filter-select"
          >
            <option value="All">All Rooms</option>
            {rooms.map(room => (
              <option key={room.room_id} value={room.room_id}>{room.name}</option>
            ))}
          </select>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="filter-date"
          />

          <Button variant="outline" onClick={() => {
            setSearchTerm('');
            setSelectedRoom('All');
            setSelectedDate(new Date().toISOString().split('T')[0]);
          }}>
            <FontAwesomeIcon icon={faTimes} /> Clear
          </Button>
        </div>
      </Card>

      {/* Content */}
      {viewMode === 'list' ? (
        <Card className="table-card">
          <Table
            columns={columns}
            data={filteredBookings}
            loading={loading}
          />
        </Card>
      ) : (
        <Card className="calendar-card">
          <Calendar
            events={bookings.map(b => ({
              id: b.booking_id,
              title: b.purpose,
              start: new Date(b.start_datetime),
              end: new Date(b.end_datetime),
              resource: rooms.find(r => r.room_id === b.resource_id)?.name,
              status: b.status,
            }))}
          />
        </Card>
      )}

      {/* Booking Modal */}
      <Modal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        title="New Room Booking"
        size="large"
      >
        <div className="booking-form">
          <div className="form-group">
            <label>Select Room *</label>
            <select
              className="form-control"
              value={formData.room_id}
              onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
            >
              <option value="">Choose a room</option>
              {rooms.filter(r => r.is_available).map(room => (
                <option key={room.room_id} value={room.room_id}>
                  {room.name} (Capacity: {room.capacity})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Purpose *</label>
            <input
              type="text"
              className="form-control"
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              placeholder="e.g., Department Meeting, Guest Lecture"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Start Date & Time *</label>
              <input
                type="datetime-local"
                className="form-control"
                value={formData.start_datetime}
                onChange={(e) => setFormData({ ...formData, start_datetime: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>End Date & Time *</label>
              <input
                type="datetime-local"
                className="form-control"
                value={formData.end_datetime}
                onChange={(e) => setFormData({ ...formData, end_datetime: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Expected Attendees</label>
            <input
              type="number"
              className="form-control"
              value={formData.attendees}
              onChange={(e) => setFormData({ ...formData, attendees: parseInt(e.target.value) })}
              min="1"
            />
          </div>

          <div className="form-group">
            <label>Additional Requirements</label>
            <textarea
              className="form-control"
              rows={3}
              value={formData.requirements}
              onChange={(e) => setFormData({ ...formData, requirements: e.target.value as any })}
              placeholder="Any specific requirements..."
            />
          </div>

          <div className="modal-footer">
            <Button variant="secondary" onClick={() => setShowBookingModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleBooking}>
              Submit Request
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RoomBooking;