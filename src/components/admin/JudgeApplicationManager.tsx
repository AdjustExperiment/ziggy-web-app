import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function JudgeApplicationManager() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Judge Applications</h2>
        <p className="text-muted-foreground">
          Review and manage judge applications
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Applications</CardTitle>
          <CardDescription>Applications awaiting review</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No pending applications at this time.</p>
        </CardContent>
      </Card>
    </div>
  );
}