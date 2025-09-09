import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ChatPanelProps {
  tournamentId: string;
}

export function ChatPanel({ tournamentId }: ChatPanelProps) {
  const [newMessage, setNewMessage] = useState('');

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    // TODO: Implement chat functionality with proper message table
    console.log('Sending message:', newMessage);
    setNewMessage('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chat</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48 overflow-y-auto space-y-2 mb-4 p-4 bg-muted/50 rounded-md">
          <div className="text-center text-sm text-muted-foreground">
            Chat functionality coming soon...
          </div>
        </div>
        <div className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message"
            className="flex-1"
          />
          <Button onClick={sendMessage} disabled={!newMessage.trim()}>Send</Button>
        </div>
      </CardContent>
    </Card>
  );
}

