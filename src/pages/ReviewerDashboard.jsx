import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Layout from '../components/layout/Layout';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import CodeAnalyzer from '../components/CodeAnalyzer';
import {
  FileCode2,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  MessageSquare,
  User,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  AlertTriangle,
  X
} from 'lucide-react';

export default function ReviewerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [completedReviews, setCompletedReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [storedAnalysisResults, setStoredAnalysisResults] = useState([]);
  const [activeTab, setActiveTab] = useState('available'); // 'available', 'in_progress', 'completed'

  useEffect(() => {
    if (user) {
      fetchAssignments();
      fetchCompletedReviews();
    }
  }, [user]);

  const fetchAssignments = async () => {
    try {
      // Fetch all pending/in_review submissions for reviewers
      const { data: subs, error } = await supabase
        .from('code_submissions')
        .select('*')
        .or(`reviewer_id.eq.${user.id},reviewer_id.is.null`)
        .in('status', ['pending', 'in_review'])
        .eq('is_latest', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch developer names separately
      const developerIds = [...new Set(subs.map(s => s.developer_id))];
      let developerMap = {};

      if (developerIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, name')
          .in('user_id', developerIds);

        if (profiles) {
          developerMap = profiles.reduce((acc, p) => {
            acc[p.user_id] = p.name;
            return acc;
          }, {});
        }
      }

      const enrichedSubs = subs.map(s => ({
        ...s,
        developer: { name: developerMap[s.developer_id] || 'Unknown' }
      }));

      setAssignments(enrichedSubs || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompletedReviews = async () => {
    try {
      // Fetch completed submissions reviewed by this reviewer
      const { data: subs, error } = await supabase
        .from('code_submissions')
        .select('*')
        .eq('reviewer_id', user.id)
        .in('status', ['approved', 'changes_requested'])
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Fetch developer names separately
      const developerIds = [...new Set(subs.map(s => s.developer_id))];
      let developerMap = {};

      if (developerIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, name')
          .in('user_id', developerIds);

        if (profiles) {
          developerMap = profiles.reduce((acc, p) => {
            acc[p.user_id] = p.name;
            return acc;
          }, {});
        }
      }

      const enrichedSubs = subs.map(s => ({
        ...s,
        developer: { name: developerMap[s.developer_id] || 'Unknown' }
      }));

      setCompletedReviews(enrichedSubs || []);
    } catch (error) {
      console.error('Error fetching completed reviews:', error);
    }
  };

  const [submissionHistory, setSubmissionHistory] = useState([]);

  const fetchSubmissionHistory = async (groupId) => {
    try {
      const { data: versions, error: versionsError } = await supabase
        .from('code_submissions')
        .select('*')
        .eq('group_id', groupId)
        .order('version', { ascending: true });

      if (versionsError) throw versionsError;

      const versionIds = versions.map(v => v.id);
      const { data: comments, error: commentsError } = await supabase
        .from('review_comments')
        .select('*')
        .in('submission_id', versionIds)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;

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
    }
  };

  const fetchStoredAnalysis = async (submissionId) => {
    try {
      const { data, error } = await supabase
        .from('static_analysis_results')
        .select('*')
        .eq('submission_id', submissionId)
        .order('line_number', { ascending: true });

      if (error) throw error;
      setStoredAnalysisResults(data || []);
    } catch (error) {
      console.error('Error fetching analysis:', error);
      setStoredAnalysisResults([]);
    }
  };

  const handleSelectReview = async (assignment) => {
    setSelectedReview(assignment);
    setComment('');

    if (assignment.group_id) {
      await fetchSubmissionHistory(assignment.group_id);
    } else {
      setSubmissionHistory([{ ...assignment, comments: [] }]);
    }

    await fetchStoredAnalysis(assignment.id);
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
      in_review: 'bg-primary/10 text-primary border-primary/20',
      changes_requested: 'bg-destructive/10 text-destructive border-destructive/20',
    };

    const icons = {
      approved: CheckCircle2,
      pending: Clock,
      in_review: Eye,
      changes_requested: XCircle,
    };

    const labels = {
      approved: 'Approved',
      pending: 'Pending',
      in_review: 'In Review',
      changes_requested: 'Changes Requested',
    };

    const Icon = icons[status] || Clock;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status] || styles.pending}`}>
        <Icon className="h-3.5 w-3.5" />
        {labels[status] || status}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const styles = {
      high: 'bg-destructive/10 text-destructive',
      medium: 'bg-warning/10 text-warning',
      low: 'bg-muted text-muted-foreground',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[priority] || styles.medium}`}>
        {(priority || 'medium').charAt(0).toUpperCase() + (priority || 'medium').slice(1)}
      </span>
    );
  };

  const handleStartReview = async (assignment) => {
    try {
      const { error } = await supabase
        .from('code_submissions')
        .update({
          status: 'in_review',
          reviewer_id: user.id
        })
        .eq('id', assignment.id);

      if (error) throw error;

      setAssignments(assignments.map(a =>
        a.id === assignment.id ? { ...a, status: 'in_review', reviewer_id: user.id } : a
      ));
      handleSelectReview({ ...assignment, status: 'in_review' });
      toast.info('Review started');
    } catch (error) {
      console.error('Error starting review:', error);
      toast.error('Failed to start review');
    }
  };

  // Save static analysis results to the database
  const saveAnalysisResults = async (submissionId, analysisIssues) => {
    try {
      // Delete existing results for this submission
      await supabase
        .from('static_analysis_results')
        .delete()
        .eq('submission_id', submissionId);

      if (analysisIssues.length > 0) {
        const results = analysisIssues.map(issue => ({
          submission_id: submissionId,
          line_number: issue.line,
          rule_id: issue.rule,
          message: issue.message,
          severity: issue.type === 'error' ? 'error' : issue.type === 'warning' ? 'warning' : 'info',
        }));

        const { error } = await supabase
          .from('static_analysis_results')
          .insert(results);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error saving analysis results:', error);
    }
  };

  const handleApprove = async (analysisIssues = []) => {
    if (!selectedReview) return;

    setSubmitting(true);
    try {
      // Save analysis results first
      await saveAnalysisResults(selectedReview.id, analysisIssues);

      const { error } = await supabase
        .from('code_submissions')
        .update({
          status: 'approved',
          reviewer_id: user.id // Ensure we claim it if we haven't already
        })
        .eq('id', selectedReview.id);

      if (error) throw error;

      // Add comment if provided
      if (comment.trim()) {
        await supabase.from('review_comments').insert({
          submission_id: selectedReview.id,
          reviewer_id: user.id,
          content: comment,
        });
      }

      toast.success('Code approved!');
      setSelectedReview(null);
      setComment('');
      fetchAssignments();
      fetchCompletedReviews();
    } catch (error) {
      console.error('Error approving:', error);
      toast.error('Failed to approve');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestChanges = async (analysisIssues = []) => {
    if (!selectedReview) return;

    if (!comment.trim()) {
      toast.error('Please add a comment explaining the required changes');
      return;
    }

    setSubmitting(true);
    try {
      // Save analysis results first
      await saveAnalysisResults(selectedReview.id, analysisIssues);

      const { error } = await supabase
        .from('code_submissions')
        .update({ status: 'changes_requested' })
        .eq('id', selectedReview.id);

      if (error) throw error;

      // Add comment
      await supabase.from('review_comments').insert({
        submission_id: selectedReview.id,
        reviewer_id: user.id,
        content: comment,
      });

      toast.success('Changes requested - notification sent to developer');
      setSelectedReview(null);
      setComment('');
      fetchAssignments();
      fetchCompletedReviews();
    } catch (error) {
      console.error('Error requesting changes:', error);
      toast.error('Failed to request changes');
    } finally {
      setSubmitting(false);
    }
  };

  const stats = [
    { label: 'Available', value: assignments.filter(a => a.status === 'pending').length, icon: FileCode2, color: 'text-primary', tab: 'available' },
    { label: 'In Progress', value: assignments.filter(a => a.status === 'in_review' && a.reviewer_id === user.id).length, icon: Eye, color: 'text-accent', tab: 'in_progress' },
    { label: 'Completed', value: completedReviews.length, icon: CheckCircle2, color: 'text-success', tab: 'completed' },
  ];

  const getDisplayedSubmissions = () => {
    switch (activeTab) {
      case 'available':
        return assignments.filter(a => a.status === 'pending');
      case 'in_progress':
        return assignments.filter(a => a.status === 'in_review' && a.reviewer_id === user.id);
      case 'completed':
        return completedReviews;
      default:
        return assignments;
    }
  };

  const displayedSubmissions = getDisplayedSubmissions();

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">Reviewer Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user.name}!</p>
        </div>

        {/* Stats / Tabs */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`p-5 rounded-xl border bg-card card-shadow cursor-pointer transition-all hover:scale-[1.02] ${activeTab === stat.tab ? 'border-primary ring-2 ring-primary/20' : 'border-border'
                }`}
              onClick={() => setActiveTab(stat.tab)}
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

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Assignments List */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {activeTab === 'available' ? 'Available Submissions' : activeTab === 'in_progress' ? 'In Progress' : 'Completed Reviews'}
              </h2>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : displayedSubmissions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileCode2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>{activeTab === 'completed' ? 'No completed reviews yet' : 'No submissions to review at the moment'}</p>
              </div>
            ) : (
              <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
                {displayedSubmissions.map((assignment) => (
                  <div
                    key={assignment.id}
                    className={`p-4 hover:bg-secondary/20 transition-colors cursor-pointer ${selectedReview?.id === assignment.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                      }`}
                    onClick={() => handleSelectReview(assignment)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium truncate">{assignment.title}</h3>
                          {getPriorityBadge(assignment.priority)}
                        </div>
                        <code className="text-xs px-2 py-0.5 rounded bg-secondary font-mono">
                          {assignment.file_name}
                        </code>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            {assignment.developer?.name || 'Unknown'}
                          </span>
                          <span>{new Date(assignment.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getStatusBadge(assignment.status)}
                        {assignment.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartReview(assignment);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                            Review Code
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Review Panel */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {selectedReview ? 'Code Review' : 'Select a submission to review'}
              </h2>
              {selectedReview && (
                <Button variant="ghost" size="sm" onClick={() => setSelectedReview(null)}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {selectedReview ? (
              <div className="flex flex-col max-h-[600px] overflow-y-auto">
                {/* Submission History */}
                <div className="p-4 border-b border-border bg-muted/10">
                  <h3 className="font-semibold mb-4">Submission History</h3>
                  <div className="space-y-6">
                    {submissionHistory.map((versionItem) => (
                      <div key={versionItem.id} className={`relative border-l-2 pl-4 pb-2 ${versionItem.id === selectedReview.id ? 'border-primary' : 'border-border'}`}>
                        <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-4 border-background ${versionItem.id === selectedReview.id ? 'bg-primary' : 'bg-muted-foreground'}`} />

                        <div className="mb-2">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className={`font-medium ${versionItem.id === selectedReview.id ? 'text-primary' : ''}`}>
                              Version {versionItem.version}
                              {versionItem.id === selectedReview.id && <span className="ml-2 text-xs bg-primary/10 px-2 py-0.5 rounded-full">Current</span>}
                            </h4>
                            <span className="text-xs text-muted-foreground">{new Date(versionItem.created_at).toLocaleString()}</span>
                          </div>

                          <div className="rounded bg-muted/30 p-2 max-h-[100px] overflow-hidden relative group">
                            <pre className="text-xs font-mono text-muted-foreground opacity-70">{versionItem.code_content.slice(0, 150)}...</pre>
                            <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-background/10 to-transparent" />
                          </div>
                        </div>

                        {/* Comments */}
                        {versionItem.comments && versionItem.comments.length > 0 && (
                          <div className="space-y-2 mt-2">
                            {versionItem.comments.map(c => (
                              <div key={c.id} className="bg-secondary/20 p-2 rounded text-sm">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="font-medium text-xs text-primary">{c.reviewer_name}</span>
                                  <span className="text-[10px] text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</span>
                                </div>
                                <p className="whitespace-pre-wrap">{c.content}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Code View with Line Numbers */}
                <div className="p-4 border-b border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <FileCode2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-mono">{selectedReview.file_name}</span>
                  </div>
                  <div className="rounded-lg border border-border bg-code-background max-h-[200px] overflow-auto">
                    <pre className="p-4 text-sm font-mono">
                      {selectedReview.code_content.split('\n').map((line, index) => (
                        <div key={index} className="flex">
                          <span className="w-10 text-right pr-4 text-muted-foreground select-none">{index + 1}</span>
                          <code className="text-code-foreground">{line}</code>
                        </div>
                      ))}
                    </pre>
                  </div>
                </div>

                {/* Static Analysis Results Section */}
                <div className="p-4 border-b border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <h3 className="font-medium">Static Analysis Results (ESLint)</h3>
                  </div>
                  <CodeAnalyzer
                    code={selectedReview.code_content}
                    onAnalysisComplete={(issues) => {
                      // Store issues for later use when approving/requesting changes
                      window._currentAnalysisIssues = issues;
                    }}
                  />
                </div>

                {/* Comment Section */}
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      <MessageSquare className="h-4 w-4 inline mr-1" />
                      Review Comment
                    </label>
                    <Textarea
                      placeholder="Add your review comments, suggestions, or feedback..."
                      rows={3}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 border-destructive/50 text-destructive hover:bg-destructive/10"
                      onClick={() => handleRequestChanges(window._currentAnalysisIssues || [])}
                      disabled={submitting}
                    >
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsDown className="h-4 w-4" />}
                      Request Changes
                    </Button>
                    <Button
                      variant="primary"
                      className="flex-1 bg-success hover:bg-success/90"
                      onClick={() => handleApprove(window._currentAnalysisIssues || [])}
                      disabled={submitting}
                    >
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4" />}
                      Approve
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                <div className="text-center">
                  <Eye className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Select a submission from the list to start reviewing</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
