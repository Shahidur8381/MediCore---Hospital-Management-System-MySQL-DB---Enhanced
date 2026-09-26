'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { FullPageSpinner } from '@/components/LoadingSpinner';
import { DashboardShell } from '@/components/shell';
import { AdminElevationModal } from '@/components/admin/AdminElevationModal';
import {
  Card, CardHeader, CardTitle, CardContent, Button, Modal, Table,
  TableHeader, TableBody, TableRow, TableHead, TableCell, Badge, EmptyState
} from '@/components/ui';
import {
  Users, Building2, Plus, Trash2, Pencil, Banknote, ShieldAlert,
  Activity, ArrowUpRight, TrendingUp, CheckCircle2, Clock, 
  TestTubes, FileText, Search, Filter, ShieldCheck, RefreshCw
} from 'lucide-react';

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [departments, setDepartments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [stats, setStats] = useState({ departments: 0, doctors: 0, patients: 0 });
  const [financialSummary, setFinancialSummary] = useState({ TOTAL_ADMIN_EARNINGS: 0, TOTAL_DOCTOR_EARNINGS: 0, TOTAL_REVENUE: 0 });
  const [adminFinanceStats, setAdminFinanceStats] = useState({ totalRevenue: 0, hospitalEarned: 0, paymentToClear: 0 });
  const [pendingWithdrawals, setPendingWithdrawals] = useState<any[]>([]);
  const [ledger, setLedger] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [labRecords, setLabRecords] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Navigation Tabs: 'overview' | 'departments' | 'doctors' | 'financial' | 'audit'
  const [activeTab, setActiveTab] = useState<'overview' | 'departments' | 'doctors' | 'financial' | 'audit'>('overview');
  const [dataLoading, setDataLoading] = useState(true);
  const [clearing, setClearing] = useState<string | null>(null);

  // Audit Log Filter States
  const [auditFilterType, setAuditFilterType] = useState<string>('ALL');
  const [auditFilterStatus, setAuditFilterStatus] = useState<string>('ALL');
  const [auditSearchQuery, setAuditSearchQuery] = useState<string>('');

  // Modal states
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [showEditDeptModal, setShowEditDeptModal] = useState(false);
  const [showEditDocModal, setShowEditDocModal] = useState(false);

  const [deptForm, setDeptForm] = useState({ name: '', head: '' });
  const [docForm, setDocForm] = useState({
    username: '', password: '', departmentId: '', name: '', gender: 'Male',
    dob: '', specialization: '', qualification: '', phone: '', email: '', fee: ''
  });
  const [editDeptForm, setEditDeptForm] = useState({ id: 0, name: '', head: '' });
  const [editDocForm, setEditDocForm] = useState({
    id: 0, departmentId: '', name: '', gender: 'Male', dob: '',
    specialization: '', qualification: '', phone: '', email: '', fee: '', status: 'Active'
  });
  const [modalLoading, setModalLoading] = useState(false);
  const [showElevationModal, setShowElevationModal] = useState(false);

  useEffect(() => {
    // Show elevation modal if user is guest admin and hasn't dismissed it
    if (user?.role === 'Admin' && user?.isGuestAdmin) {
      const dismissed = sessionStorage.getItem('hideElevationModal');
      if (!dismissed) {
        setShowElevationModal(true);
      }
    }
  }, [user]);

  const handleCloseElevationModal = () => {
    sessionStorage.setItem('hideElevationModal', 'true');
    setShowElevationModal(false);
  };

  const fetchData = useCallback(async () => {
    setDataLoading(true);
    try {
      const [
        deptRes, docRes, statsRes, finSummaryRes, 
        ledgerRes, adminFinRes, pendingRes, 
        aptRes, labRecRes, auditRes
      ] = await Promise.all([
        api.get('/api/departments'),
        api.get('/api/doctors'),
        api.get('/api/stats'),
        api.get('/api/financial/summary'),
        api.get('/api/financial/ledger'),
        api.get('/api/finance/admin-stats').catch(() => ({ data: { totalRevenue: 0, hospitalEarned: 0, paymentToClear: 0 } })),
        api.get('/api/finance/pending-withdrawals').catch(() => ({ data: [] })),
        api.get('/api/appointments').catch(() => ({ data: [] })),
        api.get('/api/lab/records').catch(() => ({ data: [] })),
        api.get('/api/financial/audit-logs').catch(() => ({ data: [] }))
      ]);

      setDepartments(deptRes.data || []);
      setDoctors(docRes.data || []);
      setStats(statsRes.data || { departments: 0, doctors: 0, patients: 0 });
      setFinancialSummary(finSummaryRes.data || { TOTAL_ADMIN_EARNINGS: 0, TOTAL_DOCTOR_EARNINGS: 0, TOTAL_REVENUE: 0 });
      setLedger(ledgerRes.data || []);
      setAdminFinanceStats(adminFinRes.data || { totalRevenue: 0, hospitalEarned: 0, paymentToClear: 0 });
      setPendingWithdrawals(pendingRes.data || []);
      setAppointments(aptRes.data || []);
      setLabRecords(labRecRes.data || []);
      setAuditLogs(auditRes.data || []);
    } catch (err) {
      console.error('Error fetching admin data', err);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'Admin')) {
      router.push('/login');
    }
    if (user?.role === 'Admin') {
      fetchData();
    }
  }, [user, loading, router, fetchData]);

  // ===== Analytics Computations =====
  const analytics = useMemo(() => {
    // 1. Appointment status stats
    const aptStatusCount: Record<string, number> = {
      Completed: 0,
      Confirmed: 0,
      Pending: 0,
      Waiting: 0,
      Cancelled: 0
    };
    appointments.forEach((a) => {
      const s = a.STATUS || 'Pending';
      aptStatusCount[s] = (aptStatusCount[s] || 0) + 1;
    });

    // 2. Department loads
    const deptLoad: Record<string, { doctorCount: number; aptCount: number }> = {};
    departments.forEach((d) => {
      deptLoad[d.DEPARTMENT_NAME] = { doctorCount: 0, aptCount: 0 };
    });
    doctors.forEach((doc) => {
      const dName = doc.DEPARTMENT_NAME || 'General';
      if (!deptLoad[dName]) deptLoad[dName] = { doctorCount: 0, aptCount: 0 };
      deptLoad[dName].doctorCount += 1;
    });
    appointments.forEach((apt) => {
      const dName = apt.DEPARTMENT_NAME || 'General';
      if (!deptLoad[dName]) deptLoad[dName] = { doctorCount: 0, aptCount: 0 };
      deptLoad[dName].aptCount += 1;
    });

    // 3. Lab Test popularity
    const labPopularity: Record<string, number> = {};
    labRecords.forEach((lr) => {
      const tName = lr.TEST_NAME || 'Diagnostic';
      labPopularity[tName] = (labPopularity[tName] || 0) + 1;
    });
    const sortedLabPopularity = Object.entries(labPopularity)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 4. Revenue breakdown
    let appointmentRevenue = 0;
    let labRevenue = 0;
    ledger.forEach((item) => {
      const amt = parseFloat(item.TOTAL_AMOUNT || 0);
      if (item.TRANSACTION_TYPE === 'Appointment') appointmentRevenue += amt;
      else if (item.TRANSACTION_TYPE === 'Lab Test') labRevenue += amt;
    });

    return {
      aptStatusCount,
      deptLoad: Object.entries(deptLoad).map(([name, data]) => ({ name, ...data })),
      sortedLabPopularity,
      appointmentRevenue,
      labRevenue
    };
  }, [appointments, departments, doctors, labRecords, ledger]);

  // Filtered Audit Logs
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (auditFilterType !== 'ALL' && !log.action.toLowerCase().includes(auditFilterType.toLowerCase())) {
        return false;
      }
      if (auditFilterStatus !== 'ALL' && log.status !== auditFilterStatus) {
        return false;
      }
      if (auditSearchQuery.trim()) {
        const q = auditSearchQuery.toLowerCase();
        const matchesUser = log.user_name?.toLowerCase().includes(q);
        const matchesDoctor = log.doctor_name?.toLowerCase().includes(q);
        const matchesEntity = log.entity?.toLowerCase().includes(q);
        if (!matchesUser && !matchesDoctor && !matchesEntity) return false;
      }
      return true;
    });
  }, [auditLogs, auditFilterType, auditFilterStatus, auditSearchQuery]);

  // Cleared withdrawals list
  const clearedWithdrawals = useMemo(() => {
    return ledger.filter((l) => l.IS_CLEARED === 'Y');
  }, [ledger]);

  // ===== Department CRUD =====
  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      await api.post('/api/departments', deptForm);
      toast('Department created successfully', 'success');
      setShowDeptModal(false);
      setDeptForm({ name: '', head: '' });
      fetchData();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to create department', 'error');
    } finally { setModalLoading(false); }
  };

  const openEditDept = (dept: any) => {
    setEditDeptForm({ id: dept.DEPARTMENT_ID, name: dept.DEPARTMENT_NAME, head: dept.DEPARTMENT_HEAD || '' });
    setShowEditDeptModal(true);
  };

  const handleUpdateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      await api.put(`/api/departments/${editDeptForm.id}`, { name: editDeptForm.name, head: editDeptForm.head });
      toast('Department updated', 'success');
      setShowEditDeptModal(false);
      fetchData();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to update', 'error');
    } finally { setModalLoading(false); }
  };

  const handleDeleteDept = async (id: number) => {
    if (!confirm('Are you sure you want to delete this department?')) return;
    try {
      await api.delete(`/api/departments/${id}`);
      toast('Department deleted', 'success');
      fetchData();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to delete department', 'error');
    }
  };

  // ===== Doctor CRUD =====
  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      await api.post('/api/auth/register-doctor', docForm);
      toast('Doctor registered successfully', 'success');
      setShowDocModal(false);
      setDocForm({ username: '', password: '', departmentId: '', name: '', gender: 'Male', dob: '', specialization: '', qualification: '', phone: '', email: '', fee: '' });
      fetchData();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to register doctor', 'error');
    } finally { setModalLoading(false); }
  };

  const openEditDoc = (doc: any) => {
    const rawDob = doc.DATE_OF_BIRTH;
    let dob = '';
    if (rawDob) {
      const d = new Date(rawDob);
      dob = d.toISOString().split('T')[0];
    }
    setEditDocForm({
      id: doc.DOCTOR_ID,
      departmentId: String(doc.DEPARTMENT_ID || ''),
      name: doc.NAME || '',
      gender: doc.GENDER || 'Male',
      dob,
      specialization: doc.SPECIALIZATION || '',
      qualification: doc.QUALIFICATION || '',
      phone: doc.PHONE || '',
      email: doc.EMAIL || '',
      fee: String(doc.CONSULTATION_FEE || ''),
      status: doc.STATUS || 'Active'
    });
    setShowEditDocModal(true);
  };

  const handleUpdateDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      await api.put(`/api/doctors/${editDocForm.id}`, editDocForm);
      toast('Doctor updated successfully', 'success');
      setShowEditDocModal(false);
      fetchData();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to update doctor', 'error');
    } finally { setModalLoading(false); }
  };

  const handleClearPayment = async (doctorId: number) => {
    try {
      setClearing(String(doctorId));
      await api.post(`/api/finance/clear-withdrawal/${doctorId}`);
      toast('Doctor withdrawal payout marked as Cleared', 'success');
      fetchData();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to clear payment', 'error');
    } finally {
      setClearing(null);
    }
  };

  if (loading || !user) return <FullPageSpinner />;

  const inputCls = "w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all";

  return (
    <DashboardShell>
      <AdminElevationModal 
        isOpen={showElevationModal} 
        onClose={handleCloseElevationModal} 
      />
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Hospital Administration & Analytics
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Realtime clinical metrics, department workloads, financial ledger, and system audit trail.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-center w-full md:w-auto">
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw size={14} className={dataLoading ? 'animate-spin' : ''} />}
            onClick={() => fetchData()}
          >
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={<Plus size={15} />}
            onClick={() => setShowDeptModal(true)}
          >
            Add Department
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={15} />}
            onClick={() => setShowDocModal(true)}
          >
            Register Doctor
          </Button>
        </div>
      </div>

      {/* Navigation Pills */}
      <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 bg-slate-100 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 mb-6 sm:mb-8 overflow-x-auto custom-scrollbar">
        {[
          { id: 'overview', label: 'Analytics & Insights', icon: Activity },
          { id: 'departments', label: 'Departments', icon: Building2, count: departments.length },
          { id: 'doctors', label: 'Doctors', icon: Users, count: doctors.length },
          { id: 'financial', label: 'Financials & Payouts', icon: Banknote, count: pendingWithdrawals.length },
          { id: 'audit', label: 'System Audit Logs', icon: ShieldCheck, count: auditLogs.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <tab.icon size={15} />
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW & ADVANCED ANALYTICS */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-fade-in">
          {/* Main Stat KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <Building2 size={22} />
                  </div>
                  <Badge variant="primary" size="sm">Depts</Badge>
                </div>
                <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                  {dataLoading ? '—' : stats.departments}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Clinical Departments</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <Users size={22} />
                  </div>
                  <Badge variant="purple" size="sm">Staff</Badge>
                </div>
                <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                  {dataLoading ? '—' : stats.doctors}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Active Medical Doctors</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <Users size={22} />
                  </div>
                  <Badge variant="success" size="sm">Patients</Badge>
                </div>
                <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                  {dataLoading ? '—' : stats.patients}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Registered Patients</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
                    <Banknote size={22} />
                  </div>
                  <Badge variant="warning" size="sm">Revenue</Badge>
                </div>
                <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                  {dataLoading ? '—' : `৳${financialSummary.TOTAL_REVENUE || 0}`}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Total System Revenue</p>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Breakdown & Trends */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp size={16} className="text-blue-500" />
                  Revenue Trends & Financial Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Visual Ratio Bars */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-2">
                    <span className="text-slate-600 dark:text-slate-300">
                      Appointments (৳{analytics.appointmentRevenue})
                    </span>
                    <span className="text-slate-600 dark:text-slate-300">
                      Lab Tests (৳{analytics.labRevenue})
                    </span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                    <div 
                      className="bg-blue-600 transition-all duration-500" 
                      style={{ 
                        width: `${
                          (analytics.appointmentRevenue + analytics.labRevenue) > 0 
                            ? (analytics.appointmentRevenue / (analytics.appointmentRevenue + analytics.labRevenue)) * 100 
                            : 50
                        }%` 
                      }} 
                    />
                    <div 
                      className="bg-amber-500 transition-all duration-500" 
                      style={{ 
                        width: `${
                          (analytics.appointmentRevenue + analytics.labRevenue) > 0 
                            ? (analytics.labRevenue / (analytics.appointmentRevenue + analytics.labRevenue)) * 100 
                            : 50
                        }%` 
                      }} 
                    />
                  </div>
                </div>

                {/* Key Revenue Splits */}
                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[11px] font-bold text-slate-400 block mb-1">Hospital Share (20%)</span>
                    <span className="text-lg font-black text-blue-600 dark:text-blue-400">৳{adminFinanceStats.hospitalEarned}</span>
                  </div>
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[11px] font-bold text-slate-400 block mb-1">Doctor Earnings (80%)</span>
                    <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">৳{financialSummary.TOTAL_DOCTOR_EARNINGS || 0}</span>
                  </div>
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[11px] font-bold text-slate-400 block mb-1">Pending Payouts</span>
                    <span className="text-lg font-black text-amber-600 dark:text-amber-400">৳{adminFinanceStats.paymentToClear}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Appointment Consultation Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock size={16} className="text-indigo-500" />
                  Appointment Status Mix
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(analytics.aptStatusCount).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 dark:border-slate-800/60 last:border-0">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{status}</span>
                    <span className="font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                      {count}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Department Load & Lab Popularity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Department Load Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 size={16} className="text-blue-500" />
                  Department Workload & Staffing
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Department</TableHead>
                      <TableHead className="text-center">Physicians</TableHead>
                      <TableHead className="text-right">Consultations</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.deptLoad.map((d) => (
                      <TableRow key={d.name}>
                        <TableCell className="font-bold text-slate-800 dark:text-slate-200">{d.name}</TableCell>
                        <TableCell className="text-center text-xs font-semibold">{d.doctorCount}</TableCell>
                        <TableCell className="text-right text-xs font-bold text-blue-600 dark:text-blue-400">{d.aptCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Diagnostic Lab Popularity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TestTubes size={16} className="text-cyan-500" />
                  Most Prescribed Lab Investigations
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Test Name</TableHead>
                      <TableHead className="text-right">Orders Recorded</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.sortedLabPopularity.map((lp, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium text-slate-800 dark:text-slate-200 text-xs">
                          {lp.name}
                        </TableCell>
                        <TableCell className="text-right font-bold text-xs text-amber-600">
                          {lp.count} times
                        </TableCell>
                      </TableRow>
                    ))}
                    {analytics.sortedLabPopularity.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center py-6 text-xs text-slate-400">
                          No lab tests recorded yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: DEPARTMENTS */}
      {activeTab === 'departments' && (
        <Card className="animate-fade-in overflow-hidden">
          <CardHeader action={
            <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => setShowDeptModal(true)}>
              Add Department
            </Button>
          }>
            <CardTitle>Departments Directory</CardTitle>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Department Name</TableHead>
                <TableHead>Department Head</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((dept) => (
                <TableRow key={dept.DEPARTMENT_ID}>
                  <TableCell className="font-mono text-xs text-slate-400">#{dept.DEPARTMENT_ID}</TableCell>
                  <TableCell className="font-bold text-slate-800 dark:text-slate-200">{dept.DEPARTMENT_NAME}</TableCell>
                  <TableCell className="text-slate-600 dark:text-slate-400">{dept.DEPARTMENT_HEAD || '—'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEditDept(dept)} aria-label="Edit department">
                        <Pencil size={15} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteDept(dept.DEPARTMENT_ID)} aria-label="Delete department" className="text-rose-500 hover:text-rose-700">
                        <Trash2 size={15} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {departments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-slate-400">
                    No departments created yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* TAB 3: DOCTORS */}
      {activeTab === 'doctors' && (
        <Card className="animate-fade-in overflow-hidden">
          <CardHeader action={
            <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => setShowDocModal(true)}>
              Register Doctor
            </Button>
          }>
            <CardTitle>Doctors Directory</CardTitle>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Doctor</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Specialization</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Fee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {doctors.map((doc) => (
                <TableRow key={doc.DOCTOR_ID}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0">
                        {doc.NAME?.[0]}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200">{doc.NAME}</p>
                        <p className="text-xs text-slate-400">{doc.QUALIFICATION}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="primary" size="sm">{doc.DEPARTMENT_NAME || 'Unassigned'}</Badge>
                  </TableCell>
                  <TableCell className="text-slate-600 dark:text-slate-400">{doc.SPECIALIZATION}</TableCell>
                  <TableCell>
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{doc.PHONE}</p>
                    <p className="text-[11px] text-slate-400">{doc.EMAIL}</p>
                  </TableCell>
                  <TableCell className="font-semibold text-slate-800 dark:text-slate-200">৳{doc.CONSULTATION_FEE}</TableCell>
                  <TableCell>
                    <Badge variant={doc.STATUS === 'Active' ? 'success' : 'default'} size="sm">
                      {doc.STATUS || 'Active'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEditDoc(doc)} aria-label="Edit doctor">
                      <Pencil size={15} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {doctors.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-400">
                    No doctors registered yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* TAB 4: FINANCIALS & DOCTOR WITHDRAWALS */}
      {activeTab === 'financial' && (
        <div className="space-y-8 animate-fade-in">
          {/* Revenue Breakdown Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <Card>
              <CardContent className="p-6">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Total System Revenue</p>
                <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">৳{adminFinanceStats.totalRevenue || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-500 mb-1">Hospital (Admin) Retained</p>
                <p className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">৳{adminFinanceStats.hospitalEarned || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-500 mb-1">Pending Doctor Withdrawals</p>
                <p className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">৳{adminFinanceStats.paymentToClear || 0}</p>
              </CardContent>
            </Card>
          </div>

          {/* Pending Doctor Withdrawals Action Panel */}
          <Card className="border-amber-200 dark:border-amber-900/60 overflow-hidden">
            <CardHeader className="bg-amber-50/50 dark:bg-amber-950/20 border-b border-amber-100 dark:border-amber-900/40">
              <CardTitle className="text-base flex items-center gap-2 text-amber-900 dark:text-amber-200">
                <Banknote size={18} className="text-amber-600" />
                <span>Pending Doctor Withdrawal Payouts ({pendingWithdrawals.length})</span>
              </CardTitle>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Doctor Name</TableHead>
                  <TableHead>Pending Payout</TableHead>
                  <TableHead>Oldest Transaction</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingWithdrawals.map((req) => (
                  <TableRow key={req.DOCTOR_ID}>
                    <TableCell className="font-bold text-slate-800 dark:text-slate-200">{req.DOCTOR_NAME}</TableCell>
                    <TableCell className="font-extrabold text-amber-600 text-base">৳{req.PENDING_AMOUNT}</TableCell>
                    <TableCell className="text-xs text-slate-500">{new Date(req.OLDEST_TRANSACTION).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="primary"
                        size="sm"
                        loading={clearing === String(req.DOCTOR_ID)}
                        disabled={clearing === String(req.DOCTOR_ID)}
                        onClick={() => handleClearPayment(req.DOCTOR_ID)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <CheckCircle2 size={14} className="mr-1" />
                        Clear Payout
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {pendingWithdrawals.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10 text-slate-400 text-sm">
                      No pending withdrawal requests at this time. All doctor balances are up to date.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>

          {/* Cleared Withdrawals Log */}
          {clearedWithdrawals.length > 0 && (
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  <span>Cleared Payout History ({clearedWithdrawals.length})</span>
                </CardTitle>
              </CardHeader>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ledger Ref</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount Cleared</TableHead>
                    <TableHead>Date Cleared</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clearedWithdrawals.slice(0, 5).map((cw) => (
                    <TableRow key={cw.LEDGER_ID}>
                      <TableCell className="font-mono text-xs text-slate-400">#{cw.LEDGER_ID}</TableCell>
                      <TableCell className="font-semibold text-slate-800 dark:text-slate-200">{cw.DOCTOR_NAME}</TableCell>
                      <TableCell className="text-xs">{cw.TRANSACTION_TYPE}</TableCell>
                      <TableCell className="font-bold text-emerald-600">৳{cw.DOCTOR_AMOUNT}</TableCell>
                      <TableCell className="text-xs text-slate-400">{new Date(cw.TRANSACTION_DATE).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="success" size="sm">Cleared</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}

          {/* Full Transaction Ledger */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="text-base">System Transaction Ledger</CardTitle>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Hospital Share</TableHead>
                  <TableHead>Doctor Share</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledger.map((tx) => (
                  <TableRow key={tx.LEDGER_ID}>
                    <TableCell className="font-mono text-xs text-slate-400">#{tx.LEDGER_ID}</TableCell>
                    <TableCell className="text-xs text-slate-500">{new Date(tx.TRANSACTION_DATE).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={tx.TRANSACTION_TYPE === 'Appointment' ? 'primary' : 'warning'} size="sm">
                        {tx.TRANSACTION_TYPE}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-700 dark:text-slate-300 font-medium">{tx.DOCTOR_NAME}</TableCell>
                    <TableCell className="font-bold text-slate-900 dark:text-slate-100">৳{tx.TOTAL_AMOUNT}</TableCell>
                    <TableCell className="text-blue-600 dark:text-blue-400 font-semibold">৳{tx.ADMIN_AMOUNT}</TableCell>
                    <TableCell className="text-violet-600 dark:text-violet-400 font-semibold">৳{tx.DOCTOR_AMOUNT}</TableCell>
                    <TableCell>
                      {tx.IS_CLEARED === 'Y' && <Badge variant="success" size="sm">Cleared</Badge>}
                      {tx.IS_CLEARED === 'P' && <Badge variant="warning" size="sm">Pending</Badge>}
                      {tx.IS_CLEARED === 'N' && <Badge variant="default" size="sm">Earned</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
                {ledger.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-slate-400">
                      No ledger transactions recorded yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* TAB 5: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <Card className="animate-fade-in overflow-hidden">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck size={18} className="text-blue-500" />
                <span>System Security & Financial Audit Trail</span>
              </CardTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                Immutable ledger records, user interactions, and clearance actions
              </p>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search user, entity..."
                  value={auditSearchQuery}
                  onChange={(e) => setAuditSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none w-44"
                />
              </div>

              {/* Filter Type */}
              <select
                value={auditFilterType}
                onChange={(e) => setAuditFilterType(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none"
              >
                <option value="ALL">All Actions</option>
                <option value="Appointment">Appointments</option>
                <option value="Lab Test">Lab Tests</option>
              </select>

              {/* Filter Status */}
              <select
                value={auditFilterStatus}
                onChange={(e) => setAuditFilterStatus(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="Cleared">Cleared</option>
                <option value="Pending Clearance">Pending</option>
                <option value="Recorded">Recorded</option>
              </select>
            </div>
          </CardHeader>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Audit ID</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAuditLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-xs text-slate-400">#{log.id}</TableCell>
                  <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                    {log.user_name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="primary" size="sm">{log.role}</Badge>
                  </TableCell>
                  <TableCell className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {log.action}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-500">
                    {log.entity}
                  </TableCell>
                  <TableCell className="font-bold text-xs text-slate-900 dark:text-slate-100">
                    ৳{log.amount}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge 
                      variant={log.status === 'Cleared' ? 'success' : log.status === 'Pending Clearance' ? 'warning' : 'default'} 
                      size="sm"
                    >
                      {log.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}

              {filteredAuditLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-slate-400 text-xs">
                    No audit records match the selected filter criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* ===== Create Department Modal ===== */}
      <Modal
        isOpen={showDeptModal}
        onClose={() => setShowDeptModal(false)}
        title="Add Clinical Department"
        description="Establish a new department within the hospital facility."
      >
        <form onSubmit={handleCreateDept} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">Department Name</label>
            <input
              type="text"
              value={deptForm.name}
              onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
              required
              className={inputCls}
              placeholder="e.g. Cardiology"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">Department Head</label>
            <input
              type="text"
              value={deptForm.head}
              onChange={(e) => setDeptForm({ ...deptForm, head: e.target.value })}
              className={inputCls}
              placeholder="Head of department (optional)"
            />
          </div>
          <div className="flex justify-end gap-2.5 pt-4">
            <Button variant="secondary" size="md" onClick={() => setShowDeptModal(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit" loading={modalLoading} icon={<Plus size={15} />}>
              Create Department
            </Button>
          </div>
        </form>
      </Modal>

      {/* ===== Edit Department Modal ===== */}
      <Modal
        isOpen={showEditDeptModal}
        onClose={() => setShowEditDeptModal(false)}
        title="Edit Clinical Department"
      >
        <form onSubmit={handleUpdateDept} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">Department Name</label>
            <input
              type="text"
              value={editDeptForm.name}
              onChange={(e) => setEditDeptForm({ ...editDeptForm, name: e.target.value })}
              required
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">Department Head</label>
            <input
              type="text"
              value={editDeptForm.head}
              onChange={(e) => setEditDeptForm({ ...editDeptForm, head: e.target.value })}
              className={inputCls}
            />
          </div>
          <div className="flex justify-end gap-2.5 pt-4">
            <Button variant="secondary" size="md" onClick={() => setShowEditDeptModal(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit" loading={modalLoading} icon={<Pencil size={15} />}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* ===== Create Doctor Modal ===== */}
      <Modal
        isOpen={showDocModal}
        onClose={() => setShowDocModal(false)}
        title="Register Medical Doctor"
        description="Provision physician credentials and clinical practice profile."
        size="lg"
      >
        <form onSubmit={handleCreateDoctor} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">Username</label>
              <input type="text" value={docForm.username} onChange={(e) => setDocForm({ ...docForm, username: e.target.value })} required className={inputCls} placeholder="Login username" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">Password</label>
              <input type="password" value={docForm.password} onChange={(e) => setDocForm({ ...docForm, password: e.target.value })} required className={inputCls} placeholder="Min. 6 characters" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">Full Name</label>
              <input type="text" value={docForm.name} onChange={(e) => setDocForm({ ...docForm, name: e.target.value })} required className={inputCls} placeholder="Dr. Full Name" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">Department</label>
              <select value={docForm.departmentId} onChange={(e) => setDocForm({ ...docForm, departmentId: e.target.value })} required className={inputCls}>
                <option value="">Select department...</option>
                {departments.map((d: any) => <option key={d.DEPARTMENT_ID} value={d.DEPARTMENT_ID}>{d.DEPARTMENT_NAME}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">Gender</label>
              <select value={docForm.gender} onChange={(e) => setDocForm({ ...docForm, gender: e.target.value })} className={inputCls}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">Date of Birth</label>
              <input type="date" value={docForm.dob} onChange={(e) => setDocForm({ ...docForm, dob: e.target.value })} required className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">Specialization</label>
              <input type="text" value={docForm.specialization} onChange={(e) => setDocForm({ ...docForm, specialization: e.target.value })} required className={inputCls} placeholder="e.g. Cardiologist" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">Qualification</label>
              <input type="text" value={docForm.qualification} onChange={(e) => setDocForm({ ...docForm, qualification: e.target.value })} className={inputCls} placeholder="e.g. MBBS, MD" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">Phone</label>
              <input type="tel" value={docForm.phone} onChange={(e) => setDocForm({ ...docForm, phone: e.target.value })} required className={inputCls} placeholder="01XXXXXXXXX" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">Email</label>
              <input type="email" value={docForm.email} onChange={(e) => setDocForm({ ...docForm, email: e.target.value })} required className={inputCls} placeholder="doctor@example.com" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">Consultation Fee (৳)</label>
              <input type="number" value={docForm.fee} onChange={(e) => setDocForm({ ...docForm, fee: e.target.value })} required className={inputCls} placeholder="500" />
            </div>
          </div>
          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" size="md" onClick={() => setShowDocModal(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit" loading={modalLoading} icon={<Plus size={15} />}>
              Register Doctor
            </Button>
          </div>
        </form>
      </Modal>

      {/* ===== Edit Doctor Modal ===== */}
      <Modal
        isOpen={showEditDocModal}
        onClose={() => setShowEditDocModal(false)}
        title="Edit Doctor Profile"
        size="lg"
      >
        <form onSubmit={handleUpdateDoc} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">Full Name</label>
              <input type="text" value={editDocForm.name} onChange={(e) => setEditDocForm({ ...editDocForm, name: e.target.value })} required className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">Department</label>
              <select value={editDocForm.departmentId} onChange={(e) => setEditDocForm({ ...editDocForm, departmentId: e.target.value })} required className={inputCls}>
                <option value="">Select department...</option>
                {departments.map((d: any) => <option key={d.DEPARTMENT_ID} value={d.DEPARTMENT_ID}>{d.DEPARTMENT_NAME}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">Gender</label>
              <select value={editDocForm.gender} onChange={(e) => setEditDocForm({ ...editDocForm, gender: e.target.value })} className={inputCls}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">Date of Birth</label>
              <input type="date" value={editDocForm.dob} onChange={(e) => setEditDocForm({ ...editDocForm, dob: e.target.value })} required className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">Specialization</label>
              <input type="text" value={editDocForm.specialization} onChange={(e) => setEditDocForm({ ...editDocForm, specialization: e.target.value })} required className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">Qualification</label>
              <input type="text" value={editDocForm.qualification} onChange={(e) => setEditDocForm({ ...editDocForm, qualification: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">Phone</label>
              <input type="tel" value={editDocForm.phone} onChange={(e) => setEditDocForm({ ...editDocForm, phone: e.target.value })} required className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">Email</label>
              <input type="email" value={editDocForm.email} onChange={(e) => setEditDocForm({ ...editDocForm, email: e.target.value })} required className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">Consultation Fee (৳)</label>
              <input type="number" value={editDocForm.fee} onChange={(e) => setEditDocForm({ ...editDocForm, fee: e.target.value })} required className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">Status</label>
              <select value={editDocForm.status} onChange={(e) => setEditDocForm({ ...editDocForm, status: e.target.value })} className={inputCls}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" size="md" onClick={() => setShowEditDocModal(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit" loading={modalLoading} icon={<Pencil size={15} />}>
              Update Doctor
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardShell>
  );
}
