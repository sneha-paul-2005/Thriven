import { Link } from 'react-router';
import { BarChart3, Sparkles, ArrowRight, Target, Zap, Users } from 'lucide-react';
import { Button } from '../components/Button';
import { LogoIcon } from '../components/LogoIcon';

export function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <LogoIcon className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-semibold">Thriven</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-foreground hover:text-primary transition-colors">Features</a>
              <a href="#how-it-works" className="text-foreground hover:text-primary transition-colors">How it works</a>
              <a href="#pricing" className="text-foreground hover:text-primary transition-colors">Pricing</a>
            </div>

            <div className="flex items-center gap-3">
              <Link to="/login">
                <Button variant="secondary" size="sm">Log in</Button>
              </Link>
              <Link to="/signup">
                <Button variant="primary" size="sm">Get started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl font-bold text-foreground mb-6">
              Growth Intelligence for Startups
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Turn your data into actionable insights. Track metrics, analyze funnels, and grow faster with AI-powered recommendations.
            </p>
            <div className="flex gap-4">
              <Link to="/signup">
                <Button variant="primary" size="lg">
                  Start for free <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Button variant="outline" size="lg">
                See demo
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl p-8 shadow-2xl">
              <div className="bg-card rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Dashboard Overview</h3>
                  <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                </div>
                <div className="space-y-3">
                  <div className="h-3 bg-primary/20 rounded-full w-3/4"></div>
                  <div className="h-3 bg-accent/20 rounded-full w-1/2"></div>
                  <div className="h-3 bg-destructive/20 rounded-full w-5/6"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4">Everything you need to grow</h2>
          <p className="text-xl text-muted-foreground">Powerful tools built for modern startups</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-card rounded-xl p-8 shadow-sm border border-border hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Metrics Engine</h3>
            <p className="text-muted-foreground">
              Track DAU, MAU, retention, conversion and all your critical metrics in real-time.
            </p>
          </div>

          <div className="bg-card rounded-xl p-8 shadow-sm border border-border hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-4">
              <Target className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Funnel Analysis</h3>
            <p className="text-muted-foreground">
              Identify exactly where users drop off and get recommendations to fix it.
            </p>
          </div>

          <div className="bg-card rounded-xl p-8 shadow-sm border border-border hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-destructive/10 rounded-xl flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-destructive" />
            </div>
            <h3 className="text-xl font-semibold mb-3">AI Assistant</h3>
            <p className="text-muted-foreground">
              Ask questions about your data and get instant insights powered by AI.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-secondary/50 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">How it works</h2>
            <p className="text-xl text-muted-foreground">Get started in minutes</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">1. Connect your data</h3>
              <p className="text-muted-foreground">
                Integrate with your existing tools in just a few clicks
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">2. Track what matters</h3>
              <p className="text-muted-foreground">
                Set up your key metrics and funnels automatically
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-destructive rounded-full flex items-center justify-center mx-auto mb-4">
                <LogoIcon className="w-8 h-8 text-destructive-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">3. Grow faster</h3>
              <p className="text-muted-foreground">
                Get AI-powered insights and grow your startup
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <LogoIcon className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-semibold">Thriven</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Growth Intelligence for Startups
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Security</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">About</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2026 Thriven. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
