import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {

  faDownload,
  faInfoCircle,
  faExclamationTriangle,
  faCheckCircle,
} from '@fortawesome/free-solid-svg-icons';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Chart from '../../../components/ui/Chart';
import { useNotification } from '../../../hooks/useNotification';
import { formatCurrency } from '../../../utils/formatters';

interface TaxDetail {
  financialYear: string;
  totalIncome: number;
  taxableIncome: number;
  taxAmount: number;
  rebate: number;
  netTax: number;
  sections: {
    name: string;
    limit: number;
    invested: number;
    eligible: number;
  }[];
}

const TaxDetails: React.FC = () => {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [financialYear, setFinancialYear] = useState('2024-25');
  const [taxDetails, setTaxDetails] = useState<TaxDetail | null>(null);

  const financialYears = ['2024-25', '2023-24', '2022-23', '2021-22', '2020-21'];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockTaxDetails: TaxDetail = {
        financialYear: '2024-25',
        totalIncome: 1300000,
        taxableIncome: 1150000,
        taxAmount: 135000,
        rebate: 0,
        netTax: 135000,
        sections: [
          { name: 'Section 80C (PPF, ELSS, LIC)', limit: 150000, invested: 145000, eligible: 145000 },
          { name: 'Section 80D (Health Insurance)', limit: 25000, invested: 20000, eligible: 20000 },
          { name: 'HRA Exemption', limit: 0, invested: 0, eligible: 120000 },
          { name: 'Standard Deduction', limit: 50000, invested: 0, eligible: 50000 },
        ],
      };
      setTaxDetails(mockTaxDetails);
      setLoading(false);
    }, 1000);
  }, []);

  const handleDownloadStatement = () => {
    showNotification('Tax statement downloaded successfully', 'success');
  };

  const calculateTaxRate = () => {
    if (!taxDetails) return 0;
    return (taxDetails.netTax / taxDetails.totalIncome) * 100;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading tax details...</p>
      </div>
    );
  }

  if (!taxDetails) return null;

  const chartData = [
    { name: 'Income', value: taxDetails.totalIncome },
    { name: 'Deductions', value: taxDetails.totalIncome - taxDetails.taxableIncome },
    { name: 'Tax', value: taxDetails.netTax },
  ];

  return (
    <div className="tax-details-page">
      <div className="page-header">
        <h1>Tax Details</h1>
        <p>View your tax calculations and investments</p>
      </div>

      {/* Financial Year Selector */}
      <Card className="year-selector-card">
        <div className="year-selector">
          <label>Financial Year:</label>
          <select
            value={financialYear}
            onChange={(e) => setFinancialYear(e.target.value)}
            className="year-select"
          >
            {financialYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <Button variant="secondary" onClick={handleDownloadStatement}>
            <FontAwesomeIcon icon={faDownload} /> Download Statement
          </Button>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="summary-cards">
        <Card className="summary-card">
          <h3>Total Income</h3>
          <p className="value">{formatCurrency(taxDetails.totalIncome)}</p>
        </Card>
        <Card className="summary-card">
          <h3>Taxable Income</h3>
          <p className="value warning">{formatCurrency(taxDetails.taxableIncome)}</p>
        </Card>
        <Card className="summary-card">
          <h3>Tax Payable</h3>
          <p className="value danger">{formatCurrency(taxDetails.netTax)}</p>
        </Card>
        <Card className="summary-card">
          <h3>Effective Tax Rate</h3>
          <p className="value info">{calculateTaxRate().toFixed(1)}%</p>
        </Card>
      </div>

      {/* Chart */}
      <Card className="chart-card" title="Income Distribution">
        <Chart
          type="pie"
          data={chartData}
          dataKeys={['value']}
          colors={['#4361ee', '#4cc9f0', '#f72585']}
          height={300}
        />
      </Card>

      {/* Tax Calculation */}
      <Card className="calculation-card" title="Tax Calculation">
        <div className="calculation-grid">
          <div className="calculation-item">
            <span className="label">Income from Salary</span>
            <span className="value">{formatCurrency(taxDetails.totalIncome)}</span>
          </div>
          <div className="calculation-item">
            <span className="label">Less: Standard Deduction</span>
            <span className="value">- {formatCurrency(50000)}</span>
          </div>
          <div className="calculation-item">
            <span className="label">Less: Chapter VI-A Deductions</span>
            <span className="value">- {formatCurrency(taxDetails.totalIncome - taxDetails.taxableIncome - 50000)}</span>
          </div>
          <div className="calculation-item total">
            <span className="label">Taxable Income</span>
            <span className="value">{formatCurrency(taxDetails.taxableIncome)}</span>
          </div>
        </div>

        <div className="tax-slabs">
          <h4>Tax Calculation on Slabs</h4>
          <table className="tax-table">
            <thead>
              <tr>
                <th>Income Slab</th>
                <th>Rate</th>
                <th>Amount</th>
                <th>Tax</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Up to ₹2,50,000</td>
                <td>Nil</td>
                <td>{formatCurrency(250000)}</td>
                <td>{formatCurrency(0)}</td>
              </tr>
              <tr>
                <td>₹2,50,001 - ₹5,00,000</td>
                <td>5%</td>
                <td>{formatCurrency(250000)}</td>
                <td>{formatCurrency(12500)}</td>
              </tr>
              <tr>
                <td>₹5,00,001 - ₹10,00,000</td>
                <td>20%</td>
                <td>{formatCurrency(500000)}</td>
                <td>{formatCurrency(100000)}</td>
              </tr>
              <tr>
                <td>Above ₹10,00,000</td>
                <td>30%</td>
                <td>{formatCurrency(taxDetails.taxableIncome - 1000000)}</td>
                <td>{formatCurrency(Math.max(0, (taxDetails.taxableIncome - 1000000) * 0.3))}</td>
              </tr>
              <tr className="total">
                <td colSpan={3}>Total Tax</td>
                <td>{formatCurrency(taxDetails.taxAmount)}</td>
              </tr>
              {taxDetails.rebate > 0 && (
                <tr>
                  <td colSpan={3}>Less: Rebate u/s 87A</td>
                  <td>- {formatCurrency(taxDetails.rebate)}</td>
                </tr>
              )}
              <tr className="total">
                <td colSpan={3}>Net Tax Payable</td>
                <td>{formatCurrency(taxDetails.netTax)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Investment Sections */}
      <Card className="sections-card" title="Investment Declaration (80C, 80D, etc.)">
        <table className="sections-table">
          <thead>
            <tr>
              <th>Section</th>
              <th>Limit</th>
              <th>Invested</th>
              <th>Eligible</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {taxDetails.sections.map((section, index) => (
              <tr key={index}>
                <td>{section.name}</td>
                <td>{section.limit > 0 ? formatCurrency(section.limit) : 'No Limit'}</td>
                <td>{section.invested > 0 ? formatCurrency(section.invested) : '-'}</td>
                <td>{formatCurrency(section.eligible)}</td>
                <td>
                  {section.eligible >= (section.limit * 0.9) ? (
                    <span className="status-success">
                      <FontAwesomeIcon icon={faCheckCircle} /> Optimized
                    </span>
                  ) : section.eligible > 0 ? (
                    <span className="status-warning">
                      <FontAwesomeIcon icon={faExclamationTriangle} /> Partial
                    </span>
                  ) : (
                    <span className="status-danger">
                      <FontAwesomeIcon icon={faInfoCircle} /> Pending
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="investment-tips">
          <h4>
            <FontAwesomeIcon icon={faInfoCircle} />
            Investment Tips
          </h4>
          <ul>
            <li>You can still invest ₹5,000 under Section 80C to reach the maximum limit</li>
            <li>Consider investing in NPS for additional tax benefits under Section 80CCD</li>
            <li>Health insurance premium for parents can provide additional deduction under Section 80D</li>
          </ul>
        </div>
      </Card>

      {/* Previous Years */}
      <Card className="history-card" title="Previous Years Summary">
        <table className="history-table">
          <thead>
            <tr>
              <th>Financial Year</th>
              <th>Total Income</th>
              <th>Taxable Income</th>
              <th>Tax Paid</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>2023-24</td>
              <td>{formatCurrency(1250000)}</td>
              <td>{formatCurrency(1100000)}</td>
              <td>{formatCurrency(125000)}</td>
              <td><span className="status-success">Filed</span></td>
            </tr>
            <tr>
              <td>2022-23</td>
              <td>{formatCurrency(1180000)}</td>
              <td>{formatCurrency(1020000)}</td>
              <td>{formatCurrency(108000)}</td>
              <td><span className="status-success">Filed</span></td>
            </tr>
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default TaxDetails;