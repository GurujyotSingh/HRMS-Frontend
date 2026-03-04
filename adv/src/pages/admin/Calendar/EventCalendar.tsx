import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faEdit,
  faTrash,

  faCalendarAlt,
  faClock,
  faMapMarkerAlt,
  faUsers,
  faVideo,

} from '@fortawesome/free-solid-svg-icons';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import Calendar from '../../../components/ui/Calendar';
import { useNotification } from '../../../hooks/useNotification';
import { usePermissions } from '../../../hooks/usePermissions';
import type { CalendarEvent } from '../../../types/calendar';
import { formatDate, formatTime } from '../../../utils/formatters';

const EventCalendar: React.FC = () => {
  const { showNotification } = useNotification();
  const { hasPermission } = usePermissions();

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [showEventModal, setShowEventModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [filter, setFilter] = useState('all');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_type: 'Meeting' as 'Meeting' | 'Training' | 'Workshop' | 'Deadline' | 'Holiday',
    start_datetime: '',
    end_datetime: '',
    location: '',
    is_all_day: false,
    attendees: [] as number[],
  });

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockEvents: CalendarEvent[] = [
        {
          event_id: 1,
          title: 'Faculty Meeting',
          description: 'Monthly faculty meeting to discuss academic progress',
          event_type: 'Meeting',
          start_datetime: '2024-03-15T10:00:00',
          end_datetime: '2024-03-15T12:00:00',
          location: 'Conference Room A',
          is_all_day: false,
          created_by: 1,
          attendees: [2, 3, 4, 5],
        },
        {
          event_id: 2,
          title: 'Research Workshop',
          description: 'Workshop on research methodology',
          event_type: 'Workshop',
          start_datetime: '2024-03-18T14:00:00',
          end_datetime: '2024-03-18T17:00:00',
          location: 'Seminar Hall',
          is_all_day: false,
          created_by: 2,
          attendees: [1, 3, 4, 6, 7],
        },
        {
          event_id: 3,
          title: 'Holi Holiday',
          description: 'University closed for Holi',
          event_type: 'Holiday',
          start_datetime: '2024-03-25T00:00:00',
          end_datetime: '2024-03-25T23:59:59',
          is_all_day: true,
          created_by: 5,
          attendees: [],
        },
        {
          event_id: 4,
          title: 'Payroll Deadline',
          description: 'Last date for payroll submission',
          event_type: 'Deadline',
          start_datetime: '2024-03-28T00:00:00',
          end_datetime: '2024-03-28T23:59:59',
          is_all_day: true,
          created_by: 5,
          attendees: [],
        },
        {
          event_id: 5,
          title: 'New Faculty Orientation',
          description: 'Orientation program for new faculty members',
          event_type: 'Training',
          start_datetime: '2024-04-01T09:00:00',
          end_datetime: '2024-04-01T16:00:00',
          location: 'Training Room',
          is_all_day: false,
          created_by: 4,
          attendees: [6, 7, 8, 9],
        },
      ];
      setEvents(mockEvents);
      setFilteredEvents(mockEvents);
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    if (filter === 'all') {
      setFilteredEvents(events);
    } else {
      setFilteredEvents(events.filter(e => e.event_type === filter));
    }
  }, [filter, events]);

  const handleAddEvent = () => {
    if (!formData.title || !formData.start_datetime || !formData.end_datetime) {
      showNotification('Please fill in all required fields', 'warning');
      return;
    }

    // Simulate API call
    setTimeout(() => {
      showNotification('Event added successfully', 'success');
      setShowEventModal(false);
      setFormData({
        title: '',
        description: '',
        event_type: 'Meeting',
        start_datetime: '',
        end_datetime: '',
        location: '',
        is_all_day: false,
        attendees: [],
      });
    }, 1000);
  };

  const handleEditEvent = () => {
    if (!selectedEvent) return;
    // Simulate API call
    setTimeout(() => {
      showNotification('Event updated successfully', 'success');
      setShowEventModal(false);
      setSelectedEvent(null);
    }, 1000);
  };

  const handleDeleteEvent = () => {
    if (!selectedEvent) return;
    // Simulate API call
    setTimeout(() => {
      showNotification('Event deleted successfully', 'success');
      setShowDetailsModal(false);
      setSelectedEvent(null);
    }, 1000);
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'Meeting': return faUsers;
      case 'Training': return faVideo;
      case 'Workshop': return faUsers;
      case 'Deadline': return faClock;
      case 'Holiday': return faCalendarAlt;
      default: return faCalendarAlt;
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'Meeting': return '#4361ee';
      case 'Training': return '#f72585';
      case 'Workshop': return '#4cc9f0';
      case 'Deadline': return '#f8961e';
      case 'Holiday': return '#10b981';
      default: return '#6b7280';
    }
  };

  const eventTypes = [
    { value: 'all', label: 'All Events' },
    { value: 'Meeting', label: 'Meetings' },
    { value: 'Training', label: 'Training' },
    { value: 'Workshop', label: 'Workshops' },
    { value: 'Deadline', label: 'Deadlines' },
    { value: 'Holiday', label: 'Holidays' },
  ];

  return (
    <div className="event-calendar-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Calendar</h1>
          <p>Manage events, meetings, and holidays</p>
        </div>
        <div className="header-actions">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            {eventTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
          {hasPermission('ManageCalendar') && (
            <Button variant="primary" onClick={() => setShowEventModal(true)}>
              <FontAwesomeIcon icon={faPlus} /> Add Event
            </Button>
          )}
        </div>
      </div>

      {/* Calendar View */}
      <Card className="calendar-card">
        <div className="calendar-toolbar">
          <div className="view-toggle">
            <button
              className={`toggle-btn ${viewMode === 'month' ? 'active' : ''}`}
              onClick={() => setViewMode('month')}
            >
              Month
            </button>
            <button
              className={`toggle-btn ${viewMode === 'week' ? 'active' : ''}`}
              onClick={() => setViewMode('week')}
            >
              Week
            </button>
            <button
              className={`toggle-btn ${viewMode === 'day' ? 'active' : ''}`}
              onClick={() => setViewMode('day')}
            >
              Day
            </button>
          </div>
        </div>

        <Calendar
          events={filteredEvents.map(e => ({
            id: e.event_id,
            title: e.title,
            start: new Date(e.start_datetime),
            end: new Date(e.end_datetime),
            type: e.event_type,
            color: getEventTypeColor(e.event_type),
            allDay: e.is_all_day,
          }))}
          view={viewMode}
          onEventClick={(event) => {
            const fullEvent = events.find(e => e.event_id === event.id);
            if (fullEvent) {
              setSelectedEvent(fullEvent);
              setShowDetailsModal(true);
            }
          }}
          onDateChange={setSelectedDate}
        />
      </Card>

      {/* Upcoming Events List */}
      <Card className="upcoming-events-card" title="Upcoming Events">
        <div className="events-list">
          {filteredEvents
            .filter(e => new Date(e.start_datetime) > new Date())
            .sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime())
            .slice(0, 5)
            .map(event => (
              <div
                key={event.event_id}
                className="event-item"
                onClick={() => {
                  setSelectedEvent(event);
                  setShowDetailsModal(true);
                }}
              >
                <div
                  className="event-color"
                  style={{ backgroundColor: getEventTypeColor(event.event_type) }}
                ></div>
                <div className="event-info">
                  <h4>{event.title}</h4>
                  <p>
                    <FontAwesomeIcon icon={faClock} />
                    {event.is_all_day ? 'All day' : `${formatDate(event.start_datetime)} ${formatTime(event.start_datetime)}`}
                  </p>
                  {event.location && (
                    <p>
                      <FontAwesomeIcon icon={faMapMarkerAlt} />
                      {event.location}
                    </p>
                  )}
                </div>
                <span className="event-type" style={{ color: getEventTypeColor(event.event_type) }}>
                  {event.event_type}
                </span>
              </div>
            ))}
        </div>
      </Card>

      {/* Add/Edit Event Modal */}
      <Modal
        isOpen={showEventModal}
        onClose={() => {
          setShowEventModal(false);
          setSelectedEvent(null);
        }}
        title={selectedEvent ? 'Edit Event' : 'Add New Event'}
        size="medium"
      >
        <div className="event-form">
          <div className="form-group">
            <label>Event Title *</label>
            <input
              type="text"
              className="form-control"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter event title"
            />
          </div>

          <div className="form-group">
            <label>Event Type</label>
            <select
              className="form-control"
              value={formData.event_type}
              onChange={(e) => setFormData({ ...formData, event_type: e.target.value as any })}
            >
              <option value="Meeting">Meeting</option>
              <option value="Training">Training</option>
              <option value="Workshop">Workshop</option>
              <option value="Deadline">Deadline</option>
              <option value="Holiday">Holiday</option>
            </select>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.is_all_day}
                onChange={(e) => setFormData({ ...formData, is_all_day: e.target.checked })}
              />
              <span>All Day Event</span>
            </label>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Start Date & Time *</label>
              <input
                type={formData.is_all_day ? 'date' : 'datetime-local'}
                className="form-control"
                value={formData.start_datetime}
                onChange={(e) => setFormData({ ...formData, start_datetime: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>End Date & Time *</label>
              <input
                type={formData.is_all_day ? 'date' : 'datetime-local'}
                className="form-control"
                value={formData.end_datetime}
                onChange={(e) => setFormData({ ...formData, end_datetime: e.target.value })}
                min={formData.start_datetime}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Location</label>
            <input
              type="text"
              className="form-control"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Enter location"
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              className="form-control"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter event description"
            />
          </div>

          <div className="form-group">
            <label>Attendees</label>
            <select
              className="form-control"
              multiple
              value={formData.attendees.map(String)}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => parseInt(option.value));
                setFormData({ ...formData, attendees: selected });
              }}
            >
              <option value="1">John Doe</option>
              <option value="2">Jane Smith</option>
              <option value="3">Rahul Kumar</option>
              <option value="4">Priya Sharma</option>
              <option value="5">Amit Patel</option>
            </select>
            <small>Hold Ctrl to select multiple</small>
          </div>

          <div className="modal-footer">
            <Button variant="secondary" onClick={() => setShowEventModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={selectedEvent ? handleEditEvent : handleAddEvent}>
              {selectedEvent ? 'Update Event' : 'Add Event'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Event Details Modal */}
      {selectedEvent && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedEvent(null);
          }}
          title="Event Details"
          size="medium"
        >
          <div className="event-details">
            <div className="event-header" style={{ borderLeftColor: getEventTypeColor(selectedEvent.event_type) }}>
              <h3>{selectedEvent.title}</h3>
              <span className="event-type-badge" style={{ backgroundColor: `${getEventTypeColor(selectedEvent.event_type)}20`, color: getEventTypeColor(selectedEvent.event_type) }}>
                <FontAwesomeIcon icon={getEventTypeIcon(selectedEvent.event_type)} />
                {selectedEvent.event_type}
              </span>
            </div>

            <div className="event-info">
              <div className="info-row">
                <FontAwesomeIcon icon={faClock} />
                <div>
                  <div>
                    {selectedEvent.is_all_day ? (
                      'All day'
                    ) : (
                      <>
                        {formatDate(selectedEvent.start_datetime)} {formatTime(selectedEvent.start_datetime)} - {formatTime(selectedEvent.end_datetime)}
                      </>
                    )}
                  </div>
                  {!selectedEvent.is_all_day && (
                    <small>{formatDate(selectedEvent.start_datetime)}</small>
                  )}
                </div>
              </div>

              {selectedEvent.location && (
                <div className="info-row">
                  <FontAwesomeIcon icon={faMapMarkerAlt} />
                  <div>{selectedEvent.location}</div>
                </div>
              )}

              {selectedEvent.description && (
                <div className="description">
                  <h4>Description</h4>
                  <p>{selectedEvent.description}</p>
                </div>
              )}

              {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
                <div className="attendees">
                  <h4>Attendees ({selectedEvent.attendees.length})</h4>
                  <div className="attendee-list">
                    {selectedEvent.attendees.map(id => (
                      <span key={id} className="attendee-tag">
                        {id === 1 ? 'John Doe' :
                         id === 2 ? 'Jane Smith' :
                         id === 3 ? 'Rahul Kumar' :
                         id === 4 ? 'Priya Sharma' : 'Amit Patel'}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
              Close
            </Button>
            {hasPermission('ManageCalendar') && (
              <>
                <Button
                  variant="primary"
                  onClick={() => {
                    setShowDetailsModal(false);
                    setFormData({
                      title: selectedEvent.title,
                      description: selectedEvent.description || '',
                      event_type: selectedEvent.event_type,
                      start_datetime: selectedEvent.start_datetime,
                      end_datetime: selectedEvent.end_datetime,
                      location: selectedEvent.location || '',
                      is_all_day: selectedEvent.is_all_day,
                      attendees: selectedEvent.attendees || [],
                    });
                    setSelectedEvent(selectedEvent);
                    setShowEventModal(true);
                  }}
                >
                  <FontAwesomeIcon icon={faEdit} /> Edit
                </Button>
                <Button variant="danger" onClick={handleDeleteEvent}>
                  <FontAwesomeIcon icon={faTrash} /> Delete
                </Button>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default EventCalendar;