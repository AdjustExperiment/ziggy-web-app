import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Users, FileText, AlertTriangle } from 'lucide-react';
import { AccountsManager } from './security/AccountsManager';
import { AuditLogsViewer } from './security/AuditLogsViewer';
import { SecurityFlagsManager } from './security/SecurityFlagsManager';

export function SecurityDashboard() {
  const [activeTab, setActiveTab] = useState('accounts');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Security Dashboard</h2>
          <p className="text-muted-foreground">Monitor accounts, audit logs, and security flags</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="accounts" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Account Management
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Audit Logs
          </TabsTrigger>
          <TabsTrigger value="flags" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Security Flags
          </TabsTrigger>
        </TabsList>

        <TabsContent value="accounts">
          <AccountsManager />
        </TabsContent>

        <TabsContent value="logs">
          <AuditLogsViewer />
        </TabsContent>

        <TabsContent value="flags">
          <SecurityFlagsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}