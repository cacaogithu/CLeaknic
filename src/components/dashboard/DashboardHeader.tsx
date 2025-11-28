import { NavLink } from "@/components/NavLink";
import logo from "@/assets/evidens-logo.png";

const DashboardHeader = () => {
  return (
    <header className="border-b border-border bg-secondary shadow-md">
      {/* Navigation Bar */}
      <div className="bg-secondary border-b border-secondary/20">
        <div className="container mx-auto px-4">
          <nav className="flex h-16 items-center space-x-8 text-sm font-medium">
            <div className="flex items-center gap-3">
              <img src={logo} alt="EviDenS Clinic" className="h-10 w-10 object-contain" />
              <span className="text-xl font-bold text-secondary-foreground">EviDenS</span>
            </div>
            <div className="flex items-center gap-6">
              <NavLink to="/dashboard" className="text-secondary-foreground/80 transition-colors hover:text-primary" activeClassName="text-primary font-semibold">
                Dashboard
              </NavLink>
              <NavLink to="/pipeline" className="text-secondary-foreground/80 transition-colors hover:text-primary" activeClassName="text-primary font-semibold">
                Pipeline
              </NavLink>
              <NavLink to="/conversations" className="text-secondary-foreground/80 transition-colors hover:text-primary" activeClassName="text-primary font-semibold">
                Conversas
              </NavLink>
              <NavLink to="/clients" className="text-secondary-foreground/80 transition-colors hover:text-primary" activeClassName="text-primary font-semibold">
                Clientes
              </NavLink>
              <NavLink to="/settings" className="text-secondary-foreground/80 transition-colors hover:text-primary" activeClassName="text-primary font-semibold">
                Configurações
              </NavLink>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};
export default DashboardHeader;