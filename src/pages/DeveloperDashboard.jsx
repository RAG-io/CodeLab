import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Layout from '../components/layout/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import CodeAnalyzer from '../components/CodeAnalyzer';
import {
  Upload,
  FileCode2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Eye,
  MessageSquare,
  RefreshCw,
  Loader2,
  AlertTriangle,
  X,
  Trash2,
  Pencil
} from 'lucide-react';

export default function DeveloperDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [analysisResults, setAnalysisResults] = useState([]);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    code: '',
    fileName: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [currentSubmissionId, setCurrentSubmissionId] = useState(null);
  const [currentGroupId, setCurrentGroupId] = useState(null);
  const [currentVersion, setCurrentVersion] = useState(1);
  const [reviewComments, setReviewComments] = useState([]);
  const [activeFilter, setActiveFilter] = useState(null);

  useEffect(() => {
    if (user) {
      fetchSubmissions();
    }
  }, [user]);

  const fetchSubmissions = async () => {
    try {
      // Fetch submissions without the invalid FK hint
      const { data: subs, error } = await supabase
        .from('code_submissions')
        .select('*')
        .eq('developer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch reviewer names separately
      const reviewerIds = [...new Set(subs.filter(s => s.reviewer_id).map(s => s.reviewer_id))];
      let reviewerMap = {};

      if (reviewerIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, name')
          .in('user_id', reviewerIds);

        if (profiles) {
          reviewerMap = profiles.reduce((acc, p) => {
            acc[p.user_id] = p.name;
            return acc;
          }, {});
        }
      }

      const enrichedSubs = subs.map(s => ({
        ...s,
        reviewer: s.reviewer_id ? { name: reviewerMap[s.reviewer_id] } : null
      }));

      // Group submissions by group_id and select the latest version for each group
      const latestSubmissionsMap = new Map();

      enrichedSubs.forEach(sub => {
        const existing = latestSubmissionsMap.get(sub.group_id);
        if (!existing || sub.version > existing.version) {
          latestSubmissionsMap.set(sub.group_id, sub);
        }
      });

      // Convert map back to array
      const latestSubmissions = Array.from(latestSubmissionsMap.values());

      setSubmissions(latestSubmissions || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast.error('Failed to load submissions');
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

  const fetchReviewComments = async (submissionId) => {
    try {
      const { data: comments, error } = await supabase
        .from('review_comments')
        .select('*')
        .eq('submission_id', submissionId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch reviewer names
      if (comments && comments.length > 0) {
        const reviewerIds = [...new Set(comments.map(c => c.reviewer_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, name')
          .in('user_id', reviewerIds);

        const reviewerMap = profiles?.reduce((acc, p) => {
          acc[p.user_id] = p.name;
          return acc;
        }, {}) || {};

        const enrichedComments = comments.map(c => ({
          ...c,
          reviewer_name: reviewerMap[c.reviewer_id] || 'Reviewer'
        }));
        setReviewComments(enrichedComments);
      } else {
        setReviewComments([]);
      }
    } catch (error) {
      console.error('Error fetching review comments:', error);
      setReviewComments([]);
    }
  };

  const [submissionHistory, setSubmissionHistory] = useState([]);

  const fetchSubmissionHistory = async (groupId) => {
    try {
      // 1. Fetch all versions for this group
      const { data: versions, error: versionsError } = await supabase
        .from('code_submissions')
        .select('*')
        .eq('group_id', groupId)
        .order('version', { ascending: true });

      if (versionsError) throw versionsError;

      // 2. Fetch comments for ALL versions
      const versionIds = versions.map(v => v.id);
      const { data: comments, error: commentsError } = await supabase
        .from('review_comments')
        .select('*')
        .in('submission_id', versionIds)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;

      // 3. Helper to fetch reviewer names (deduplicated)
      const reviewerIds = [...new Set(comments.map(c => c.reviewer_id))];
      let reviewerMap = {};

      if (reviewerIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, name')
          .in('user_id', reviewerIds);

        if (profiles) {
          reviewerMap = profiles.reduce((acc, p) => {
            acc[p.user_id] = p.name;
            return acc;
          }, {});
        }
      }

      // 4. Combine versions with their specific comments
      const history = versions.map(v => ({
        ...v,
        comments: comments.filter(c => c.submission_id === v.id).map(c => ({
          ...c,
          reviewer_name: reviewerMap[c.reviewer_id] || 'Reviewer'
        }))
      }));

      setSubmissionHistory(history);
    } catch (error) {
      console.error('Error fetching history:', error);
      toast.error('Failed to load submission history');
    }
  };

  const handleViewSubmission = async (submission) => {
    setSelectedSubmission(submission);
    // Fetch full history if group_id exists
    if (submission.group_id) {
      await fetchSubmissionHistory(submission.group_id);
    } else {
      // Fallback for old/legacy items without group_id (treat as single version)
      setSubmissionHistory([{ ...submission, comments: [] }]);
    }

    // Also fetch analysis for the CURRENT selection (optional, or we can fetch for all if needed, but keeping it simple)
    if (['approved', 'changes_requested'].includes(submission.status)) {
      await fetchAnalysisResults(submission.id);
    } else {
      setAnalysisResults([]);
    }
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

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadForm.title || !uploadForm.code) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      if (isEditing && currentGroupId) {
        // RESUBMITTING: Create a NEW version (INSERT) instead of updating
        const { error } = await supabase
          .from('code_submissions')
          .insert({
            title: uploadForm.title,
            description: uploadForm.description,
            file_name: uploadForm.fileName || 'code.js',
            code_content: uploadForm.code,
            status: 'pending',
            developer_id: user.id,
            group_id: currentGroupId, // Link to the same group
            version: currentVersion + 1 // Increment version
          });

        if (error) throw error;
        toast.success('New version submitted successfully!');
      } else {
        // NEW SUBMISSION
        const { error } = await supabase
          .from('code_submissions')
          .insert({
            title: uploadForm.title,
            description: uploadForm.description,
            file_name: uploadForm.fileName || 'code.js',
            code_content: uploadForm.code,
            developer_id: user.id,
            // version defaults to 1, group_id defaults to random UUID
          });

        if (error) throw error;
        toast.success('Code submitted for review!');
      }

      setUploadForm({ title: '', description: '', code: '', fileName: '' });
      setIsEditing(false);
      setCurrentSubmissionId(null);
      setCurrentGroupId(null);
      setCurrentVersion(1);
      setShowUploadModal(false);
      fetchSubmissions();
    } catch (error) {
      console.error('Error submitting code:', error);
      toast.error('Failed to submit code: ' + (error.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSubmission = async (submissionId) => {
    if (!confirm('Are you sure you want to delete this submission? This action cannot be undone.')) return;

    try {
      // The database handles cascading deletes for related records (comments, analysis results)
      const { error, count } = await supabase
        .from('code_submissions')
        .delete({ count: 'exact' }) // Request count of deleted rows
        .eq('id', submissionId)
        .eq('developer_id', user.id);

      if (error) throw error;

      if (count === 0) {
        throw new Error('Submission not found or could not be deleted');
      }

      toast.success('Submission deleted successfully');
      // 3. Update local state immediately for better UX
      setSubmissions(prev => prev.filter(s => s.id !== submissionId));
      // 4. Then fetch fresh data
      fetchSubmissions();
    } catch (error) {
      console.error('Error deleting submission:', error);
      toast.error('Failed to delete submission: ' + (error.message || 'Unknown error'));
    }
  };

  const handleEditSubmission = (submission) => {
    setUploadForm({
      title: submission.title,
      description: submission.description || '',
      code: submission.code_content,
      fileName: submission.file_name,
    });
    setIsEditing(true);
    setCurrentSubmissionId(submission.id);
    setCurrentGroupId(submission.group_id); // Track Group ID
    setCurrentVersion(submission.version || 1); // Track current version
    setShowUploadModal(true);
  };


  const stats = [
    { label: 'Total Submissions', value: submissions.length, icon: FileCode2, color: 'text-primary', filter: null },
    { label: 'Approved', value: submissions.filter(s => s.status === 'approved').length, icon: CheckCircle2, color: 'text-success', filter: 'approved' },
    { label: 'Pending Review', value: submissions.filter(s => s.status === 'pending').length, icon: Clock, color: 'text-warning', filter: 'pending' },
    { label: 'Needs Changes', value: submissions.filter(s => s.status === 'changes_requested').length, icon: AlertCircle, color: 'text-destructive', filter: 'changes_requested' },
  ];

  const filteredSubmissions = activeFilter
    ? submissions.filter(s => s.status === activeFilter)
    : submissions;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">Developer Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user.name}!</p>
          </div>
          <Button variant="primary" onClick={() => {
            setIsEditing(false);
            setCurrentSubmissionId(null);
            setCurrentGroupId(null);
            setCurrentVersion(1);
            setUploadForm({ title: '', description: '', code: '', fileName: '' });
            setShowUploadModal(true);
          }}>
            <Plus className="h-4 w-4" />
            Submit Code
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`p-5 rounded-xl border bg-card card-shadow cursor-pointer transition-all hover:scale-[1.02] ${activeFilter === stat.filter ? 'border-primary ring-2 ring-primary/20' : 'border-border'
                }`}
              onClick={() => setActiveFilter(activeFilter === stat.filter ? null : stat.filter)}
            >
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

        {/* Submissions Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {activeFilter ? `${activeFilter.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Submissions` : 'Your Submissions'}
            </h2>
            {activeFilter && (
              <Button variant="ghost" size="sm" onClick={() => setActiveFilter(null)}>
                <X className="h-4 w-4 mr-1" />
                Clear Filter
              </Button>
            )}
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileCode2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No submissions yet. Click "Submit Code" to get started!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Title</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">File</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Reviewer</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Date</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubmissions.map((submission) => (
                    <tr key={submission.id} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                      <td className="p-4 font-medium">{submission.title}</td>
                      <td className="p-4">
                        <code className="text-sm px-2 py-1 rounded bg-secondary font-mono">
                          {submission.file_name}
                        </code>
                        {submission.version > 1 && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-accent/10 text-accent border border-accent/20">
                            v{submission.version}
                          </span>
                        )}
                      </td>
                      <td className="p-4">{getStatusBadge(submission.status)}</td>
                      <td className="p-4 text-muted-foreground">
                        {submission.reviewer?.name || '—'}
                      </td>
                      <td className="p-4 text-muted-foreground text-sm">
                        {new Date(submission.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewSubmission(submission)}
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                          {submission.status === 'changes_requested' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditSubmission(submission)}
                              title="Edit and Resubmit"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteSubmission(submission.id)}
                            title="Delete Submission"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="w-full max-w-2xl mx-4 p-6 rounded-xl border border-border bg-card card-shadow animate-slide-up max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">{isEditing ? `Resubmit New Version (v${currentVersion + 1})` : 'Submit Code for Review'}</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowUploadModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title *</label>
                  <Input
                    placeholder="E.g., User Authentication Module"
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">File Name</label>
                  <Input
                    placeholder="E.g., auth.js"
                    value={uploadForm.fileName}
                    onChange={(e) => setUploadForm({ ...uploadForm, fileName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <Textarea
                    placeholder="Describe the code you're submitting..."
                    rows={2}
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Code *</label>
                  <Textarea
                    placeholder="Paste your code here..."
                    rows={12}
                    className="font-mono text-sm"
                    value={uploadForm.code}
                    onChange={(e) => setUploadForm({ ...uploadForm, code: e.target.value })}
                    required
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setShowUploadModal(false)} disabled={submitting}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" className="flex-1" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      isEditing ? 'Update & Resubmit' : 'Submit for Review'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Submission Modal */}
        {selectedSubmission && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="w-full max-w-4xl mx-4 p-6 rounded-xl border border-border bg-card card-shadow animate-slide-up max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold">{selectedSubmission.title}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm text-muted-foreground">{selectedSubmission.file_name}</p>
                    {selectedSubmission.version && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-accent/10 text-accent border border-accent/20">
                        v{selectedSubmission.version}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedSubmission.status)}
                  <Button variant="ghost" size="sm" onClick={() => setSelectedSubmission(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Submission History Loop */}
              <div className="space-y-8">
                {submissionHistory.map((versionItem, index) => (
                  <div key={versionItem.id} className="relative border-l-2 border-border pl-6 pb-2">
                    {/* Timeline Node */}
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary border-4 border-background" />

                    <div className="mb-4">
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        Version {versionItem.version}
                        <span className="text-sm font-normal text-muted-foreground">
                          ({new Date(versionItem.created_at).toLocaleString()})
                        </span>
                        {versionItem.id === selectedSubmission.id && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Current</span>
                        )}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">Status: {getStatusBadge(versionItem.status)}</p>

                      {/* Code Snippet (Collapsible or Preview could be good, but showing full for now as requested) */}
                      <div className="rounded-lg border border-border bg-code-background max-h-[200px] overflow-auto mb-3">
                        <pre className="p-4 text-xs font-mono text-muted-foreground">
                          {versionItem.code_content}
                        </pre>
                      </div>
                    </div>

                    {/* Comments for this Version */}
                    <div className="mb-4">
                      {versionItem.comments && versionItem.comments.length > 0 ? (
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                            <MessageSquare className="h-4 w-4 text-primary" />
                            Reviewer Comments
                          </h4>
                          {versionItem.comments.map((comment) => (
                            <div key={comment.id} className="p-3 rounded-lg border border-border bg-secondary/20">
                              <div className="flex justify-between items-start mb-1">
                                <span className="font-semibold text-sm text-primary">{comment.reviewer_name}</span>
                                <span className="text-xs text-muted-foreground">{new Date(comment.created_at).toLocaleString()}</span>
                              </div>
                              <p className="text-sm">{comment.comment_text}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic pl-1">No comments for this version.</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout >
  );
}
