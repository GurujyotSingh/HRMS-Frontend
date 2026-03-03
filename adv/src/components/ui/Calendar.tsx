import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronLeft,
  faChevronRight,
  faCalendarAlt,
  faClock,
  faMapMarkerAlt,
  faVideo,
  faUsers,
  faGraduationCap,
  faLaptop,
  faUser,
} from '@fortawesome/free-solid-svg-icons';

interface CalendarEvent {
  id: string | number;
  title: string;
  start: Date;
  end: Date;
  type?: 'meeting' | 'class' | 'deadline' | 'holiday' | 'training' | 'personal' | string;
  color?: string;
  allDay?: boolean;
  location?: string;
  resource?: string;
  status?: string;
  description?: string;
}

interface CalendarProps {
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onDateChange?: (date: Date) => void;
  onEventDrop?: (event: CalendarEvent, newStart: Date, newEnd: Date) => void;
  view?: 'month' | 'week' | 'day';
  height?: number | string;
  selectable?: boolean;
  showWeekends?: boolean;
}

const Calendar: React.FC<CalendarProps> = ({
  events,
  onEventClick,
  onDateChange,
  onEventDrop,
  view = 'month',
  height = 600,
  selectable = true,
  showWeekends = true,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedView, setSelectedView] = useState<'month' | 'week' | 'day'>(view);
  const [dragOver, setDragOver] = useState<string | null>(null);

  // Helper functions
  const daysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const firstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const prevMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    setCurrentDate(newDate);
    onDateChange?.(newDate);
  };

  const nextMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    setCurrentDate(newDate);
    onDateChange?.(newDate);
  };

  const prevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
    onDateChange?.(newDate);
  };

  const nextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
    onDateChange?.(newDate);
  };

  const prevDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 1);
    setCurrentDate(newDate);
    onDateChange?.(newDate);
  };

  const nextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 1);
    setCurrentDate(newDate);
    onDateChange?.(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    onDateChange?.(new Date());
  };

  const getEventsForDay = (date: Date) => {
    return events.filter(event => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      
      // Check if event occurs on this day
      return (
        eventStart.toDateString() === date.toDateString() ||
        (eventStart < date && eventEnd >= date) ||
        (event.allDay && eventStart.toDateString() === date.toDateString())
      );
    });
  };

  const getEventsForWeek = () => {
    const weekEvents = [];
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      if (!showWeekends && (i === 0 || i === 6)) continue;
      
      weekEvents.push({
        date: day,
        events: getEventsForDay(day),
      });
    }
    return weekEvents;
  };

  const getEventColor = (event: CalendarEvent) => {
    if (event.color) return event.color;
    
    switch (event.type) {
      case 'meeting': return '#4361ee';
      case 'class': return '#f72585';
      case 'deadline': return '#f8961e';
      case 'holiday': return '#10b981';
      case 'training': return '#4cc9f0';
      case 'personal': return '#7209b7';
      default: return '#6b7280';
    }
  };

  const getEventIcon = (type?: string) => {
    switch (type) {
      case 'meeting': return faUsers;
      case 'class': return faGraduationCap;
      case 'deadline': return faClock;
      case 'holiday': return faCalendarAlt;
      case 'training': return faLaptop;
      case 'personal': return faUser;
      default: return faCalendarAlt;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleDragStart = (e: React.DragEvent, event: CalendarEvent) => {
    e.dataTransfer.setData('text/plain', JSON.stringify(event));
  };

  const handleDragOver = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    setDragOver(dateStr);
  };

  const handleDragLeave = () => {
    setDragOver(null);
  };

  const handleDrop = (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();
    setDragOver(null);
    
    const eventData = e.dataTransfer.getData('text/plain');
    if (!eventData || !onEventDrop) return;
    
    try {
      const event = JSON.parse(eventData) as CalendarEvent;
      const duration = event.end.getTime() - event.start.getTime();
      const newStart = new Date(targetDate);
      newStart.setHours(event.start.getHours(), event.start.getMinutes());
      const newEnd = new Date(newStart.getTime() + duration);
      
      onEventDrop(event, newStart, newEnd);
    } catch (error) {
      console.error('Error parsing dropped event:', error);
    }
  };

  // Render different views
  const renderMonthView = () => {
    const days = daysInMonth(currentDate);
    const firstDay = firstDayOfMonth(currentDate);
    const weeks = [];
    let dayCount = 1;

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="calendar-month-view">
        <div className="calendar-weekdays">
          {weekDays.map((day, index) => (
            <div key={index} className="calendar-weekday">
              {day}
            </div>
          ))}
        </div>
        <div className="calendar-days-grid">
          {Array.from({ length: 42 }).map((_, index) => {
            const weekIndex = Math.floor(index / 7);
            const dayIndex = index % 7;
            
            if (weekIndex === 0 && dayIndex < firstDay) {
              // Empty cells before first day
              return <div key={`empty-${index}`} className="calendar-day empty"></div>;
            }
            
            if (dayCount > days) {
              // Empty cells after last day
              return <div key={`empty-${index}`} className="calendar-day empty"></div>;
            }

            const currentDay = dayCount;
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDay);
            const dayEvents = getEventsForDay(date);
            const isToday = date.toDateString() === new Date().toDateString();
            const isWeekend = dayIndex === 0 || dayIndex === 6;

            if (!showWeekends && isWeekend) {
              dayCount++;
              return <div key={`weekend-${index}`} className="calendar-day empty weekend"></div>;
            }

            dayCount++;
            
            return (
              <div
                key={date.toISOString()}
                className={`calendar-day ${isToday ? 'today' : ''} ${isWeekend ? 'weekend' : ''} ${dragOver === date.toDateString() ? 'drag-over' : ''}`}
                onClick={() => onDateChange?.(date)}
                onDragOver={(e) => handleDragOver(e, date.toDateString())}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, date)}
              >
                <div className="day-header">
                  <span className="day-number">{currentDay}</span>
                  {dayEvents.length > 0 && (
                    <span className="event-count">{dayEvents.length}</span>
                  )}
                </div>
                <div className="day-events">
                  {dayEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className="calendar-event"
                      style={{ backgroundColor: `${getEventColor(event)}20`, borderLeftColor: getEventColor(event) }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick?.(event);
                      }}
                      draggable={!!onEventDrop}
                      onDragStart={(e) => handleDragStart(e, event)}
                    >
                      {!event.allDay && (
                        <span className="event-time">
                          {formatTime(event.start)}
                        </span>
                      )}
                      <span className="event-title">{event.title}</span>
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="more-events">+{dayEvents.length - 3} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekDays = getEventsForWeek();
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="calendar-week-view">
        <div className="week-header">
          <div className="time-column"></div>
          {weekDays.map(({ date }, index) => (
            <div key={index} className="day-column-header">
              <div className="day-name">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
              <div className="day-date">{date.getDate()}</div>
            </div>
          ))}
        </div>
        <div className="week-body">
          {hours.map((hour) => (
            <div key={hour} className="hour-row">
              <div className="hour-label">{hour.toString().padStart(2, '0')}:00</div>
              {weekDays.map(({ date, events }, dayIndex) => {
                const hourEvents = events.filter(event => {
                  const eventHour = event.start.getHours();
                  return eventHour === hour && !event.allDay;
                });

                return (
                  <div
                    key={dayIndex}
                    className="hour-cell"
                    onClick={() => {
                      const newDate = new Date(date);
                      newDate.setHours(hour, 0, 0, 0);
                      onDateChange?.(newDate);
                    }}
                  >
                    {hourEvents.map(event => (
                      <div
                        key={event.id}
                        className="calendar-event"
                        style={{ backgroundColor: `${getEventColor(event)}20`, borderLeftColor: getEventColor(event) }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick?.(event);
                        }}
                      >
                        <span className="event-title">{event.title}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const dayEvents = getEventsForDay(currentDate);
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="calendar-day-view">
        <div className="day-header">
          <h3>{currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
          <div className="all-day-events">
            {dayEvents.filter(e => e.allDay).map(event => (
              <div
                key={event.id}
                className="calendar-event all-day"
                style={{ backgroundColor: `${getEventColor(event)}20`, borderLeftColor: getEventColor(event) }}
                onClick={() => onEventClick?.(event)}
              >
                <FontAwesomeIcon icon={getEventIcon(event.type)} />
                <span className="event-title">{event.title}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="day-body">
          {hours.map((hour) => {
            const hourEvents = dayEvents.filter(event => {
              const eventHour = event.start.getHours();
              return eventHour === hour && !event.allDay;
            });

            return (
              <div key={hour} className="hour-row">
                <div className="hour-label">{hour.toString().padStart(2, '0')}:00</div>
                <div className="hour-content">
                  {hourEvents.map(event => (
                    <div
                      key={event.id}
                      className="calendar-event"
                      style={{ backgroundColor: `${getEventColor(event)}20`, borderLeftColor: getEventColor(event) }}
                      onClick={() => onEventClick?.(event)}
                    >
                      <div className="event-time">{formatTime(event.start)} - {formatTime(event.end)}</div>
                      <div className="event-title">{event.title}</div>
                      {event.location && (
                        <div className="event-location">
                          <FontAwesomeIcon icon={faMapMarkerAlt} />
                          {event.location}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="calendar-container" style={{ height }}>
      <div className="calendar-toolbar">
        <div className="toolbar-left">
          <button className="toolbar-btn" onClick={goToToday}>
            Today
          </button>
          <div className="navigation">
            <button className="nav-btn" onClick={selectedView === 'month' ? prevMonth : selectedView === 'week' ? prevWeek : prevDay}>
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
            <button className="nav-btn" onClick={selectedView === 'month' ? nextMonth : selectedView === 'week' ? nextWeek : nextDay}>
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
          </div>
          <h2 className="current-date">
            {selectedView === 'month' && currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            {selectedView === 'week' && `Week of ${currentDate.toLocaleDateString()}`}
            {selectedView === 'day' && currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </h2>
        </div>
        <div className="toolbar-right">
          <div className="view-toggle">
            <button
              className={`view-btn ${selectedView === 'month' ? 'active' : ''}`}
              onClick={() => setSelectedView('month')}
            >
              Month
            </button>
            <button
              className={`view-btn ${selectedView === 'week' ? 'active' : ''}`}
              onClick={() => setSelectedView('week')}
            >
              Week
            </button>
            <button
              className={`view-btn ${selectedView === 'day' ? 'active' : ''}`}
              onClick={() => setSelectedView('day')}
            >
              Day
            </button>
          </div>
        </div>
      </div>

      <div className="calendar-content">
        {selectedView === 'month' && renderMonthView()}
        {selectedView === 'week' && renderWeekView()}
        {selectedView === 'day' && renderDayView()}
      </div>
    </div>
  );
};

export default Calendar;