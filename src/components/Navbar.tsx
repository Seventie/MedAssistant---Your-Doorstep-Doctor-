import { Link, useLocation } from "react-router-dom";
import { Activity, Brain, Search, Pill, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const location = useLocation();
  
  const links = [
    { path: "/", label: "Home", icon: Activity },
    { path: "/medical-qa", label: "Medical Q&A", icon: Brain },
    { path: "/medicine-search", label: "Medicine Search", icon: Search },
    { path: "/recommendations", label: "Recommendations", icon: Pill },
    //{ path: "/visualizations", label: "Visualizations", icon: BarChart3 },
  ];

  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <Activity className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">Medical AI</span>
          </Link>
          
          <div className="flex items-center space-x-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Button
                  key={link.path}
                  asChild
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                >
                  <Link to={link.path} className="flex items-center space-x-2">
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{link.label}</span>
                  </Link>
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
