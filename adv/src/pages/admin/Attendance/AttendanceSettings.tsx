import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSave,
  faClock,
  faMapMarkerAlt,
  faGlobe,
  faBell,
  faCalendarAlt,
  faPlus,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { useNotification } from '../../../hooks/useNotification';
import { usePermissions } from '../../../hooks/usePermissions';

interface Holiday {
  id: number;
  name: string;
  date: string;
  type: 'National' | 'Religious' | 'University';
}

const AttendanceSettings: React.FC = () => {
  const { showNotification } = useNotification();
  const { hasPermission } = usePermissions();

  const [settings, setSettings] = useState({
    workHours: {
      startTime: '09:00',
      endTime: '18:00',
      gracePeriod: 15,
      workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    },
    overtime: {
      enabled: true,
      rate: 1.5,
      minHours: 8,
      approval: true,
    },
    location: {
      enabled: false,
      latitude: '',
      longitude: '',
      radius: 100,
    },
    notifications: {
      reminder: true,
      reminderTime: '08:30',
      lateAlert: true,
      absentAlert: true,
    },
  });

  const [holidays, setHolidays] = useState<Holiday[]>([
    { id: 1, name: 'Republic Day', date: '2024-01-26', type: 'National' },
    { id: 2, name: 'Holi', date: '2024-03-25', type: 'Religious' },
    { id: 3, name: 'Independence Day', date: '2024-08-15', type: 'National' },
  ]);

  const [newHoliday, setNewHoliday] = useState({
    name: '',
    date: '',
    type: 'National' as Holiday['type'],
  });

  const workDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const handleToggleWorkDay = (day: string) => {
    const updatedDays = settings.workHours.workDays.includes(day)
      ? settings.workHours.workDays.filter(d => d !== day)
      : [...settings.workHours.workDays, day];
    
    setSettings({
      ...settings,
      workHours: { ...settings.workHours, workDays: updatedDays },
    });
  };

  const handleAddHoliday = () => {
    if (!newHoliday.name || !newHoliday.date) {
      showNotification('Please fill in all fields', 'warning');
      return;
    }

    const holiday: Holiday = {
      id: holidays.length + 1,
      ...newHoliday,
    };

    setHolidays([...holidays, holiday]);
    setNewHoliday({ name: '', date: '', type: 'National' });
    showNotification('Holiday added successfully', 'success');
  };

  const handleRemoveHoliday = (id: number) => {
    setHolidays(holidays.filter(h => h.id !== id));
    showNotification('Holiday removed', 'info');
  };

  const handleSave = () => {
    // Simulate API call
    setTimeout(() => {
      showNotification('Settings saved successfully', 'success');
    }, 1000);
  };

  if (!hasPermission('ManageSettings')) {
    return (
      <div className="unauthorized">
        <h2>Unauthorized Access</h2>
        <p>You don't have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div className="attendance-settings-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Attendance Settings</h1>
          <p>Configure attendance and working hours</p>
        </div>
        <div className="header-actions">
          <Button variant="primary" onClick={handleSave}>
            <FontAwesomeIcon icon={faSave} /> Save Changes
          </Button>
        </div>
      </div>

      <div className="settings-grid">
        {/* Working Hours */}
        <Card className="settings-card" title="Working Hours">
          <div className="form-group">
            <label>Work Start Time</label>
            <input
              type="time"
              className="form-control"
              value={settings.workHours.startTime}
              onChange={(e) => setSettings({
                ...settings,
                workHours: { ...settings.workHours, startTime: e.target.value }
              })}
            />
          </div>

          <div className="form-group">
            <label>Work End Time</label>
            <input
              type="time"
              className="form-control"
              value={settings.workHours.endTime}
              onChange={(e) => setSettings({
                ...settings,
                workHours: { ...settings.workHours, endTime: e.target.value }
              })}
            />
          </div>

          <div className="form-group">
            <label>Grace Period (minutes)</label>
            <input
              type="number"
              className="form-control"
              value={settings.workHours.gracePeriod}
              onChange={(e) => setSettings({
                ...settings,
                workHours: { ...settings.workHours, gracePeriod: parseInt(e.target.value) }
              })}
            />
          </div>

          <div className="form-group">
            <label>Working Days</label>
            <div className="work-days-grid">
              {workDays.map(day => (
                <label key={day} className="day-checkbox">
                  <input
                    type="checkbox"
                    checked={settings.workHours.workDays.includes(day)}
                    onChange={() => handleToggleWorkDay(day)}
                  />
                  <span>{day.substring(0, 3)}</span>
                </label>
              ))}
            </div>
          </div>
        </Card>

        {/* Overtime Settings */}
        <Card className="settings-card" title="Overtime Settings">
          <div className="form-group">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={settings.overtime.enabled}
                onChange={(e) => setSettings({
                  ...settings,
                  overtime: { ...settings.overtime, enabled: e.target.checked }
                })}
              />
              <span>Enable Overtime</span>
            </label>
          </div>

          {settings.overtime.enabled && (
            <>
              <div className="form-group">
                <label>Overtime Rate (x normal pay)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-control"
                  value={settings.overtime.rate}
                  onChange={(e) => setSettings({
                    ...settings,
                    overtime: { ...settings.overtime, rate: parseFloat(e.target.value) }
                  })}
                />
              </div>

              <div className="form-group">
                <label>Minimum Hours for Overtime</label>
                <input
                  type="number"
                  className="form-control"
                  value={settings.overtime.minHours}
                  onChange={(e) => setSettings({
                    ...settings,
                    overtime: { ...settings.overtime, minHours: parseInt(e.target.value) }
                  })}
                />
              </div>

              <div className="form-group">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={settings.overtime.approval}
                    onChange={(e) => setSettings({
                      ...settings,
                      overtime: { ...settings.overtime, approval: e.target.checked }
                    })}
                  />
                  <span>Require Approval for Overtime</span>
                </label>
              </div>
            </>
          )}
        </Card>

        {/* Location Tracking */}
        <Card className="settings-card" title="Location Tracking">
          <div className="form-group">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={settings.location.enabled}
                onChange={(e) => setSettings({
                  ...settings,
                  location: { ...settings.location, enabled: e.target.checked }
                })}
              />
              <span>Enable Location Tracking</span>
            </label>
          </div>

          {settings.location.enabled && (
            <>
              <div className="form-group">
                <label>Latitude</label>
                <input
                  type="text"
                  className="form-control"
                  value={settings.location.latitude}
                  onChange={(e) => setSettings({
                    ...settings,
                    location: { ...settings.location, latitude: e.target.value }
                  })}
                  placeholder="e.g., 28.6139"
                />
              </div>

              <div className="form-group">
                <label>Longitude</label>
                <input
                  type="text"
                  className="form-control"
                  value={settings.location.longitude}
                  onChange={(e) => setSettings({
                    ...settings,
                    location: { ...settings.location, longitude: e.target.value }
                  })}
                  placeholder="e.g., 77.2090"
                />
              </div>

              <div className="form-group">
                <label>Geofence Radius (meters)</label>
                <input
                  type="number"
                  className="form-control"
                  value={settings.location.radius}
                  onChange={(e) => setSettings({
                    ...settings,
                    location: { ...settings.location, radius: parseInt(e.target.value) }
                  })}
                />
              </div>
            </>
          )}
        </Card>

        {/* Notifications */}
        <Card className="settings-card" title="Notifications">
          <div className="form-group">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={settings.notifications.reminder}
                onChange={(e) => setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, reminder: e.target.checked }
                })}
              />
              <span>Send Check-in Reminder</span>
            </label>
          </div>

          {settings.notifications.reminder && (
            <div className="form-group">
              <label>Reminder Time</label>
              <input
                type="time"
                className="form-control"
                value={settings.notifications.reminderTime}
                onChange={(e) => setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, reminderTime: e.target.value }
                })}
              />
            </div>
          )}

          <div className="form-group">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={settings.notifications.lateAlert}
                onChange={(e) => setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, lateAlert: e.target.checked }
                })}
              />
              <span>Send Late Arrival Alerts</span>
            </label>
          </div>

          <div className="form-group">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={settings.notifications.absentAlert}
                onChange={(e) => setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, absentAlert: e.target.checked }
                })}
              />
              <span>Send Absence Alerts</span>
            </label>
          </div>
        </Card>

        {/* Holidays */}
        <Card className="settings-card holidays-card" title="Holidays">
          <div className="holidays-list">
            {holidays.map(holiday => (
              <div key={holiday.id} className="holiday-item">
                <div>
                  <strong>{holiday.name}</strong>
                  <span className="holiday-date">{holiday.date}</span>
                  <span className={`holiday-type ${holiday.type.toLowerCase()}`}>
                    {holiday.type}
                  </span>
                </div>
                <button
                  className="remove-btn"
                  onClick={() => handleRemoveHoliday(holiday.id)}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            ))}
          </div>

          <div className="add-holiday">
            <h4>Add Holiday</h4>
            <div className="form-row">
              <input
                type="text"
                className="form-control"
                placeholder="Holiday Name"
                value={newHoliday.name}
                onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
              />
              <input
                type="date"
                className="form-control"
                value={newHoliday.date}
                onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
              />
              <select
                className="form-control"
                value={newHoliday.type}
                onChange={(e) => setNewHoliday({ ...newHoliday, type: e.target.value as Holiday['type'] })}
              >
                <option value="National">National</option>
                <option value="Religious">Religious</option>
                <option value="University">University</option>
              </select>
              <Button variant="secondary" onClick={handleAddHoliday}>
                <FontAwesomeIcon icon={faPlus} /> Add
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AttendanceSettings;