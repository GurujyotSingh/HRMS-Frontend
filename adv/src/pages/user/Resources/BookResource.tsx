import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faLaptop,

  faChalkboard,
  faVideo,

  faUsers,
  faMapMarkerAlt,

  faCheck,

} from '@fortawesome/free-solid-svg-icons';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import FormInput from '../../../components/ui/FormInput';
import { useNotification } from '../../../hooks/useNotification';
import { formatDate, formatTime } from '../../../utils/formatters';

interface Resource {
  id: string;
  type: 'room' | 'equipment' | 'vehicle';
  name: string;
  capacity?: number;
  location: string;
  features: string[];
  image?: string;
  availability: {
    date: string;
    slots: {
      start: string;
      end: string;
      available: boolean;
    }[];
  }[];
}

const BookResource: React.FC = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [formData, setFormData] = useState({
    purpose: '',
    attendees: 1,
    requirements: '',
  });

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockResources: Resource[] = [
        {
          id: '1',
          type: 'room',
          name: 'Conference Room A',
          capacity: 20,
          location: 'Main Building, 2nd Floor',
          features: ['Projector', 'Whiteboard', 'Video Conferencing', 'AC'],
          availability: [
            {
              date: '2024-03-20',
              slots: [
                { start: '09:00', end: '10:00', available: true },
                { start: '10:00', end: '11:00', available: false },
                { start: '11:00', end: '12:00', available: true },
                { start: '14:00', end: '15:00', available: true },
                { start: '15:00', end: '16:00', available: true },
              ],
            },
            {
              date: '2024-03-21',
              slots: [
                { start: '09:00', end: '10:00', available: true },
                { start: '10:00', end: '11:00', available: true },
                { start: '11:00', end: '12:00', available: true },
                { start: '14:00', end: '15:00', available: false },
                { start: '15:00', end: '16:00', available: true },
              ],
            },
          ],
        },
        {
          id: '2',
          type: 'room',
          name: 'Seminar Hall',
          capacity: 100,
          location: 'Academic Block, Ground Floor',
          features: ['Projector', 'Sound System', 'Stage', 'AC'],
          availability: [
            {
              date: '2024-03-20',
              slots: [
                { start: '09:00', end: '11:00', available: true },
                { start: '11:00', end: '13:00', available: true },
                { start: '14:00', end: '16:00', available: false },
                { start: '16:00', end: '18:00', available: true },
              ],
            },
          ],
        },
        {
          id: '3',
          type: 'equipment',
          name: 'Laptop (Dell XPS)',
          location: 'IT Store',
          features: ['i7 Processor', '16GB RAM', '512GB SSD'],
          availability: [
            {
              date: '2024-03-20',
              slots: [
                { start: 'Full Day', end: 'Full Day', available: true },
              ],
            },
            {
              date: '2024-03-21',
              slots: [
                { start: 'Full Day', end: 'Full Day', available: false },
              ],
            },
          ],
        },
        {
          id: '4',
          type: 'equipment',
          name: 'Projector',
          location: 'AV Room',
          features: ['HDMI', 'VGA', 'Wireless'],
          availability: [
            {
              date: '2024-03-20',
              slots: [
                { start: 'Full Day', end: 'Full Day', available: true },
              ],
            },
          ],
        },
      ];
      setResources(mockResources);
    }, 1000);
  }, []);

  const resourceTypes = [
    { id: 'all', label: 'All Resources', icon: faLaptop },
    { id: 'room', label: 'Rooms', icon: faChalkboard },
    { id: 'equipment', label: 'Equipment', icon: faLaptop },
    { id: 'vehicle', label: 'Vehicles', icon: faVideo },
  ];

  const filteredResources = selectedType === 'all'
    ? resources
    : resources.filter(r => r.type === selectedType);

  const handleResourceSelect = (resource: Resource) => {
    setSelectedResource(resource);
    setStep(2);
  };

  const handleSlotSelect = (slot: any) => {
    setSelectedSlot(slot);
  };

  const handleBooking = () => {
    if (!selectedResource || !selectedDate || !selectedSlot || !formData.purpose) {
      showNotification('Please fill in all required fields', 'warning');
      return;
    }

    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      showNotification('Resource booked successfully!', 'success');
      setLoading(false);
      navigate('/user/resources');
    }, 1500);
  };

  return (
    <div className="book-resource-page">
      <div className="page-header">
        <h1>Book Resource</h1>
        <p>Reserve rooms, equipment, or vehicles</p>
      </div>

      {/* Progress Steps */}
      <div className="booking-steps">
        <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
          <div className="step-number">{step > 1 ? <FontAwesomeIcon icon={faCheck} /> : 1}</div>
          <span>Select Resource</span>
        </div>
        <div className={`step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
          <div className="step-number">{step > 2 ? <FontAwesomeIcon icon={faCheck} /> : 2}</div>
          <span>Choose Time</span>
        </div>
        <div className={`step ${step >= 3 ? 'active' : ''}`}>
          <div className="step-number">3</div>
          <span>Confirm Booking</span>
        </div>
      </div>

      {/* Step 1: Select Resource */}
      {step === 1 && (
        <div className="step-content">
          {/* Resource Type Filter */}
          <div className="resource-types">
            {resourceTypes.map(type => (
              <button
                key={type.id}
                className={`type-btn ${selectedType === type.id ? 'active' : ''}`}
                onClick={() => setSelectedType(type.id)}
              >
                <FontAwesomeIcon icon={type.icon} />
                <span>{type.label}</span>
              </button>
            ))}
          </div>

          {/* Resources Grid */}
          <div className="resources-grid">
            {filteredResources.map(resource => (
              <Card
                key={resource.id}
                className={`resource-card ${selectedResource?.id === resource.id ? 'selected' : ''}`}
                onClick={() => handleResourceSelect(resource)}
              >
                <div className="resource-header">
                  <h3>{resource.name}</h3>
                  {resource.capacity && (
                    <span className="capacity">
                      <FontAwesomeIcon icon={faUsers} /> Up to {resource.capacity}
                    </span>
                  )}
                </div>
                <div className="resource-details">
                  <p className="location">
                    <FontAwesomeIcon icon={faMapMarkerAlt} /> {resource.location}
                  </p>
                  <div className="features">
                    {resource.features.map((feature, index) => (
                      <span key={index} className="feature-tag">{feature}</span>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="step-actions">
            <Button variant="secondary" onClick={() => navigate('/user/resources')}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => setStep(2)}
              disabled={!selectedResource}
            >
              Next: Choose Time
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Choose Time */}
      {step === 2 && selectedResource && (
        <div className="step-content">
          <div className="booking-details">
            <Card className="selected-resource-card">
              <h3>Selected Resource</h3>
              <div className="resource-info">
                <h4>{selectedResource.name}</h4>
                <p>{selectedResource.location}</p>
              </div>
            </Card>

            <Card className="time-selection-card">
              <h3>Select Date & Time</h3>
              
              <FormInput
                label="Date *"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />

              {selectedDate && (
                <div className="time-slots">
                  <h4>Available Slots</h4>
                  <div className="slots-grid">
                    {selectedResource.availability
                      .find(a => a.date === selectedDate)
                      ?.slots.map((slot, index) => (
                        <button
                          key={index}
                          className={`slot-btn ${selectedSlot === slot ? 'selected' : ''} ${!slot.available ? 'unavailable' : ''}`}
                          onClick={() => slot.available && setSelectedSlot(slot)}
                          disabled={!slot.available}
                        >
                          <span className="time">{slot.start}</span>
                          {slot.end !== 'Full Day' && <span className="time">- {slot.end}</span>}
                          {!slot.available && <span className="unavailable-label">Booked</span>}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </Card>

            <div className="step-actions">
              <Button variant="secondary" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                variant="primary"
                onClick={() => setStep(3)}
                disabled={!selectedDate || !selectedSlot}
              >
                Next: Confirm Booking
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Confirm Booking */}
      {step === 3 && selectedResource && selectedSlot && (
        <div className="step-content">
          <div className="booking-confirmation">
            <Card className="confirmation-card">
              <h3>Booking Summary</h3>
              
              <div className="summary-item">
                <span className="label">Resource:</span>
                <span className="value">{selectedResource.name}</span>
              </div>
              
              <div className="summary-item">
                <span className="label">Location:</span>
                <span className="value">{selectedResource.location}</span>
              </div>
              
              <div className="summary-item">
                <span className="label">Date:</span>
                <span className="value">{formatDate(selectedDate)}</span>
              </div>
              
              <div className="summary-item">
                <span className="label">Time:</span>
                <span className="value">
                  {selectedSlot.start} {selectedSlot.end !== 'Full Day' && `- ${selectedSlot.end}`}
                </span>
              </div>

              <div className="form-section">
                <h4>Additional Information</h4>
                
                <FormInput
                  label="Purpose *"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  placeholder="What is this booking for?"
                  required
                />

                {selectedResource.type === 'room' && (
                  <FormInput
                    label="Number of Attendees"
                    type="number"
                    value={formData.attendees}
                    onChange={(e) => setFormData({ ...formData, attendees: parseInt(e.target.value) })}
                    min={1}
                    max={selectedResource.capacity}
                  />
                )}

                <div className="form-group">
                  <label>Special Requirements</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={formData.requirements}
                    onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                    placeholder="Any special requirements or notes..."
                  />
                </div>
              </div>

              <div className="booking-rules">
                <h4>Booking Rules</h4>
                <ul>
                  <li>Cancellations must be made at least 2 hours in advance</li>
                  <li>Please leave the resource clean and tidy after use</li>
                  <li>Report any damages or issues immediately</li>
                </ul>
              </div>
            </Card>

            <div className="step-actions">
              <Button variant="secondary" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button
                variant="success"
                onClick={handleBooking}
                loading={loading}
              >
                Confirm Booking
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookResource;