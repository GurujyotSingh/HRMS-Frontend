import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDownload,
  faEye,

  faCalendarAlt,
  faMoneyBill,
  faSearch,
} from '@fortawesome/free-solid-svg-icons';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import { useNotification } from '../../../hooks/useNotification';
import { formatDate, formatCurrency } from '../../../utils/formatters';

interface Payslip {
  id: string;
  month: number;
  year: number;
  pdfUrl: string;
  generatedDate: string;
  paymentDate: string;
  basicSalary: number;
  allowances: {
    hra: number;
    da: number;
    travel: number;
    special: number;
    other: number;
  };
  deductions: {
    pf: number;
    pt: number;
    tds: number;
    insurance: number;
    other: number;
  };
  grossPay: number;
  netPay: number;
  status: 'generated' | 'paid';
}

const MyPayslips: React.FC = () => {
  const { showNotification } = useNotification();
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [filteredPayslips, setFilteredPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState('');

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = [2024, 2023, 2022, 2021, 2020];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockPayslips: Payslip[] = [
        {
          id: '1',
          month: 2,
          year: 2024,
          pdfUrl: '#',
          generatedDate: '2024-03-01',
          paymentDate: '2024-03-05',
          basicSalary: 85000,
          allowances: {
            hra: 25000,
            da: 15000,
            travel: 5000,
            special: 0,
            other: 0,
          },
          deductions: {
            pf: 12000,
            pt: 2000,
            tds: 8000,
            insurance: 1500,
            other: 0,
          },
          grossPay: 130000,
          netPay: 108000,
          status: 'paid',
        },
        {
          id: '2',
          month: 1,
          year: 2024,
          pdfUrl: '#',
          generatedDate: '2024-02-01',
          paymentDate: '2024-02-05',
          basicSalary: 85000,
          allowances: {
            hra: 25000,
            da: 15000,
            travel: 5000,
            special: 0,
            other: 0,
          },
          deductions: {
            pf: 12000,
            pt: 2000,
            tds: 8000,
            insurance: 1500,
            other: 0,
          },
          grossPay: 130000,
          netPay: 108000,
          status: 'paid',
        },
        {
          id: '3',
          month: 12,
          year: 2023,
          pdfUrl: '#',
          generatedDate: '2024-01-01',
          paymentDate: '2024-01-05',
          basicSalary: 85000,
          allowances: {
            hra: 25000,
            da: 15000,
            travel: 5000,
            special: 5000,
            other: 0,
          },
          deductions: {
            pf: 12000,
            pt: 2000,
            tds: 8500,
            insurance: 1500,
            other: 0,
          },
          grossPay: 135000,
          netPay: 111000,
          status: 'paid',
        },
        {
          id: '4',
          month: 11,
          year: 2023,
          pdfUrl: '#',
          generatedDate: '2023-12-01',
          paymentDate: '2023-12-05',
          basicSalary: 85000,
          allowances: {
            hra: 25000,
            da: 15000,
            travel: 5000,
            special: 0,
            other: 2000,
          },
          deductions: {
            pf: 12000,
            pt: 2000,
            tds: 8000,
            insurance: 1500,
            other: 1000,
          },
          grossPay: 132000,
          netPay: 107500,
          status: 'paid',
        },
      ];
      setPayslips(mockPayslips);
      setFilteredPayslips(mockPayslips.filter(p => p.year === new Date().getFullYear()));
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    let filtered = payslips.filter(p => p.year === yearFilter);

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        months[p.month - 1].toLowerCase().includes(term) ||
        p.year.toString().includes(term)
      );
    }

    setFilteredPayslips(filtered.sort((a, b) => b.month - a.month));
  }, [yearFilter, searchTerm, payslips]);

  const handleDownload = (payslip: Payslip) => {
    // Simulate download
    showNotification(`Downloading payslip for ${months[payslip.month - 1]} ${payslip.year}`, 'success');
  };

  const calculateYTD = () => {
    const currentYearPayslips = payslips.filter(p => p.year === yearFilter);
    return {
      grossPay: currentYearPayslips.reduce((sum, p) => sum + p.grossPay, 0),
      netPay: currentYearPayslips.reduce((sum, p) => sum + p.netPay, 0),
      totalDeductions: currentYearPayslips.reduce((sum, p) => 
        sum + Object.values(p.deductions).reduce((a, b) => a + b, 0), 0
      ),
    };
  };

  const ytd = calculateYTD();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading payslips...</p>
      </div>
    );
  }

  return (
    <div className="my-payslips-page">
      <div className="page-header">
        <h1>My Payslips</h1>
        <p>View and download your salary statements</p>
      </div>

      {/* YTD Summary Cards */}
      <div className="summary-cards">
        <Card className="summary-card">
          <h3>YTD Gross</h3>
          <p className="value">{formatCurrency(ytd.grossPay)}</p>
        </Card>
        <Card className="summary-card">
          <h3>YTD Net</h3>
          <p className="value success">{formatCurrency(ytd.netPay)}</p>
        </Card>
        <Card className="summary-card">
          <h3>Total Deductions</h3>
          <p className="value warning">{formatCurrency(ytd.totalDeductions)}</p>
        </Card>
        <Card className="summary-card">
          <h3>Average Net</h3>
          <p className="value info">
            {formatCurrency(filteredPayslips.length > 0 ? ytd.netPay / filteredPayslips.length : 0)}
          </p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="filters-card">
        <div className="filters-grid">
          <div className="search-box">
            <FontAwesomeIcon icon={faSearch} className="search-icon" />
            <input
              type="text"
              placeholder="Search by month..."
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

      {/* Payslips List */}
      <div className="payslips-list">
        {filteredPayslips.length > 0 ? (
          filteredPayslips.map(payslip => (
            <Card key={payslip.id} className="payslip-card">
              <div className="payslip-header">
                <div className="payslip-period">
                  <FontAwesomeIcon icon={faCalendarAlt} />
                  <h3>{months[payslip.month - 1]} {payslip.year}</h3>
                </div>
                <span className={`status-badge status-${payslip.status}`}>
                  {payslip.status}
                </span>
              </div>

              <div className="payslip-summary">
                <div className="summary-item">
                  <span className="label">Net Pay:</span>
                  <span className="value net">{formatCurrency(payslip.netPay)}</span>
                </div>
                <div className="summary-item">
                  <span className="label">Gross Pay:</span>
                  <span className="value">{formatCurrency(payslip.grossPay)}</span>
                </div>
                <div className="summary-item">
                  <span className="label">Payment Date:</span>
                  <span className="value">{formatDate(payslip.paymentDate)}</span>
                </div>
              </div>

              <div className="payslip-actions">
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => {
                    setSelectedPayslip(payslip);
                    setShowDetailsModal(true);
                  }}
                >
                  <FontAwesomeIcon icon={faEye} /> View Details
                </Button>
                <Button
                  variant="primary"
                  size="small"
                  onClick={() => handleDownload(payslip)}
                >
                  <FontAwesomeIcon icon={faDownload} /> Download PDF
                </Button>
              </div>
            </Card>
          ))
        ) : (
          <div className="no-results">
            <FontAwesomeIcon icon={faMoneyBill} />
            <h3>No payslips found</h3>
            <p>No payslips available for the selected year</p>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedPayslip && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedPayslip(null);
          }}
          title={`Payslip - ${months[selectedPayslip.month - 1]} ${selectedPayslip.year}`}
          size="large"
        >
          <div className="payslip-details-modal">
            <div className="modal-header-info">
              <p><strong>Payment Date:</strong> {formatDate(selectedPayslip.paymentDate)}</p>
              <p><strong>Generated On:</strong> {formatDate(selectedPayslip.generatedDate)}</p>
            </div>

            <div className="salary-breakdown">
              <div className="breakdown-section">
                <h4>Earnings</h4>
                <table className="breakdown-table">
                  <tbody>
                    <tr>
                      <td>Basic Salary</td>
                      <td className="amount">{formatCurrency(selectedPayslip.basicSalary)}</td>
                    </tr>
                    <tr>
                      <td>HRA</td>
                      <td className="amount">{formatCurrency(selectedPayslip.allowances.hra)}</td>
                    </tr>
                    <tr>
                      <td>Dearness Allowance</td>
                      <td className="amount">{formatCurrency(selectedPayslip.allowances.da)}</td>
                    </tr>
                    <tr>
                      <td>Travel Allowance</td>
                      <td className="amount">{formatCurrency(selectedPayslip.allowances.travel)}</td>
                    </tr>
                    {selectedPayslip.allowances.special > 0 && (
                      <tr>
                        <td>Special Allowance</td>
                        <td className="amount">{formatCurrency(selectedPayslip.allowances.special)}</td>
                      </tr>
                    )}
                    {selectedPayslip.allowances.other > 0 && (
                      <tr>
                        <td>Other Allowances</td>
                        <td className="amount">{formatCurrency(selectedPayslip.allowances.other)}</td>
                      </tr>
                    )}
                    <tr className="total">
                      <td>Gross Pay</td>
                      <td className="amount">{formatCurrency(selectedPayslip.grossPay)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="breakdown-section">
                <h4>Deductions</h4>
                <table className="breakdown-table">
                  <tbody>
                    <tr>
                      <td>Provident Fund</td>
                      <td className="amount">- {formatCurrency(selectedPayslip.deductions.pf)}</td>
                    </tr>
                    <tr>
                      <td>Professional Tax</td>
                      <td className="amount">- {formatCurrency(selectedPayslip.deductions.pt)}</td>
                    </tr>
                    <tr>
                      <td>TDS</td>
                      <td className="amount">- {formatCurrency(selectedPayslip.deductions.tds)}</td>
                    </tr>
                    <tr>
                      <td>Insurance</td>
                      <td className="amount">- {formatCurrency(selectedPayslip.deductions.insurance)}</td>
                    </tr>
                    {selectedPayslip.deductions.other > 0 && (
                      <tr>
                        <td>Other Deductions</td>
                        <td className="amount">- {formatCurrency(selectedPayslip.deductions.other)}</td>
                      </tr>
                    )}
                    <tr className="total">
                      <td>Net Pay</td>
                      <td className="amount net">{formatCurrency(selectedPayslip.netPay)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="payment-info">
              <p><strong>Payment Mode:</strong> Bank Transfer</p>
              <p><strong>Account Number:</strong> **** **** **** 1234</p>
              <p><strong>Bank:</strong> State Bank of India</p>
            </div>
          </div>

          <div className="modal-footer">
            <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
              Close
            </Button>
            <Button variant="primary" onClick={() => handleDownload(selectedPayslip)}>
              <FontAwesomeIcon icon={faDownload} /> Download PDF
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MyPayslips;