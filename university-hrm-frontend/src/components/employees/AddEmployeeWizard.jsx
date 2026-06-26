import React, { useState, useEffect, useMemo } from 'react';
import { employeesAPI, deptAPI } from '../../services/api';
import { toast, Btn, Input, Select, Spinner } from '../ui';
import Combobox from '../ui/Combobox';
import AsyncEmployeeSelect from '../ui/AsyncEmployeeSelect';
import { Shield, BookOpen, Users, User, Landmark, Monitor, Briefcase, ChevronRight, ChevronLeft, CheckCircle, Search, MapPin, Phone, ShieldAlert } from 'lucide-react';

const ROLES = [
  { id: 'SUPER_ADMIN', label: 'Super Admin', icon: <Shield size={24} />, desc: 'Full system access and control', cat: 'NON_TEACHING' },
  { id: 'DIRECTOR', label: 'Director', icon: <Landmark size={24} />, desc: 'Head of a department or institute', cat: 'NON_TEACHING' },
  { id: 'FACULTY', label: 'Faculty', icon: <BookOpen size={24} />, desc: 'Professors, lecturers, teaching staff', cat: 'TEACHING' },
  { id: 'HR_MANAGER', label: 'HR Manager', icon: <Users size={24} />, desc: 'Manages all HR operations', cat: 'NON_TEACHING' },
  { id: 'HR_STAFF', label: 'HR Staff', icon: <User size={24} />, desc: 'Recruitment and daily HR tasks', cat: 'NON_TEACHING' },
  { id: 'ACCOUNTANT', label: 'Accountant', icon: <Briefcase size={24} />, desc: 'Manages payroll and finances', cat: 'NON_TEACHING' },
  { id: 'STAFF', label: 'Support Staff', icon: <Monitor size={24} />, desc: 'IT, Admin, and office support', cat: 'NON_TEACHING' },
];

const TEACHING_DEPTS = ['Computer Science', 'Management', 'Commerce', 'Mathematics', 'Physics', 'English', 'Mechanical Engineering', 'Civil Engineering'];
const NON_TEACHING_DEPTS = ['Human Resources', 'Finance & Accounts', 'Admissions', 'Examination Cell', 'Library', 'IT Support', 'Administration'];

const DESIGNATIONS = {
  FACULTY: ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer'],
  DIRECTOR: ['Director'],
  HR_MANAGER: ['HR Manager'],
  HR_STAFF: ['HR Executive', 'Recruitment Executive'],
  ACCOUNTANT: ['Senior Accountant', 'Accountant', 'Accounts Assistant'],
  STAFF: ['Administrative Officer', 'Clerk', 'Office Assistant'],
  SUPER_ADMIN: ['System Administrator']
};

