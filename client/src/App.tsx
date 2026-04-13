import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Link, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Senado from "./pages/Senado";
import Noticias from "./pages/Noticias";
import Pesquisas from "./pages/Pesquisas";
import { TrendingUp, Building2, Newspaper, BarChart2, Flag } from "lucide-react";

function NavBar() {
  const [location] = useLocation();
  const links = [
    { href: "/", label: "Presidente", icon: TrendingUp },
    { href: "/senado", label: "Senado", icon: Building2 },
    { href: "/pesquisas", label: "Pesquisas", icon: BarChart2 },
    { href: "/noticias", label: "Notícias", icon: Newspaper },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0a0f1e] border-b border-white/10 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4">
        {/* Logo + título */}
        <div className="flex items-center gap-3 py-3 border-b border-white/5">
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
            <Flag className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-sm leading-tight">Painel Eleitoral</h1>
            <p className="text-white/40 text-xs">Brasil 2026</p>
          </div>
        </div>
        {/* Nav links */}
        <nav className="flex overflow-x-auto scrollbar-hide">
          {links.map(({ href, label, icon: Icon }) => {
            const active = location === href;
            return (
              <Link key={href} href={href}>
                <a className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  active
                    ? "border-green-400 text-green-400"
                    : "border-transparent text-white/50 hover:text-white/80"
                }`}>
                  <Icon className="w-4 h-4" />
                  {label}
                </a>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/senado" component={Senado} />
      <Route path="/pesquisas" component={Pesquisas} />
      <Route path="/noticias" component={Noticias} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <div className="min-h-screen bg-[#060b18] text-white">
            <NavBar />
            <main className="max-w-7xl mx-auto px-4 py-6">
              <Router />
            </main>
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
