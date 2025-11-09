import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import logo from "../../assist/navbarLogo.png"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  FileText,
  ShoppingCart,
  CreditCard,
  Users,
  BarChart3,
  Settings,
  Upload,
  Download,
  Database,
  UserCheck,
  Globe,
  TrendingUp,
} from "lucide-react";

const mainItems = [
  { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Dataset Management", url: "/admin/dashboard/datasets", icon: Database },
  { title: "Orders", url: "/admin/dashboard/orders", icon: ShoppingCart },
  { title: "Customers", url: "/admin/dashboard/customers", icon: Users },
];

const analyticsItems = [
  { title: "Analytics", url: "/admin/dashboard/analytics", icon: BarChart3 },
  { title: "Sales Report", url: "/admin/dashboard/sales", icon: TrendingUp },
];

const systemItems = [
  { title: "Settings", url: "/admin/dashboard/settings", icon: Settings },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === "/admin/dashboard") return currentPath === "/admin/dashboard";
    return currentPath.startsWith(path);
  };

  const getNavCls = (path: string) =>
    isActive(path)
      ? "bg-sidebar-accent text-sidebar-primary font-medium"
      : "hover:bg-sidebar-accent/50 text-sidebar-foreground";

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarContent className="bg-sidebar border-r border-sidebar-border">
        {/* Logo Section */}
        <div className="p-4 border-b border-sidebar-border">
          {!collapsed ? (
            <div className="flex items-center gap-3">
             <div className="w-8 h-8  flex items-center justify-center">
              <img  src={logo} className="w-8 h-8 text-white" />
            </div>
              <div>
                <h2 className="text-lg font-bold text-sidebar-foreground">DataHub</h2>
                {/* <p className="text-xs text-sidebar-foreground/60">Admin Panel</p> */}
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 bg-sidebar-primary rounded-md flex items-center justify-center mx-auto">
              <FileText className="w-4 h-4 text-sidebar-primary-foreground" />
            </div>
          )}
        </div>

        {/* Main Navigation */}
        <SidebarGroup>
          {!collapsed }
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls(item.url)}>
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      {!collapsed && <span className="ml-3">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Analytics Section */}
        {/* <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Analytics</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {analyticsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls(item.url)}>
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      {!collapsed && <span className="ml-3">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup> */}

        {/* System Section */}
        {/* <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>System</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {systemItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls(item.url)}>
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      {!collapsed && <span className="ml-3">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup> */}
      </SidebarContent>
    </Sidebar>
  );
}