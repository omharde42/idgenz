import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { ThemeToggle } from '@/components/ThemeToggle';
import { PasswordStrengthIndicator, validatePasswordStrength } from '@/components/auth/PasswordStrengthIndicator';
import idcraftLogo from '@/assets/idcraft-logo.jpeg';

const emailSchema = z.string().email('Please enter a valid email address');

const Auth = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [activeTab, setActiveTab] = useState('login');

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        navigate('/');
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const validateForm = (isSignUp: boolean): boolean => {
    try {
      emailSchema.parse(email);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return false;
      }
    }

    if (isSignUp) {
      const strengthResult = validatePasswordStrength(password);
      if (!strengthResult.isValid) {
        toast.error(strengthResult.message);
        return false;
      }
    } else {
      if (password.length < 6) {
        toast.error('Password must be at least 6 characters');
        return false;
      }
    }

    if (isSignUp && password !== confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }

    return true;
  };

  const sendLockoutNotification = async (attemptType: 'login' | 'signup', lockoutMinutes: number) => {
    try {
      await supabase.functions.invoke('send-lockout-notification', {
        body: {
          email: email.toLowerCase(),
          attemptType,
          lockoutMinutes
        }
      });
    } catch (error) {
      console.error('Failed to send lockout notification:', error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(false)) return;

    setIsLoading(true);
    try {
      // Check rate limit before attempting login
      const { data: isAllowed, error: rateLimitError } = await supabase.rpc('check_rate_limit', {
        p_identifier: email.toLowerCase(),
        p_attempt_type: 'login',
        p_max_attempts: 5,
        p_window_minutes: 15
      });

      if (rateLimitError) {
        console.error('Rate limit check error:', rateLimitError);
      }

      if (isAllowed === false) {
        toast.error('Too many login attempts. Please try again in 15 minutes.');
        // Send lockout notification
        await sendLockoutNotification('login', 15);
        setIsLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // Record the attempt
      await supabase.rpc('record_auth_attempt', {
        p_identifier: email.toLowerCase(),
        p_attempt_type: 'login',
        p_success: !error
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password. Please try again.');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success('Logged in successfully!');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(true)) return;

    setIsLoading(true);
    try {
      // Check rate limit before attempting signup
      const { data: isAllowed, error: rateLimitError } = await supabase.rpc('check_rate_limit', {
        p_identifier: email.toLowerCase(),
        p_attempt_type: 'signup',
        p_max_attempts: 3,
        p_window_minutes: 60
      });

      if (rateLimitError) {
        console.error('Rate limit check error:', rateLimitError);
      }

      if (isAllowed === false) {
        toast.error('Too many signup attempts. Please try again in 1 hour.');
        // Send lockout notification
        await sendLockoutNotification('signup', 60);
        setIsLoading(false);
        return;
      }

      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      // Record the attempt
      await supabase.rpc('record_auth_attempt', {
        p_identifier: email.toLowerCase(),
        p_attempt_type: 'signup',
        p_success: !error
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          toast.error('This email is already registered. Please login instead.');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success('Account created successfully! You can now login.');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-md">
        {/* Logo Header */}
        <div className="flex flex-col items-center justify-center mb-8">
          <img src={idcraftLogo} alt="IDCRAFT Logo" className="w-32 h-32 object-contain rounded-xl shadow-lg" />
        </div>

        <Card className="border-border shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Welcome</CardTitle>
            <CardDescription>Sign in to your account or create a new one</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Password
                    </Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Logging in...
                      </>
                    ) : (
                      'Login'
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Password
                    </Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <PasswordStrengthIndicator password={password} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Confirm Password
                    </Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default Auth;
