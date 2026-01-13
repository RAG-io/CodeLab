import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { Button } from '../components/ui/button';
import {
  Code2,
  Upload,
  MessageSquare,
  Shield,
  Users,
  Zap,
  CheckCircle2,
  ArrowRight,
  GitBranch,
  FileCode2,
  Eye
} from 'lucide-react';

export default function Home() {
  const features = [
    {
      icon: Upload,
      title: 'Easy Code Upload',
      description: 'Upload your source code files securely to the cloud for review.',
    },
    {
      icon: MessageSquare,
      title: 'Inline Comments',
      description: 'Reviewers can add comments and suggestions directly on your code.',
    },
    {
      icon: Shield,
      title: 'Role-Based Access',
      description: 'Secure access control for developers, reviewers, and administrators.',
    },
    {
      icon: Zap,
      title: 'Real-Time Updates',
      description: 'Get instant notifications when your code is reviewed.',
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Work together seamlessly with your development team.',
    },
    {
      icon: CheckCircle2,
      title: 'Quality Assurance',
      description: 'Ensure code quality with structured review workflows.',
    },
  ];

  const stats = [
    { value: '10K+', label: 'Code Reviews' },
    { value: '2.5K+', label: 'Developers' },
    { value: '500+', label: 'Companies' },
    { value: '99.9%', label: 'Uptime' },
  ];

  const workflowSteps = [
    {
      icon: FileCode2,
      title: 'Upload Code',
      description: 'Developers submit their code for review',
    },
    {
      icon: Eye,
      title: 'Review Process',
      description: 'Assigned reviewers analyze the code',
    },
    {
      icon: MessageSquare,
      title: 'Feedback',
      description: 'Comments and suggestions are provided',
    },
    {
      icon: CheckCircle2,
      title: 'Approval',
      description: 'Code is approved or sent for revision',
    },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        {/* Background Elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
        </div>

        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8 animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <GitBranch className="h-4 w-4" />
              Cloud-Powered Code Reviews
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Streamline Your{' '}
              <span className="gradient-text">Code Review</span>{' '}
              Process
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              A modern cloud-based platform that brings developers and reviewers together
              for efficient, collaborative code reviews.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="hero" size="xl" asChild>
                <Link to="/register">
                  Get Started Free
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/about">Learn More</Link>
              </Button>
            </div>
          </div>

          {/* Hero Code Preview */}
          <div className="mt-16 max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="rounded-xl border border-border bg-card card-shadow overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-secondary/50 border-b border-border">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-destructive/60" />
                  <div className="w-3 h-3 rounded-full bg-warning/60" />
                  <div className="w-3 h-3 rounded-full bg-success/60" />
                </div>
                <span className="text-xs text-muted-foreground font-mono">review.js</span>
              </div>
              <div className="p-6 font-mono text-sm overflow-x-auto">
                <pre className="text-muted-foreground">
                  <code>{`// Code submitted for review
function calculateTotal(items) {
  return items.reduce((sum, item) => {
    return sum + item.price * item.quantity;
  }, 0);
}

// ✓ Reviewer Comment: Clean implementation!
// Consider adding input validation for edge cases.`}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-secondary/30 border-y border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="text-center animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="text-3xl md:text-4xl font-bold gradient-text">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need for{' '}
              <span className="gradient-text">Better Code Reviews</span>
            </h2>
            <p className="text-muted-foreground">
              Our platform provides all the tools to streamline your code review workflow.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-6 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-12 h-12 rounded-lg gradient-bg flex items-center justify-center mb-4 group-hover:glow-effect transition-all duration-300">
                  <feature.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-20 bg-secondary/20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How It <span className="gradient-text">Works</span>
            </h2>
            <p className="text-muted-foreground">
              A simple, streamlined workflow for efficient code reviews.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 relative">
            {/* Connection Line */}
            <div className="hidden md:block absolute top-12 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-primary via-accent to-primary" />

            {workflowSteps.map((step, index) => (
              <div
                key={index}
                className="relative text-center animate-fade-in"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <div className="w-24 h-24 mx-auto rounded-full gradient-bg flex items-center justify-center mb-4 relative z-10 glow-effect">
                  <step.icon className="h-10 w-10 text-primary-foreground" />
                </div>
                <div className="absolute top-8 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-background border-2 border-primary flex items-center justify-center text-sm font-bold z-20">
                  {index + 1}
                </div>
                <h3 className="text-lg font-semibold mb-2 mt-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center rounded-2xl gradient-bg p-12 lg:p-16 glow-effect">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Ready to Improve Your Code Quality?
            </h2>
            <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
              Join thousands of developers who are already using CodeLab to ship better code faster.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-background text-foreground hover:bg-background/90"
                asChild
              >
                <Link to="/register">
                  Create Free Account
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                asChild
              >
                <Link to="/contact">Contact Sales</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
