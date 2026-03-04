import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faEdit,
  faTrash,
  faCheck,
  faTimes,
  faCalendarAlt,
  faGift,
  faFlag,
  faChurch,
  faStar,
} from '@fortawesome/free-solid-svg-icons';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Table from '../../../components/ui/Table';
import Modal from '../../../components/ui/Modal';
import { useNotification } from '../../../hooks/useNotification';
import { usePermissions } from '../../../hooks/usePermissions';
import type { Holiday } from '../../../types/calendar';
import { formatDate } from '../../../utils/formatters';

const Holidays: React.FC = () => {
  const { showNotification } = useNotification();
  const { hasPermission } = usePermissions();

  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [filteredHolidays, setFilteredHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
  const [showModal, setShowModal] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    type: 'National' as 'National' | 'Religious' | 'University' | 'Optional',
    is_paid: true,
  });

  const years = [2024, 2025, 2026, 2027, 2028];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockHolidays: Holiday[] = [
        {
          holiday_id: 1,
          name: 'Republic Day',
          date: '2024-01-26',
          type: 'National',
          is_paid: true,
        },
        {
          holiday_id: 2,
          name: 'Holi',
          date: '2024-03-25',
          type: 'Religious',
          is_paid: true,
        },
        {
          holiday_id: 3,
          name: 'Good Friday',
          date: '2024-03-29',
          type: 'Religious',
          is_paid: true,
        },
        {
          holiday_id: 4,
          name: 'Id-ul-Fitr',
          date: '2024-04-10',
          type: 'Religious',
          is_paid: true,
        },
        {
          holiday_id: 5,
          name: 'Independence Day',
          date: '2024-08-15',
          type: 'National',
          is_paid: true,
        },
        {
          holiday_id: 6,
          name: 'Gandhi Jayanti',
          date: '2024-10-02',
          type: 'National',
          is_paid: true,
        },
        {
          holiday_id: 7,
          name: 'Diwali',
          date: '2024-11-01',
          type: 'Religious',
          is_paid: true,
        },
        {
          holiday_id: 8,
          name: 'Christmas',
          date: '2024-12-25',
          type: 'Religious',
          is_paid: true,
        },
        {
          holiday_id: 9,
          name: 'Foundation Day',
          date: '2024-09-05',
          type: 'University',
          is_paid: true,
        },
        {
          holiday_id: 10,
          name: 'Optional Holiday',
          date: '2024-05-01',
          type: 'Optional',
          is_paid: false,
        },
      ];
      setHolidays(mockHolidays);
      setFilteredHolidays(mockHolidays.filter(h => new Date(h.date).getFullYear() === yearFilter));
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    let filtered = holidays.filter(h => new Date(h.date).getFullYear() === yearFilter);

    if (searchTerm) {
      filtered = filtered.filter(h =>
        h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredHolidays(filtered);
  }, [searchTerm, yearFilter, holidays]);

  const handleAddHoliday = () => {
    if (!formData.name || !formData.date) {
      showNotification('Please fill in all fields', 'warning');
      return;
    }

    // Simulate API call
    setTimeout(() => {
      showNotification('Holiday added successfully', 'success');
      setShowModal(false);
      setFormData({
        name: '',
        date: '',
        type: 'National',
        is_paid: true,
      });
    }, 1000);
  };

  const handleEditHoliday = () => {
    if (!selectedHoliday) return;
    // Simulate API call
    setTimeout(() => {
      showNotification('Holiday updated successfully', 'success');
      setShowModal(false);
      setSelectedHoliday(null);
    }, 1000);
  };

  const handleDeleteHoliday = (holidayId: number) => {
    // Simulate API call
    setTimeout(() => {
      showNotification('Holiday deleted successfully', 'success');
    }, 500);
  };

  const getHolidayIcon = (type: string) => {
    switch (type) {
      case 'National': return faFlag;
      case 'Religious': return faChurch;
      case 'University': return faStar;
      case 'Optional': return faGift;
      default: return faCalendarAlt;
    }
  };

  const getHolidayColor = (type: string) => {
    switch (type) {
      case 'National': return '#4361ee';
      case 'Religious': return '#f72585';
      case 'University': return '#4cc9f0';
      case 'Optional': return '#f8961e';
      default: return '#6b7280';
    }
  };

  const columns = [
    {
      key: 'name',
      title: 'Holiday',
      render: (row: Holiday) => (
        <div className="holiday-cell">
          <FontAwesomeIcon icon={getHolidayIcon(row.type)} style={{ color: getHolidayColor(row.type) }} />
          <div>
            <div>{row.name}</div>
            <small>{formatDate(row.date)}</small>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      title: 'Type',
      render: (row: Holiday) => (
        <span className="holiday-type" style={{ backgroundColor: `${getHolidayColor(row.type)}20`, color: getHolidayColor(row.type) }}>
          {row.type}
        </span>
      ),
    },
    {
      key: 'day',
      title: 'Day',
      render: (row: Holiday) => new Date(row.date).toLocaleDateString('en-US', { weekday: 'long' }),
    },
    {
      key: 'paid',
      title: 'Paid',
      render: (row: Holiday) => row.is_paid ? (
        <span className="paid-badge">
          <FontAwesomeIcon icon={faCheck} style={{ color: '#10b981' }} /> Paid
        </span>
      ) : (
        <span className="unpaid-badge">
          <FontAwesomeIcon icon={faTimes} style={{ color: '#ef4444' }} /> Unpaid
        </span>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (row: Holiday) => (
        <div className="action-buttons">
          <button
            className="action-btn edit"
            onClick={() => {
              setSelectedHoliday(row);
              setFormData({
                name: row.name,
                date: row.date,
                type: row.type,
                is_paid: row.is_paid,
              });
              setShowModal(true);
            }}
            title="Edit"
          >
            <FontAwesomeIcon icon={faEdit} />
          </button>
          <button
            className="action-btn delete"
            onClick={() => handleDeleteHoliday(row.holiday_id)}
            title="Delete"
          >
            <FontAwesomeIcon icon={faTrash} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="holidays-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Holidays</h1>
          <p>Manage university holidays and observances</p>
        </div>
        <div className="header-actions">
          {hasPermission('ManageCalendar') && (
            <Button variant="primary" onClick={() => setShowModal(true)}>
              <FontAwesomeIcon icon={faPlus} /> Add Holiday
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <Card className="summary-card">
          <h3>Total Holidays</h3>
          <p className="value">{filteredHolidays.length}</p>
        </Card>
        <Card className="summary-card">
          <h3>National</h3>
          <p className="value" style={{ color: '#4361ee' }}>
            {filteredHolidays.filter(h => h.type === 'National').length}
          </p>
        </Card>
        <Card className="summary-card">
          <h3>Religious</h3>
          <p className="value" style={{ color: '#f72585' }}>
            {filteredHolidays.filter(h => h.type === 'Religious').length}
          </p>
        </Card>
        <Card className="summary-card">
          <h3>University</h3>
          <p className="value" style={{ color: '#4cc9f0' }}>
            {filteredHolidays.filter(h => h.type === 'University').length}
          </p>
        </Card>
        <Card className="summary-card">
          <h3>Optional</h3>
          <p className="value" style={{ color: '#f8961e' }}>
            {filteredHolis.h.filter(h => h.type === 'Optional').length}
          </p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="filters-card">
        <div className="filters-grid">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search holidays..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(parseInt(e.target.value))}
            className="filter-select"
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Holidays Table */}
      <Card className="table-card">
        <Table
          columns={columns}
          data={filteredHolidays}
          loading={loading}
        />
      </Card>

      {/* Add/Edit Holiday Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedHoliday(null);
          setFormData({
            name: '',
            date: '',
            type: 'National',
            is_paid: true,
          });
        }}
        title={selectedHoliday ? 'Edit Holiday' : 'Add Holiday'}
        size="small"
      >
        <div className="holiday-form">
          <div className="form-group">
            <label>Holiday Name *</label>
            <input
              type="text"
              className="form-control"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Independence Day"
            />
          </div>

          <div className="form-group">
            <label>Date *</label>
            <input
              type="date"
              className="form-control"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Holiday Type</label>
            <select
              className="form-control"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
            >
              <option value="National">National Holiday</option>
              <option value="Religious">Religious Holiday</option>
              <option value="University">University Holiday</option>
              <option value="Optional">Optional Holiday</option>
            </select>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.is_paid}
                onChange={(e) => setFormData({ ...formData, is_paid: e.target.checked })}
              />
              <span>Paid Holiday</span>
            </label>
          </div>

          <div className="modal-footer">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={selectedHoliday ? handleEditHoliday : handleAddHoliday}>
              {selectedHoliday ? 'Update' : 'Add'} Holiday
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Holidays;