export default function AddEmployeeWizard({ open, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [departments, setDepartments] = useState([]);
  const [roleCounts, setRoleCounts] = useState({});
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [roleFilter, setRoleFilter] = useState('ALL');

  const [form, setForm] = useState({
    // Step 1: Role
    role: '',
    staff_category: '', // Auto-derived

    // Step 2: Personal
    first_name: '',
    last_name: '',
    phone: '',
    gender: '',
    date_of_birth: '',
    // Address
    street: '',
    city: '',
    state: '',
    country: '',
    pincode: '',
    // Emergency
    emergency_name: '',
    emergency_relation: '',
    emergency_phone: '',

    // Step 3: Account
    personal_email: '',
    email: '', // Work email, auto-derived initially

    // Step 4: Org
    department_id: '',
    designation: '',
    reporting_manager_id: '',
    join_date: '',
    employment_type: 'FULL_TIME',
    employee_id: '', // Auto-derived

    // Step 5: Compliance
    pan_number: '',
    uan_number: '',
    ifsc_code: '',
    bank_account_number: '',
    bank_name: ''
  });

  useEffect(() => {
    if (open) {
      loadDepts();
      loadRoleCounts();
      setStep(1);
      setForm({
        role: '', staff_category: '', first_name: '', last_name: '', phone: '', gender: '', date_of_birth: '', street: '', city: '', state: '', country: '', pincode: '', emergency_name: '', emergency_relation: '', emergency_phone: '', personal_email: '', email: '', department_id: '', designation: '', reporting_manager_id: '', join_date: new Date().toISOString().split('T')[0], employment_type: 'FULL_TIME', employee_id: '', pan_number: '', uan_number: '', ifsc_code: '', bank_account_number: '', bank_name: ''
      });
    }
  }, [open]);

  const loadDepts = async () => {
    setLoadingDepts(true);
    try {
      const res = await deptAPI.list();
      setDepartments(res.data?.data || res.data || []);
    } catch (e) {
      toast('Failed to load departments', 'error');
    } finally {
      setLoadingDepts(false);
    }
  };

  const loadRoleCounts = async () => {
    try {
      const counts = {};
      await Promise.all(
        ROLES.map(async (r) => {
          try {
            const res = await employeesAPI.list({ role: r.id, limit: 1 });
            counts[r.id] = res.data?.total || 0;
          } catch (e) {}
        })
      );
      setRoleCounts(counts);
    } catch (e) {
      console.error(e);
    }
  };

  // Derive Staff Category, Emp ID when Role changes
  useEffect(() => {
    if (form.role) {
      const roleObj = ROLES.find(r => r.id === form.role);
      const PREFIXES = { SUPER_ADMIN: 'UNI-AD-', HR_MANAGER: 'UNI-HR-', HR_STAFF: 'UNI-HRS-', DIRECTOR: 'UNI-DR-', FACULTY: 'UNI-FA-', STAFF: 'UNI-ST-', ACCOUNTANT: 'UNI-AC-' };
      setForm(prev => ({
        ...prev,
        staff_category: roleObj?.cat || 'NON_TEACHING',
        employee_id: `${PREFIXES[form.role] || 'UNI-EMP-'}AUTO`,
        designation: '', // Reset on role change
        department_id: '' // Reset on role change
      }));
    }
  }, [form.role]);

  // Derive Work Email when Name changes
  useEffect(() => {
    if (form.first_name && form.last_name && !form.email.includes('@') && step <= 3) {
      const genEmail = `${form.first_name.toLowerCase()}.${form.last_name.toLowerCase()}@university.edu`.replace(/\s+/g, '');
      setForm(prev => ({ ...prev, email: genEmail }));
    }
  }, [form.first_name, form.last_name, step]);

  const handleIfscBlur = async () => {
    if (form.ifsc_code && form.ifsc_code.length === 11) {
      try {
        const res = await fetch(`https://bank-apis.justinclicks.com/API/V1/IFSC/${form.ifsc_code}/`);
        if (res.ok) {
          const data = await res.json();
          setForm(p => ({ ...p, bank_name: `${data.BANK} - ${data.BRANCH}` }));
        } else {
          toast('Invalid IFSC Code', 'error');
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handlePincodeBlur = async () => {
    if (form.pincode && form.pincode.length === 6) {
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${form.pincode}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data[0] && data[0].Status === 'Success') {
            const postOffice = data[0].PostOffice[0];
            setForm(p => ({ 
              ...p, 
              city: p.city || postOffice.District, 
              state: p.state || postOffice.State, 
              country: p.country || 'India' 
            }));
            toast('City and State auto-filled', 'success');
          } else {
            toast('Invalid Pincode', 'warning');
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const validateStep = () => {
    if (step === 1) {
      if (!form.role) return toast('Please select a system role', 'warning');
      return true;
    }
    if (step === 2) {
      if (!form.first_name || !form.last_name) return toast('First and Last name are required', 'warning');
      return true;
    }
    if (step === 3) {
      if (!form.personal_email) return toast('Personal email is required', 'warning');
      if (!form.email) return toast('University email is required', 'warning');
      return true;
    }
    if (step === 4) {
      if (!form.department_id) return toast('Department is required', 'warning');
      if (!form.designation) return toast('Designation is required', 'warning');
      if (!form.join_date) return toast('Date of Joining is required', 'warning');
      if (new Date(form.join_date) > new Date()) return toast('Date of Joining cannot be in the future', 'warning');
      return true;
    }
    if (step === 5) {
      if (form.pan_number && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(form.pan_number)) return toast('Invalid PAN format', 'warning');
      if (form.uan_number && !/^[0-9]{12}$/.test(form.uan_number)) return toast('Invalid UAN format (must be 12 digits)', 'warning');
      return true;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep()) setStep(s => s + 1);
  };

  const prevStep = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setSubmitting(true);
    try {
      await employeesAPI.create({
        personal_email: form.personal_email,
        email: form.email,
        role: form.role,
        first_name: form.first_name,
        last_name: form.last_name,
        employee_id: form.employee_id,
        phone: form.phone || null,
        gender: form.gender || null,
        date_of_birth: form.date_of_birth || null,
        address: { 
          street: form.street || null, 
          city: form.city || null, 
          state: form.state || null, 
          country: form.country || null, 
          pincode: form.pincode || null 
        },
        emergency_contacts: form.emergency_name ? [{ name: form.emergency_name, relation: form.emergency_relation, phone: form.emergency_phone }] : [],
        financials: { 
          pan_number: form.pan_number || null, 
          uan_number: form.uan_number || null, 
          bank_account_number: form.bank_account_number || null, 
          ifsc_code: form.ifsc_code || null, 
          bank_name: form.bank_name || null 
        },
        employment: { department_id: form.department_id || null, designation: form.designation || null, employment_type: form.employment_type || null, staff_category: form.staff_category || null, join_date: form.join_date || null, reporting_manager_id: form.reporting_manager_id || null }
      });
      toast('Employee created successfully!', 'success');
      onSuccess();
    } catch (e) {
      toast(e.response?.data?.detail || 'Failed to create employee', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredDepartments = useMemo(() => {
    if (form.staff_category === 'TEACHING') {
      return departments.filter(d => TEACHING_DEPTS.some(t => d.name.toLowerCase().includes(t.toLowerCase())));
    } else {
      return departments.filter(d => NON_TEACHING_DEPTS.some(t => d.name.toLowerCase().includes(t.toLowerCase())));
    }
  }, [departments, form.staff_category]);

  const deptOptions = [
    {
      label: form.staff_category === 'TEACHING' ? 'Teaching Departments' : 'Non-Teaching Departments',
      options: filteredDepartments.map(d => ({ value: d.id, label: d.name }))
    }
  ];

  const desigOptions = (DESIGNATIONS[form.role] || []).map(d => ({ value: d, label: d }));

  if (!open) return null;

  const STEPS = [
    { num: 1, title: 'Role' },
    { num: 2, title: 'Personal Info' },
    { num: 3, title: 'Account' },
    { num: 4, title: 'Organization' },
    { num: 5, title: 'Compliance' },
    { num: 6, title: 'Review' }
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '1100px', height: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', animation: 'fadeInScale 0.2s ease-out', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--gray-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#0f172a' }}>Onboard New Employee</h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--gray-500)' }}>Complete the guided setup to add a new team member</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: 'var(--gray-400)' }}>&times;</button>
        </div>

        {/* Body Layout */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          
          {/* Left Sidebar - Progress */}
          <div style={{ width: '260px', background: '#f8fafc', borderRight: '1px solid var(--gray-200)', padding: '32px 24px', overflowY: 'auto' }}>
            {STEPS.map((s, i) => {
              const isActive = step === s.num;
              const isPast = step > s.num;
              return (
                <div key={s.num} style={{ display: 'flex', gap: 16, marginBottom: 28, position: 'relative' }}>
                  {i !== STEPS.length - 1 && (
                    <div style={{ position: 'absolute', top: 32, left: 15, bottom: -20, width: 2, background: isPast ? 'var(--primary)' : 'var(--gray-200)', zIndex: 1 }} />
                  )}
                  <div style={{ 
                    width: 32, height: 32, borderRadius: '50%', background: isActive ? 'var(--primary)' : isPast ? 'var(--primary)' : '#fff', border: `2px solid ${isActive || isPast ? 'var(--primary)' : 'var(--gray-300)'}`, color: isActive || isPast ? '#fff' : 'var(--gray-400)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, zIndex: 2 
                  }}>
                    {isPast ? <CheckCircle size={16} /> : s.num}
                  </div>
                  <div style={{ paddingTop: 6 }}>
                    <div style={{ fontSize: 14, fontWeight: isActive ? 600 : 500, color: isActive ? 'var(--primary)' : isPast ? '#0f172a' : 'var(--gray-400)' }}>{s.title}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Content Area */}
          <div style={{ flex: 1, padding: '40px', overflowY: 'auto', background: '#fff' }}>
            
            {/* STEP 1: ROLE */}
            {step === 1 && (
              <div style={{ animation: 'fadeIn 0.3s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <h3 style={{ fontSize: 18, color: '#0f172a', margin: 0 }}>Select System Role</h3>
                  <div style={{ display: 'flex', gap: 8, background: 'var(--gray-100)', padding: 4, borderRadius: 8 }}>
                    {['ALL', 'TEACHING', 'NON_TEACHING'].map(f => (
                      <button 
                        key={f} 
                        onClick={() => setRoleFilter(f)} 
                        style={{ padding: '6px 12px', fontSize: 12, fontWeight: 600, borderRadius: 6, border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: roleFilter === f ? '#fff' : 'transparent', color: roleFilter === f ? 'var(--primary)' : 'var(--gray-500)', boxShadow: roleFilter === f ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
                      >
                        {f.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                  {ROLES.filter(r => roleFilter === 'ALL' || r.cat === roleFilter).map(r => (
                    <div 
                      key={r.id} 
                      onClick={() => setForm({ ...form, role: r.id })}
                      style={{ 
                        border: `2px solid ${form.role === r.id ? 'var(--primary)' : 'var(--gray-200)'}`, 
                        borderRadius: 12, padding: 20, cursor: 'pointer', transition: 'all 0.2s',
                        background: form.role === r.id ? '#f0f5ff' : '#fff'
                      }}
                    >
                      <div style={{ color: form.role === r.id ? 'var(--primary)' : 'var(--gray-500)', marginBottom: 12 }}>{r.icon}</div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>{r.label}</div>
                      <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>{r.desc}</div>
                      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'inline-block', fontSize: 11, padding: '2px 8px', background: 'var(--gray-100)', borderRadius: 4, color: 'var(--gray-600)', fontWeight: 500 }}>
                          {r.cat.replace('_', ' ')}
                        </div>
                        {roleCounts[r.id] !== undefined && (
                          <div style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>
                            {roleCounts[r.id]} {roleCounts[r.id] === 1 ? 'employee' : 'employees'}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 2: PERSONAL */}
            {step === 2 && (
              <div style={{ animation: 'fadeIn 0.3s', maxWidth: 600 }}>
                <h3 style={{ fontSize: 18, marginBottom: 24, color: '#0f172a' }}>Personal Details</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <Input label="First Name" value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} required />
                  <Input label="Last Name" value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} required />
                  <Input label="Mobile Number" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                  <Input label="Date of Birth" type="date" value={form.date_of_birth} onChange={e => setForm({...form, date_of_birth: e.target.value})} />
                  <Select label="Gender" value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}>
                    <option value="">Select...</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                    <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                  </Select>
                </div>

                <h4 style={{ fontSize: 15, marginTop: 32, marginBottom: 16, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}><MapPin size={16}/> Address</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <Input label="Pincode" value={form.pincode} onBlur={handlePincodeBlur} onChange={e => setForm({...form, pincode: e.target.value})} placeholder="Enter pincode to auto-fill" />
                  <Input label="Street Address" style={{ gridColumn: 'span 2' }} value={form.street} onChange={e => setForm({...form, street: e.target.value})} />
                  <Input label="City" value={form.city} onChange={e => setForm({...form, city: e.target.value})} disabled />
                  <Input label="State" value={form.state} onChange={e => setForm({...form, state: e.target.value})} disabled />
                  <Input label="Country" value={form.country} onChange={e => setForm({...form, country: e.target.value})} disabled />
                </div>

                <h4 style={{ fontSize: 15, marginTop: 32, marginBottom: 16, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}><ShieldAlert size={16}/> Emergency Contact</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <Input label="Contact Name" value={form.emergency_name} onChange={e => setForm({...form, emergency_name: e.target.value})} />
                  <Input label="Relationship" value={form.emergency_relation} onChange={e => setForm({...form, emergency_relation: e.target.value})} />
                  <Input label="Contact Phone" value={form.emergency_phone} onChange={e => setForm({...form, emergency_phone: e.target.value})} />
                </div>
              </div>
            )}

            {/* STEP 3: ACCOUNT */}
            {step === 3 && (
              <div style={{ animation: 'fadeIn 0.3s', maxWidth: 500 }}>
                <h3 style={{ fontSize: 18, marginBottom: 24, color: '#0f172a' }}>Account Information</h3>
                
                <Input 
                  label="Personal Email" 
                  type="email" 
                  value={form.personal_email} 
                  onChange={e => setForm({...form, personal_email: e.target.value})} 
                  required 
                  placeholder="name@gmail.com"
                />
                <p style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: -8, marginBottom: 24 }}>Initial credentials will be sent to this address.</p>

                <div style={{ background: '#f8fafc', padding: 20, borderRadius: 12, border: '1px solid var(--gray-200)' }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-light)', marginBottom: 5 }}>University Email (Auto-generated)</label>
                  <Input 
                    value={form.email} 
                    onChange={e => setForm({...form, email: e.target.value})} 
                    required 
                    style={{ marginBottom: 0 }}
                  />
                  <p style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 8, marginBottom: 0 }}>You can modify this if there is a conflict.</p>
                </div>
              </div>
            )}

            {/* STEP 4: ORG */}
            {step === 4 && (
              <div style={{ animation: 'fadeIn 0.3s', maxWidth: 600 }}>
                <h3 style={{ fontSize: 18, marginBottom: 24, color: '#0f172a' }}>Organizational Details</h3>
                
                <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                  <div style={{ flex: 1, background: '#f8fafc', padding: '12px 16px', borderRadius: 8, border: '1px solid var(--gray-200)' }}>
                    <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 4 }}>Staff Category</div>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{form.staff_category.replace('_', ' ')}</div>
                  </div>
                  <div style={{ flex: 1, background: '#f8fafc', padding: '12px 16px', borderRadius: 8, border: '1px solid var(--gray-200)' }}>
                    <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 4 }}>Employee ID</div>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{form.employee_id}</div>
                  </div>
                </div>

                {loadingDepts ? (
                  <div style={{ padding: 20, textAlign: 'center' }}><Spinner /></div>
                ) : (
                  <>
                    <Combobox 
                      label="Department" 
                      options={deptOptions} 
                      value={form.department_id} 
                      onChange={v => setForm({...form, department_id: v})} 
                      required 
                      placeholder="Search departments..."
                    />
                    {filteredDepartments.length === 0 && (
                      <div style={{ fontSize: 12, color: 'var(--warning)', marginTop: -10, marginBottom: 14 }}>
                        No {form.staff_category.replace('_', ' ').toLowerCase()} departments found. 
                      </div>
                    )}
                  </>
                )}

                <Combobox 
                  label="Designation" 
                  options={desigOptions} 
                  value={form.designation} 
                  onChange={v => setForm({...form, designation: v})} 
                  required 
                  placeholder="Select designation..."
                />

                <AsyncEmployeeSelect 
                  label="Reporting Manager" 
                  value={form.reporting_manager_id} 
                  onChange={v => setForm({...form, reporting_manager_id: v})} 
                  placeholder="Search by name or email..."
                  roleFilter="DIRECTOR,HR_MANAGER,SUPER_ADMIN"
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                  <Input 
                    label="Date of Joining" 
                    type="date" 
                    value={form.join_date} 
                    onChange={e => setForm({...form, join_date: e.target.value})} 
                    required 
                  />
                  <Select 
                    label="Employment Type" 
                    value={form.employment_type} 
                    onChange={e => setForm({...form, employment_type: e.target.value})}
                  >
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="VISITING">Visiting</option>
                  </Select>
                </div>
              </div>
            )}

            {/* STEP 5: COMPLIANCE */}
            {step === 5 && (
              <div style={{ animation: 'fadeIn 0.3s', maxWidth: 600 }}>
                <h3 style={{ fontSize: 18, marginBottom: 24, color: '#0f172a' }}>Compliance & Banking</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <Input 
                    label="PAN Number" 
                    value={form.pan_number} 
                    onChange={e => setForm({...form, pan_number: e.target.value.toUpperCase()})} 
                    placeholder="ABCDE1234F"
                  />
                  <Input 
                    label="UAN Number" 
                    value={form.uan_number} 
                    onChange={e => setForm({...form, uan_number: e.target.value})} 
                    placeholder="12 digit UAN"
                  />
                </div>

                <div style={{ height: 1, background: 'var(--gray-200)', margin: '24px 0' }} />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <Input 
                      label="IFSC Code" 
                      value={form.ifsc_code} 
                      onChange={e => setForm({...form, ifsc_code: e.target.value.toUpperCase()})} 
                      onBlur={handleIfscBlur}
                      placeholder="e.g. SBIN0001234"
                    />
                    <Input 
                      label="Bank Name (Auto-fetched)" 
                      value={form.bank_name} 
                      readOnly 
                      style={{ background: '#f8fafc', color: 'var(--gray-500)' }}
                    />
                  </div>
                  <Input 
                    label="Bank Account Number" 
                    value={form.bank_account_number} 
                    onChange={e => setForm({...form, bank_account_number: e.target.value})} 
                  />
                </div>
              </div>
            )}

            {/* STEP 6: REVIEW */}
            {step === 6 && (
              <div style={{ animation: 'fadeIn 0.3s' }}>
                <h3 style={{ fontSize: 18, marginBottom: 24, color: '#0f172a' }}>Review & Submit</h3>
                
                <div style={{ background: '#f8fafc', borderRadius: 12, border: '1px solid var(--gray-200)', padding: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                  <div>
                    <h4 style={{ fontSize: 14, textTransform: 'uppercase', color: 'var(--gray-500)', letterSpacing: '0.05em', marginBottom: 12, borderBottom: '1px solid var(--gray-200)', paddingBottom: 8 }}>Profile Details</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px 16px', fontSize: 14 }}>
                      <span style={{ color: 'var(--gray-500)' }}>Name:</span> <span style={{ fontWeight: 500 }}>{form.first_name} {form.last_name}</span>
                      <span style={{ color: 'var(--gray-500)' }}>Role:</span> <span style={{ fontWeight: 500 }}>{ROLES.find(r => r.id === form.role)?.label}</span>
                      <span style={{ color: 'var(--gray-500)' }}>Personal Email:</span> <span style={{ fontWeight: 500 }}>{form.personal_email}</span>
                      <span style={{ color: 'var(--gray-500)' }}>Uni Email:</span> <span style={{ fontWeight: 500 }}>{form.email}</span>
                    </div>
                  </div>
                  <div>
                    <h4 style={{ fontSize: 14, textTransform: 'uppercase', color: 'var(--gray-500)', letterSpacing: '0.05em', marginBottom: 12, borderBottom: '1px solid var(--gray-200)', paddingBottom: 8 }}>Employment Details</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px 16px', fontSize: 14 }}>
                      <span style={{ color: 'var(--gray-500)' }}>Department:</span> <span style={{ fontWeight: 500 }}>{departments.find(d => d.id === form.department_id)?.name}</span>
                      <span style={{ color: 'var(--gray-500)' }}>Designation:</span> <span style={{ fontWeight: 500 }}>{form.designation}</span>
                      <span style={{ color: 'var(--gray-500)' }}>Category:</span> <span style={{ fontWeight: 500 }}>{form.staff_category.replace('_', ' ')}</span>
                      <span style={{ color: 'var(--gray-500)' }}>Joining Date:</span> <span style={{ fontWeight: 500 }}>{form.join_date}</span>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 24, padding: 16, background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 8, display: 'flex', gap: 12, color: 'var(--success)' }}>
                  <CheckCircle size={20} />
                  <div style={{ fontSize: 14 }}>Upon submission, the system will generate the employee record and email the initial login credentials to <strong>{form.personal_email}</strong>.</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ padding: '20px 24px', borderTop: '1px solid var(--gray-200)', display: 'flex', justifyContent: 'space-between', background: '#fff' }}>
          <Btn variant="secondary" onClick={step === 1 ? onClose : prevStep} style={{ width: 100 }}>
            {step === 1 ? 'Cancel' : 'Back'}
          </Btn>
          
          {step < 6 ? (
            <Btn variant="primary" onClick={nextStep} style={{ width: 140 }}>
              Continue <ChevronRight size={16} />
            </Btn>
          ) : (
            <Btn variant="primary" onClick={handleSubmit} loading={submitting} style={{ width: 160 }}>
              Submit & Onboard
            </Btn>
          )}
        </div>
      </div>
    </div>
  );
}
