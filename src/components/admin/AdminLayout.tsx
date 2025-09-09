import React from 'react';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

interface AdminLayoutProps {
  title: string;
  onLogout: () => void;
  sidebar: React.ReactNode;
  children: React.ReactNode;
}

export default function AdminLayout({ title, onLogout, sidebar, children }: AdminLayoutProps) {
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader />
        <SidebarContent>{sidebar}</SidebarContent>
        <SidebarFooter />
      </Sidebar>
      <SidebarInset className="flex flex-col">
        <header className="flex items-center justify-between h-16 px-4 border-b">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <h1 className="text-xl font-bold">{title}</h1>
          </div>
          <Button variant="outline" onClick={onLogout}>Logout</Button>
        </header>
        <div className="flex-1 overflow-auto p-4">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
