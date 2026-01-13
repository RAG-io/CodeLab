import Layout from '../components/layout/Layout';
import {
  Target,
  Users,
  Zap,
  Shield,
  Globe,
  Award,
  Code2,
  Heart
} from 'lucide-react';

export default function About() {
  const values = [
    {
      icon: Code2,
      title: 'Code Quality',
      description: 'We believe that great software starts with great code reviews.',
    },
    {
      icon: Users,
      title: 'Collaboration',
      description: 'Fostering teamwork between developers and reviewers.',
    },
    {
      icon: Shield,
      title: 'Security',
      description: 'Your code is protected with enterprise-grade security.',
    },
    {
      icon: Zap,
      title: 'Efficiency',
      description: 'Streamlined workflows that save time and boost productivity.',
    },
  ];

  const team = [
    { name: 'RAG', role: 'Founder & CEO', avatar: 'R' },
    { name: 'Sanjay', role: 'CTO', avatar: 'S' },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Target className="h-4 w-4" />
              Our Mission
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Making Code Reviews{' '}
              <span className="gradient-text">Simple & Effective</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              CodeReview was built with a simple goal: to help development teams
              collaborate better and ship higher quality code through efficient,
              cloud-based code reviews.
            </p>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 bg-secondary/20 border-y border-border">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <h2 className="text-3xl font-bold mb-6">Our Story</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  CodeReview was born from the frustration of managing code reviews
                  across scattered tools and email threads. As developers ourselves,
                  we knew there had to be a better way.
                </p>
                <p>
                  We built a platform that centralizes the entire code review process
                  in the cloud, making it easy for developers to submit code, reviewers
                  to provide feedback, and administrators to manage the workflow.
                </p>
                <p>
                  Today, CodeReview is trusted by thousands of developers and hundreds
                  of companies worldwide to maintain code quality and foster collaboration.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="p-6 rounded-xl bg-card border border-border card-shadow">
                <Globe className="h-8 w-8 text-primary mb-3" />
                <div className="text-2xl font-bold">50+</div>
                <div className="text-sm text-muted-foreground">Countries</div>
              </div>
              <div className="p-6 rounded-xl bg-card border border-border card-shadow">
                <Users className="h-8 w-8 text-primary mb-3" />
                <div className="text-2xl font-bold">2.5K+</div>
                <div className="text-sm text-muted-foreground">Active Users</div>
              </div>
              <div className="p-6 rounded-xl bg-card border border-border card-shadow">
                <Code2 className="h-8 w-8 text-primary mb-3" />
                <div className="text-2xl font-bold">10K+</div>
                <div className="text-sm text-muted-foreground">Reviews Done</div>
              </div>
              <div className="p-6 rounded-xl bg-card border border-border card-shadow">
                <Award className="h-8 w-8 text-primary mb-3" />
                <div className="text-2xl font-bold">99.9%</div>
                <div className="text-sm text-muted-foreground">Satisfaction</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Our <span className="gradient-text">Values</span>
            </h2>
            <p className="text-muted-foreground">
              The principles that guide everything we do at CodeReview.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <div
                key={index}
                className="group p-6 rounded-xl border border-border bg-card hover:border-primary/50 transition-all duration-300 text-center animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-14 h-14 mx-auto rounded-xl gradient-bg flex items-center justify-center mb-4 group-hover:glow-effect transition-all duration-300">
                  <value.icon className="h-7 w-7 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-secondary/20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Meet Our <span className="gradient-text">Team</span>
            </h2>
            <p className="text-muted-foreground">
              The passionate people behind CodeReview.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-8 max-w-5xl mx-auto">
            {team.map((member, index) => (
              <div
                key={index}
                className="group p-8 rounded-2xl border border-border bg-card hover:border-primary/50 transition-all duration-300 text-center animate-fade-in w-full max-w-xs"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-24 h-24 mx-auto rounded-full gradient-bg flex items-center justify-center mb-6 text-3xl font-bold text-primary-foreground group-hover:scale-110 transition-transform duration-300">
                  {member.avatar}
                </div>
                <h3 className="text-xl font-bold mb-1">{member.name}</h3>
                <p className="text-muted-foreground">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center p-12 rounded-2xl border border-border bg-card card-shadow">
            <Heart className="h-12 w-12 text-primary mx-auto mb-6" />
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Built by Developers, for Developers
            </h2>
            <p className="text-muted-foreground">
              We understand the challenges of code reviews because we've been there.
              That's why we're committed to building the best possible experience
              for development teams everywhere.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}
