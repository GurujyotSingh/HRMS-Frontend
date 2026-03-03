import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendarAlt,
  faClock,
  faMapMarkerAlt,

  faUsers,
  faGraduationCap,
  faLaptop,

  faChevronLeft,
  faChevronRight,

} from '@fortawesome/free-solid-svg-icons';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import { useNotification } from '../../../hooks/useNotification';
import { formatDate, formatTime } from '../../../utils/formatters';

interface CalendarEvent {
  id: string;
  title: string;
  type: 'meeting' | 'class' | 'deadline' | 'holiday' | 'training' | 'personal';
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  description?: string;
  attendees?: string[];
  isAllDay: boolean;
  color?: string;
}

const MyCalendar: React.FC = () => {
  const { showNotification } = useNotification();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showDayModal, setShowDayModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState<'month' | 'week'>('month');

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockEvents: CalendarEvent[] = [
        {
          id: '1',
          title: 'Department Meeting',
          type: 'meeting',
          startDate: '2024-03-15',
          endDate: '2024-03-15',
          startTime: '10:00',
          endTime: '11:30',
          location: 'Conference Room A',
          description: 'Monthly department meeting to discuss research progress',
          attendees: ['Dr. Jane Smith', 'Dr. John Doe', 'Dr. Rahul Kumar'],
          isAllDay: false,
          color: '#4361ee',
        },
        {
          id: '2',
          title: 'Advanced Machine Learning Lecture',
          type: 'class',
          startDate: '2024-03-16',
          endDate: '2024-03-16',
          startTime: '14:00',
          endTime: '16:00',
          location: 'Lecture Hall 201',
          description: 'Weekly lecture on Neural Networks',
          attendees: ['PhD Students'],
          isAllDay: false,
          color: '#f72585',
        },
        {
          id: '3',
          title: 'Research Paper Submission Deadline',
          type: 'deadline',
          startDate: '2024-03-20',
          endDate: '2024-03-20',
          isAllDay: true,
          description: 'Deadline for conference paper submission',
          color: '#f8961e',
        },
        {
          id: '4',
          title: 'Holi',
          type: 'holiday',
          startDate: '2024-03-25',
          endDate: '2024-03-25',
          isAllDay: true,
          color: '#10b981',
        },
        {
          id: '5',
          title: 'Research Workshop',
          type: 'training',
          startDate: '2024-03-18',
          endDate: '2024-03-19',
          startTime: '09:00',
          endTime: '17:00',
          location: 'Training Room',
          description: 'Two-day workshop on research methodology',
          attendees: ['Faculty Members'],
          isAllDay: false,
          color: '#4cc9f0',
        },
        {
          id: '6',
          title: 'Student Advising',
          type: 'personal',
          startDate: '2024-03-15',
          endDate: '2024-03-15',
          startTime: '15:00',
          endTime: '16:00',
          location: 'Office 205',
          isAllDay: false,
          color: '#7209b7',
        },
        {
          id: '7',
          title: 'Grant Proposal Review',
          type: 'meeting',
          startDate: '2024-03-22',
          endDate: '2024-03-22',
          startTime: '11:00',
          endTime: '12:30',
          location: 'Conference Room B',
          isAllDay: false,
          color: '#4361ee',
        },
      ];
      setEvents(mockEvents);
      filterEvents(mockEvents, filter);
      setLoading(false);
    }, 1000);
  }, []);

  const filterEvents = (events: CalendarEvent[], filterType: string) => {
    if (filterType === 'all') {
      setFilteredEvents(events);
    } else {
      setFilteredEvents(events.filter(e => e.type === filterType));
    }
  };

  useEffect(() => {
    filterEvents(events, filter);
  }, [filter, events]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.

    return { daysInMonth, startingDay };
  };

  const getMonthData = () => {
    const { daysInMonth, startingDay } = getDaysInMonth(currentDate);
    const days = [];
    
    // Add empty cells for days before the first day of month
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }

    // Add actual days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const getEventsForDay = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return filteredEvents.filter(event => {
      if (event.startDate === dateStr) return true;
      if (event.endDate && event.endDate >= dateStr && event.startDate <= dateStr) return true;
      return false;
    });
  };

  const getEventIcon = (type: string) => {
    switch(type) {
      case 'meeting': return faUsers;
      case 'class': return faGraduationCap;
      case 'deadline': return faClock;
      case 'holiday': return faCalendarAlt;
      case 'training': return faLaptop;
      case 'personal': faUser;
      default: return faCalendarAlt;
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDayClick = (day: number) => {
    if (day) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      setSelectedDate(date);
      setShowDayModal(true);
    }
  };

  const filterTypes = [
    { value: 'all', label: 'All Events' },
    { value: 'meeting', label: 'Meetings' },
    { value: 'class', label: 'Classes' },
    { value: 'deadline', label: 'Deadlines' },
    { value: 'holiday', label: 'Holidays' },
    { value: 'training', label: 'Training' },
    { value: 'personal', label: 'Personal' },
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthDays = getMonthData();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading calendar...</p>
      </div>
    );
  }

  return (
    <div className="my-calendar-page">
      <div className="page-header">
        <h1>My Calendar</h1>
        <p>Manage your schedule and events</p>
      </div>

      {/* Calendar Controls */}
      <Card className="calendar-controls">
        <div className="controls-left">
          <button className="nav-btn" onClick={handlePrevMonth}>
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          <h2>
            {currentDate.toLocaleString('default', { month: 'long' })} {currentDate.getFullYear()}
          </h2>
          <button className="nav-btn" onClick={handleNextMonth}>
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>

        <div className="controls-right">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            {filterTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>

          <div className="view-toggle">
            <button
              className={`toggle-btn ${view === 'month' ? 'active' : ''}`}
              onClick={() => setView('month')}
            >
              Month
            </button>
            <button
              className={`toggle-btn ${view === 'week' ? 'active' : ''}`}
              onClick={() => setView('week')}
            >
              Week
            </button>
          </div>
        </div>
      </Card>

      {/* Calendar Grid */}
      <Card className="calendar-grid">
        <div className="weekdays">
          {weekDays.map(day => (
            <div key={day} className="weekday">{day}</div>
          ))}
        </div>

        <div className="days">
          {monthDays.map((day, index) => {
            const dayEvents = day ? getEventsForDay(day) : [];
            const isToday = day === new Date().getDate() && 
                           currentDate.getMonth() === new Date().getMonth() &&
                           currentDate.getFullYear() === new Date().getFullYear();

            return (
              <div
                key={index}
                className={`day-cell ${!day ? 'empty' : ''} ${isToday ? 'today' : ''}`}
                onClick={() => day && handleDayClick(day)}
              >
                {day && (
                  <>
                    <span className="day-number">{day}</span>
                    <div className="day-events">
                      {dayEvents.slice(0, 3).map(event => (
                        <div
                          key={event.id}
                          className="event-indicator"
                          style={{ backgroundColor: event.color }}
                          title={event.title}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(event);
                            setShowEventModal(true);
                          }}
                        >
                          <FontAwesomeIcon icon={getEventIcon(event.type)} />
                          <span className="event-title">{event.title}</span>
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="more-events">+{dayEvents.length - 3} more</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Upcoming Events */}
      <Card className="upcoming-events" title="Upcoming Events">
        <div className="events-list">
          {filteredEvents
            .filter(e => new Date(e.startDate) >= new Date())
            .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
            .slice(0, 5)
            .map(event => (
              <div
                key={event.id}
                className="event-item"
                onClick={() => {
                  setSelectedEvent(event);
                  setShowEventModal(true);
                }}
              >
                <div className="event-date">
                  <span className="day">{new Date(event.startDate).getDate()}</span>
                  <span className="month">
                    {new Date(event.startDate).toLocaleString('default', { month: 'short' })}
                  </span>
                </div>
                <div className="event-info">
                  <h4>{event.title}</h4>
                  <p>
                    <FontAwesomeIcon icon={faClock} />
                    {event.isAllDay ? 'All day' : `${event.startTime} - ${event.endTime}`}
                  </p>
                  {event.location && (
                    <p>
                      <FontAwesomeIcon icon={faMapMarkerAlt} />
                      {event.location}
                    </p>
                  )}
                </div>
                <span className="event-type" style={{ color: event.color }}>
                  {event.type}
                </span>
              </div>
            ))}
        </div>
      </Card>

      {/* Day Events Modal */}
      {selectedDate && (
        <Modal
          isOpen={showDayModal}
          onClose={() => {
            setShowDayModal(false);
            setSelectedDate(null);
          }}
          title={`Events for ${selectedDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}`}
          size="medium"
        >
          <div className="day-events-modal">
            {filteredEvents
              .filter(event => {
                const eventDate = new Date(event.startDate);
                return eventDate.toDateString() === selectedDate.toDateString();
              })
              .map(event => (
                <div
                  key={event.id}
                  className="event-card"
                  onClick={() => {
                    setSelectedEvent(event);
                    setShowEventModal(true);
                  }}
                >
                  <div className="event-time">
                    {event.isAllDay ? (
                      'All Day'
                    ) : (
                      <>
                        <span className="start">{event.startTime}</span>
                        <span className="separator">-</span>
                        <span className="end">{event.endTime}</span>
                      </>
                    )}
                  </div>
                  <div className="event-details">
                    <h4 style={{ color: event.color }}>{event.title}</h4>
                    {event.location && (
                      <p>
                        <FontAwesomeIcon icon={faMapMarkerAlt} /> {event.location}
                      </p>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </Modal>
      )}

      {/* Event Details Modal */}
      {selectedEvent && (
        <Modal
          isOpen={showEventModal}
          onClose={() => {
            setShowEventModal(false);
            setSelectedEvent(null);
          }}
          title="Event Details"
          size="medium"
        >
          <div className="event-details-modal">
            <div className="event-header" style={{ borderLeftColor: selectedEvent.color }}>
              <h3>{selectedEvent.title}</h3>
              <span className="event-type-badge" style={{ backgroundColor: `${selectedEvent.color}20`, color: selectedEvent.color }}>
                {selectedEvent.type}
              </span>
            </div>

            <div className="event-info">
              <div className="info-row">
                <FontAwesomeIcon icon={faCalendarAlt} />
                <div>
                  <strong>Date:</strong>
                  <span>{formatDate(selectedEvent.startDate)}</span>
                  {selectedEvent.endDate !== selectedEvent.startDate && (
                    <span> - {formatDate(selectedEvent.endDate)}</span>
                  )}
                </div>
              </div>

              {!selectedEvent.isAllDay && selectedEvent.startTime && (
                <div className="info-row">
                  <FontAwesomeIcon icon={faClock} />
                  <div>
                    <strong>Time:</strong>
                    <span>{selectedEvent.startTime} - {selectedEvent.endTime}</span>
                  </div>
                </div>
              )}

              {selectedEvent.isAllDay && (
                <div className="info-row">
                  <FontAwesomeIcon icon={faClock} />
                  <div>
                    <strong>All Day Event</strong>
                  </div>
                </div>
              )}

              {selectedEvent.location && (
                <div className="info-row">
                  <FontAwesomeIcon icon={faMapMarkerAlt} />
                  <div>
                    <strong>Location:</strong>
                    <span>{selectedEvent.location}</span>
                  </div>
                </div>
              )}

              {selectedEvent.description && (
                <div className="info-row description">
                  <strong>Description:</strong>
                  <p>{selectedEvent.description}</p>
                </div>
              )}

              {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
                <div className="info-row attendees">
                  <strong>Attendees:</strong>
                  <div className="attendee-list">
                    {selectedEvent.attendees.map((attendee, index) => (
                      <span key={index} className="attendee-tag">{attendee}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <Button variant="secondary" onClick={() => setShowEventModal(false)}>
              Close
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MyCalendar;