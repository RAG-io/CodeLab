import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Layout from '../components/layout/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { Code2, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams.get('mode') !== 'register');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    role: 'developer',
  });
  const navigate = useNavigate();

  // Update isLogin when URL changes
  useEffect(() => {
    const mode = searchParams.get('mode');
    setIsLogin(mode !== 'register');
  }, [searchParams]);

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        redirectToDashboard(session.user.id);
      }
    };
    checkUser();
  }, []);

  const redirectToDashboard = async (userId) => {
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    if (roleData?.role === 'admin') {
      navigate('/admin');
    } else if (roleData?.role === 'reviewer') {
      navigate('/reviewer');
    } else {
      navigate('/developer');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Basic client-side validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      toast.error('Please enter a valid email address format.');
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: form.email.trim(),
          password: form.password,
        });

        if (error) throw error;

        toast.success('Logged in successfully!');
        redirectToDashboard(data.user.id);
      } else {
        // console.log('Attempting to register with email:', `"${form.email.trim()}"`);
        const { data, error } = await supabase.auth.signUp({
          email: form.email.trim(),
          password: form.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              name: form.name,
            },
          },
        });

        if (error) throw error;

        // Create user role
        if (data.user) {
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert({ user_id: data.user.id, role: form.role });

          if (roleError) {
            console.error('Role creation error:', roleError);
          }
        }

        toast.success('Account created successfully!');
        redirectToDashboard(data.user.id);
      }
    } catch (error) {
      console.error('Auth Full Error Object:', JSON.stringify(error, null, 2));
      console.error('Auth Error Message:', error.message);

      if (error.message.includes('User already registered')) {
        toast.error('This email is already registered. Please login instead.');
      } else if (error.message.includes('Invalid login credentials')) {
        toast.error('Invalid email or password.');
      } else {
        toast.error(`Error: ${error.message} (Check console for details)`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="p-2 rounded-xl gradient-bg">
                <Code2 className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-2xl font-bold">
              {isLogin ? 'Welcome back' : 'Create an account'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isLogin
                ? 'Sign in to your account to continue'
                : 'Join CodeReview Cloud today'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="John Doe"
                    className="pl-10"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="you@example.com"
                  className="pl-10"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium mb-2">Role</label>
                <div className="grid grid-cols-3 gap-2">
                  {['developer', 'reviewer', 'admin'].map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setForm({ ...form, role })}
                      className={`p-3 rounded-lg border text-sm font-medium transition-all ${form.role === role
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50'
                        }`}
                    >
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          {/* Toggle */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="ml-1 text-primary hover:underline font-medium"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
