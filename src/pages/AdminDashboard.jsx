import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Layout from '../components/layout/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import CodeAnalyzer from '../components/CodeAnalyzer';
import {
  Users,
  FileCode2,
  Activity,
  UserPlus,
  Edit2,
  Trash2,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  Shield,
  Code2,
  Eye,
  Loader2,
  X,
  AlertTriangle
} from 'lucide-react';

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [reviewers, setReviewers] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [analysisResults, setAnalysisResults] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);

  const [activeFilterValue, setActiveFilterValue] = useState(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch all users with their roles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Merge profiles with roles
      const usersWithRoles = profiles.map(profile => {
        const userRole = roles.find(r => r.user_id === profile.user_id);
        return {
          ...profile,
          role: userRole?.role || 'developer',
        };
      });

      setUsers(usersWithRoles);
      setReviewers(usersWithRoles.filter(u => u.role === 'reviewer'));

      // Fetch all submissions without FK hints
      const { data: subs, error: subsError } = await supabase
        .from('code_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (subsError) throw subsError;

      // Fetch developer and reviewer names separately
      const allUserIds = [...new Set([
        ...subs.map(s => s.developer_id),
        ...subs.filter(s => s.reviewer_id).map(s => s.reviewer_id)
      ])];

      let userMap = {};
      if (allUserIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, name')
          .in('user_id', allUserIds);

        if (profilesData) {
          userMap = profilesData.reduce((acc, p) => {
            acc[p.user_id] = p.name;
            return acc;
          }, {});
        }
      }

      const enrichedSubs = subs.map(s => ({
        ...s,
        developer: { name: userMap[s.developer_id] || 'Unknown' },
        reviewer: s.reviewer_id ? { name: userMap[s.reviewer_id] } : null
      }));

      setSubmissions(enrichedSubs || []);

      // Generate activity logs from submissions
      const logs = enrichedSubs.map(s => ({
        id: s.id,
        type: s.status === 'pending' ? 'submission' : s.status === 'in_review' ? 'assigned' : 'reviewed',
        message: s.status === 'pending'
          ? `${s.developer?.name} submitted "${s.title}"`
          : s.status === 'in_review'
            ? `${s.title} assigned to ${s.reviewer?.name || 'reviewer'}`
            : `${s.title} ${s.status === 'approved' ? 'approved' : 'needs changes'}`,
        timestamp: s.updated_at,
        status: s.status
      })).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      setActivityLogs(logs);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalysisResults = async (submissionId) => {
    try {
      const { data, error } = await supabase
        .from('static_analysis_results')
        .select('*')
        .eq('submission_id', submissionId)
        .order('line_number', { ascending: true });

      if (error) throw error;
      setAnalysisResults(data || []);
    } catch (error) {
      console.error('Error fetching analysis:', error);
      setAnalysisResults([]);
    }
  };

  const handleViewSubmission = async (submission) => {
    setSelectedSubmission(submission);
    await fetchAnalysisResults(submission.id);
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const stats = [
    { label: 'Total Users', value: users.length, icon: Users, color: 'text-primary' },
    { label: 'Developers', value: users.filter(u => u.role === 'developer').length, icon: Code2, color: 'text-accent' },
    { label: 'Reviewers', value: users.filter(u => u.role === 'reviewer').length, icon: Eye, color: 'text-success' },
    { label: 'Active Reviews', value: submissions.filter(s => s.status === 'in_review').length, icon: Activity, color: 'text-warning' },
  ];

  const getRoleBadge = (role) => {
    const styles = {
      admin: 'bg-destructive/10 text-destructive border-destructive/20',
      reviewer: 'bg-success/10 text-success border-success/20',
      developer: 'bg-primary/10 text-primary border-primary/20',
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${styles[role] || styles.developer}`}>
        <Shield className="h-3 w-3" />
        {(role || 'developer').charAt(0).toUpperCase() + (role || 'developer').slice(1)}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const styles = {
      approved: 'bg-success/10 text-success border-success/20',
      pending: 'bg-warning/10 text-warning border-warning/20',
      changes_requested: 'bg-destructive/10 text-destructive border-destructive/20',
      in_review: 'bg-primary/10 text-primary border-primary/20',
    };
    const icons = {
      approved: CheckCircle2,
      pending: Clock,
      changes_requested: XCircle,
      in_review: Eye,
    };
    const labels = {
      approved: 'Approved',
      pending: 'Pending',
      changes_requested: 'Changes Requested',
      in_review: 'In Review',
    };
    const Icon = icons[status] || Clock;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status] || styles.pending}`}>
        <Icon className="h-3.5 w-3.5" />
        {labels[status] || status}
      </span>
    );
  };

  const handleAssignReviewer = async (submissionId) => {
    if (reviewers.length === 0) {
      toast.error('No reviewers available');
      return;
    }
    const randomReviewer = reviewers[Math.floor(Math.random() * reviewers.length)];

    try {
      const { error } = await supabase
        .from('code_submissions')
        .update({
          reviewer_id: randomReviewer.user_id,
          status: 'in_review'
        })
        .eq('id', submissionId);

      if (error) throw error;

      toast.success(`Assigned to ${randomReviewer.name}`);
      fetchData();
    } catch (error) {
      console.error('Error assigning reviewer:', error);
      toast.error('Failed to assign reviewer');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? This action CANNOT be undone and will delete all their submissions and data.')) {
      return;
    }

    try {
      const { error } = await supabase.rpc('delete_user', { target_user_id: userId });

      if (error) throw error;

      toast.success('User deleted successfully');
      fetchData(); // Refresh the list
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user: ' + error.message);
    }
  };

  const filteredUsers = users.filter(u =>
    (u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (!activeFilterValue || u.role === activeFilterValue)
  );

  const filteredSubmissions = submissions.filter(s => {
    const matchesSearch = s.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.developer?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !activeFilterValue || s.status === activeFilterValue;
    return matchesSearch && matchesStatus;
  });

  const filteredActivityLogs = activityLogs.filter(l =>
    (!activeFilterValue || l.type === activeFilterValue)
  );

  const tabs = [
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'submissions', label: 'Submissions', icon: FileCode2 },
    { id: 'activity', label: 'Activity Log', icon: Activity },
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage users, assignments, and monitor system activity</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="p-5 rounded-xl border border-border bg-card card-shadow">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-secondary ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setActiveFilterValue(null); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="relative">
            <Button variant="outline" onClick={() => setShowFilterDropdown(!showFilterDropdown)}>
              <Filter className="h-4 w-4" />
              {activeFilterValue ? activeFilterValue.replace('_', ' ') : 'Filter'}
            </Button>
            {showFilterDropdown && (
              <div className="absolute right-0 mt-2 w-48 rounded-lg border border-border bg-card shadow-lg z-10">
                <button
                  onClick={() => { setActiveFilterValue(null); setShowFilterDropdown(false); }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-secondary ${!activeFilterValue ? 'bg-secondary' : ''}`}
                >
                  All
                </button>
                {activeTab === 'users' && ['developer', 'reviewer', 'admin'].map(role => (
                  <button
                    key={role}
                    onClick={() => { setActiveFilterValue(role); setShowFilterDropdown(false); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-secondary capitalize ${activeFilterValue === role ? 'bg-secondary' : ''}`}
                  >
                    {role} (Role)
                  </button>
                ))}
                {activeTab === 'submissions' && ['pending', 'in_review', 'approved', 'changes_requested'].map(status => (
                  <button
                    key={status}
                    onClick={() => { setActiveFilterValue(status); setShowFilterDropdown(false); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-secondary capitalize ${activeFilterValue === status ? 'bg-secondary' : ''}`}
                  >
                    {status.replace('_', ' ')}
                  </button>
                ))}
                {activeTab === 'activity' && ['submission', 'assigned', 'reviewed'].map(type => (
                  <button
                    key={type}
                    onClick={() => { setActiveFilterValue(type); setShowFilterDropdown(false); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-secondary capitalize ${activeFilterValue === type ? 'bg-secondary' : ''}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {activeTab === 'users' && (
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No users found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border bg-secondary/30">
                          <th className="text-left p-4 text-sm font-medium text-muted-foreground">User</th>
                          <th className="text-left p-4 text-sm font-medium text-muted-foreground">Role</th>
                          <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                          <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                          <th className="text-left p-4 text-sm font-medium text-muted-foreground">Joined</th>
                          <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((u) => (
                          <tr key={u.id} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                            <td className="p-4">
                              <div>
                                <p className="font-medium">{u.name}</p>
                                <p className="text-sm text-muted-foreground">{u.email}</p>
                              </div>
                            </td>
                            <td className="p-4">{getRoleBadge(u.role)}</td>
                            <td className="p-4">
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
                                <span className="w-1.5 h-1.5 rounded-full bg-success" />
                                Active
                              </span>
                            </td>
                            <td className="p-4 text-muted-foreground text-sm">
                              {new Date(u.created_at).toLocaleDateString()}
                            </td>
                            <td className="p-4 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteUser(u.user_id)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                title="Delete User"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'submissions' && (
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                {filteredSubmissions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileCode2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No submissions found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border bg-secondary/30">
                          <th className="text-left p-4 text-sm font-medium text-muted-foreground">Submission</th>
                          <th className="text-left p-4 text-sm font-medium text-muted-foreground">Developer</th>
                          <th className="text-left p-4 text-sm font-medium text-muted-foreground">Reviewer</th>
                          <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                          <th className="text-left p-4 text-sm font-medium text-muted-foreground">Date</th>
                          <th className="text-left p-4 text-sm font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSubmissions.map((s) => (
                          <tr key={s.id} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                            <td className="p-4 font-medium">{s.title}</td>
                            <td className="p-4 text-muted-foreground">{s.developer?.name || 'Unknown'}</td>
                            <td className="p-4">
                              {s.reviewer?.name ? (
                                <span className="text-muted-foreground">{s.reviewer.name}</span>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAssignReviewer(s.id)}
                                >
                                  Assign Reviewer
                                </Button>
                              )}
                            </td>
                            <td className="p-4">{getStatusBadge(s.status)}</td>
                            <td className="p-4 text-muted-foreground text-sm">
                              {new Date(s.created_at).toLocaleDateString()}
                            </td>
                            <td className="p-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewSubmission(s)}
                              >
                                <Eye className="h-4 w-4" />
                                View
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                {activityLogs.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No activity yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {filteredActivityLogs.slice(0, 20).map((log) => (
                      <div key={log.id} className="p-4 flex items-center gap-4 hover:bg-secondary/20">
                        <div className={`p-2 rounded-lg ${log.status === 'approved' ? 'bg-success/10 text-success' :
                          log.status === 'changes_requested' ? 'bg-destructive/10 text-destructive' :
                            log.status === 'in_review' ? 'bg-primary/10 text-primary' :
                              'bg-warning/10 text-warning'
                          }`}>
                          {log.status === 'approved' ? <CheckCircle2 className="h-4 w-4" /> :
                            log.status === 'changes_requested' ? <XCircle className="h-4 w-4" /> :
                              log.status === 'in_review' ? <Eye className="h-4 w-4" /> :
                                <Clock className="h-4 w-4" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">{log.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(log.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* View Submission Modal for Admin */}
        {selectedSubmission && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="w-full max-w-4xl mx-4 p-6 rounded-xl border border-border bg-card card-shadow animate-slide-up max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold">{selectedSubmission.title}</h2>
                  <p className="text-sm text-muted-foreground">{selectedSubmission.file_name}</p>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedSubmission.status)}
                  <Button variant="ghost" size="sm" onClick={() => setSelectedSubmission(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Code View with Line Numbers */}
              <div className="mb-4">
                <h3 className="font-medium mb-2">Source Code</h3>
                <div className="rounded-lg border border-border bg-code-background max-h-[300px] overflow-auto">
                  <pre className="p-4 text-sm font-mono">
                    {selectedSubmission.code_content.split('\n').map((line, index) => (
                      <div key={index} className="flex">
                        <span className="w-10 text-right pr-4 text-muted-foreground select-none">{index + 1}</span>
                        <code className="text-code-foreground">{line}</code>
                      </div>
                    ))}
                  </pre>
                </div>
              </div>

              {/* Static Analysis Results - Admin can always see */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <h3 className="font-medium">Static Analysis Results</h3>
                </div>
                {analysisResults.length === 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground mb-2">No stored analysis. Running live analysis:</p>
                    <CodeAnalyzer code={selectedSubmission.code_content} />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {analysisResults.map((result) => (
                      <div
                        key={result.id}
                        className={`p-3 rounded-lg border ${result.severity === 'error'
                          ? 'border-destructive/30 bg-destructive/5'
                          : result.severity === 'warning'
                            ? 'border-warning/30 bg-warning/5'
                            : 'border-info/30 bg-info/5'
                          }`}
                      >
                        <div className="flex items-start gap-2">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded ${result.severity === 'error'
                            ? 'bg-destructive/10 text-destructive'
                            : result.severity === 'warning'
                              ? 'bg-warning/10 text-warning'
                              : 'bg-info/10 text-info'
                            }`}>
                            {result.severity.toUpperCase()}
                          </span>
                          <div className="flex-1">
                            <p className="text-sm">
                              {result.line_number && <span className="text-muted-foreground">Line {result.line_number}: </span>}
                              {result.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">Rule: {result.rule_id}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-4">
                <Button variant="outline" onClick={() => setSelectedSubmission(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
