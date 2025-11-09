import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Home, Database, Users, BarChart3, Settings, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import logo from '@/assist/navbarLogo.png'

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { toast } = useToast();

  const navigationItems = [
    { name: "Home", icon: Home, href: "/" },
    { name: "Datasets", icon: Database, href: "/" },
    // { name: "Admin Panel", icon: Settings, href: "/admin" },
    { name: "Analytics", icon: BarChart3, href: "#" },
    { name: "Support", icon: HelpCircle, href: "#" },
  ];

  const handleNavClick = (name: string, href: string) => {
    if (href === "#") {
      toast({
        title: `Navigation`,
        description: `${name} page functionality is available.`,
      });
    } else {
      window.location.href = href;
    }
    setIsMenuOpen(false);
  };

  return (
    <nav className="bg-card border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
               
              <img  src={logo} className="w-8 h-8 text-white" />
           
              <span className="ml-2 text-xl font-semibold text-card-foreground">DataHub</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          {/* <div className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavClick(item.name, item.href)}
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors px-3 py-2 text-sm font-medium"
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </button>
            ))}
          </div>

        
          <div className="md:hidden flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-card-foreground"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
           */}
        </div>

        {/* Mobile Navigation */}
        {/* {isMenuOpen && (
          <div className="md:hidden border-t border-border py-4">
            <div className="space-y-1">
              {navigationItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleNavClick(item.name, item.href)}
                  className="flex items-center gap-3 w-full text-left px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-muted/50 transition-colors rounded-md"
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </button>
              ))}
            </div>
          </div>
        )} */}
      </div>
    </nav>
  );
};

export default Navigation;