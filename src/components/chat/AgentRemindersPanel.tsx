import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAgentSteeringStore } from '@/stores/AgentSteeringStore';
import type { AgentReminder } from '@/types/agentSteering';
import { 
  Bell, 
  AlertCircle, 
  Info, 
  X,
  Clock,
  Target
} from 'lucide-react';

interface AgentRemindersPanelProps {
  className?: string;
  conversationId?: string;
}

export const AgentRemindersPanel: React.FC<AgentRemindersPanelProps> = ({ 
  className = '',
  conversationId 
}) => {
  const { 
    getActiveReminders, 
    dismissReminder, 
    cleanupExpiredReminders 
  } = useAgentSteeringStore();

  // Cleanup expired reminders on render
  React.useEffect(() => {
    cleanupExpiredReminders();
  }, [cleanupExpiredReminders]);

  const activeReminders = getActiveReminders().filter(reminder => 
    !conversationId || reminder.conversation_id === conversationId
  );

  if (activeReminders.length === 0) {
    return null;
  }

  const getPriorityIcon = (priority: AgentReminder['priority']) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <Bell className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getPriorityColor = (priority: AgentReminder['priority']) => {
    switch (priority) {
      case 'high':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20';
      case 'low':
        return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - timestamp;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Target className="h-4 w-4" />
        Agent Reminders ({activeReminders.length})
      </div>
      
      {activeReminders.map((reminder) => (
        <Card 
          key={reminder.id} 
          className={`p-3 border-l-4 ${getPriorityColor(reminder.priority)}`}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {getPriorityIcon(reminder.priority)}
            </div>
            
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-foreground">
                  {reminder.message}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                  onClick={() => dismissReminder(reminder.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <Badge variant="outline" className="h-5">
                  {reminder.priority}
                </Badge>
                
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTimestamp(reminder.created_at)}
                </div>
                
                {reminder.scheduled_for && reminder.scheduled_for > Date.now() && (
                  <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                    <Clock className="h-3 w-3" />
                    Scheduled for {formatTimestamp(reminder.scheduled_for)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};