import React, { useState, useEffect } from "react";
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarContent, SidebarHeader, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { LayoutDashboard, TrendingUp, Search, Briefcase, Bell, Settings, UserCircle, LogOut, Menu, PieChart, Activity } from "lucide-react";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

interface ShellProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Shell({ children, activeTab, setActiveTab }: ShellProps) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login Error:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  const menuItems = [
    { id: "dashboard", label: "Tổng quan", icon: LayoutDashboard },
    { id: "analysis", label: "Phân tích AI", icon: Activity },
    { id: "scanner", label: "Bộ lọc cổ phiếu", icon: Search },
    { id: "portfolio", label: "Danh mục", icon: PieChart },
    { id: "watchlist", label: "Theo dõi", icon: Bell },
  ];

  return (
    <TooltipProvider>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-slate-950 text-slate-50 font-sans">
          <Sidebar className="border-r border-slate-800 bg-slate-900">
            <SidebarHeader className="p-4 border-bottom border-slate-800">
              <div className="flex items-center gap-2 px-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
                  V
                </div>
                <div className="font-bold text-xl tracking-tight">
                  <span className="text-blue-500">V-Ticker</span> <span className="text-slate-400">AI</span>
                </div>
              </div>
            </SidebarHeader>
            <SidebarContent className="p-2">
              <SidebarGroup>
                <SidebarGroupLabel className="text-slate-500 text-xs uppercase tracking-widest px-4 py-2">Menu chính</SidebarGroupLabel>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton 
                        onClick={() => setActiveTab(item.id)}
                        isActive={activeTab === item.id}
                        className={`w-full justify-start gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                          activeTab === item.id 
                            ? "bg-blue-600/10 text-blue-400 font-medium" 
                            : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                        {item.label}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="p-4 border-t border-slate-800">
              {user ? (
                <div className="flex items-center gap-3 px-2">
                  <Avatar className="w-10 h-10 border-2 border-slate-800">
                    <AvatarImage src={user.photoURL || undefined} />
                    <AvatarFallback className="bg-slate-800">{user.displayName?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-medium truncate">{user.displayName}</p>
                    <button onClick={handleLogout} className="text-xs text-slate-500 hover:text-blue-400 flex items-center gap-1 transition-colors">
                      <LogOut className="w-3 h-3" /> Đăng xuất
                    </button>
                  </div>
                </div>
              ) : (
                <Button onClick={handleLogin} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-6 font-medium shadow-lg shadow-blue-600/20">
                  <UserCircle className="w-5 h-5 mr-2" /> Đăng nhập Google
                </Button>
              )}
            </SidebarFooter>
          </Sidebar>
          
          <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
            <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="text-slate-400 hover:text-slate-100" />
                <div className="h-4 w-px bg-slate-800 mx-2" />
                <h2 className="text-lg font-semibold text-slate-200">
                  {menuItems.find(m => m.id === activeTab)?.label}
                </h2>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative group hidden md:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Tìm kiếm mã CP..." 
                    className="bg-slate-800/50 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-900" />
                </Button>
                <div className="h-8 w-px bg-slate-800" />
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-100">
                  <Settings className="w-5 h-5" />
                </Button>
              </div>
            </header>
            
            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
              {children}
            </div>
          </main>
        </div>
        <Toaster theme="dark" position="top-right" closeButton richColors />
      </SidebarProvider>
    </TooltipProvider>
  );
}
