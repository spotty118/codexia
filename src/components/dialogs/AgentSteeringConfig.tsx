import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { useAgentSteeringStore } from '@/stores/AgentSteeringStore';
import { useFolderStore } from '@/stores/FolderStore';
import type { SteeringTrigger, SteeringAction } from '@/types/agentSteering';
import { DEFAULT_STEERING_TEMPLATES } from '@/types/agentSteering';
import { getAppTypeDisplayName, getAppTypeFocusGuidance } from '@/utils/appTypeDetection';
import { 
  Target, 
  Plus, 
  Settings, 
  Trash2, 
  Brain,
  Copy,
  Globe,
  Smartphone,
  Monitor,
  Server,
  Package,
  HelpCircle,
  Lightbulb
} from 'lucide-react';

interface AgentSteeringConfigProps {
  trigger?: React.ReactNode;
}

export const AgentSteeringConfig: React.FC<AgentSteeringConfigProps> = ({ trigger }) => {
  const [open, setOpen] = useState(false);
  const [selectedSpec, setSelectedSpec] = useState<string | null>(null);
  const [newSpecName, setNewSpecName] = useState('');
  const [newSpecDescription, setNewSpecDescription] = useState('');
  const [isCreatingSpec, setIsCreatingSpec] = useState(false);
  
  const { currentFolder } = useFolderStore();
  
  const {
    specs,
    createSpec,
    deleteSpec,
    toggleSpec,
    createSpecFromTemplate,
    getSpecActivationCount,
  } = useAgentSteeringStore();

  const handleCreateSpec = async () => {
    if (!newSpecName.trim()) return;
    
    setIsCreatingSpec(true);
    try {
      const id = await createSpec(newSpecName.trim(), newSpecDescription.trim() || undefined);
      setSelectedSpec(id);
      setNewSpecName('');
      setNewSpecDescription('');
    } catch (error) {
      console.error('Failed to create spec:', error);
    } finally {
      setIsCreatingSpec(false);
    }
  };

  const handleCreateFromTemplate = async (templateIndex: number) => {
    setIsCreatingSpec(true);
    try {
      const id = await createSpecFromTemplate(templateIndex);
      if (id) {
        setSelectedSpec(id);
      }
    } catch (error) {
      console.error('Failed to create spec from template:', error);
    } finally {
      setIsCreatingSpec(false);
    }
  };

  const getAppTypeIcon = (appType?: string) => {
    if (!appType) return <HelpCircle className="h-4 w-4 text-muted-foreground" />;
    
    switch (appType) {
      case 'web':
        return <Globe className="h-4 w-4 text-blue-500" />;
      case 'mobile':
        return <Smartphone className="h-4 w-4 text-green-500" />;
      case 'desktop':
        return <Monitor className="h-4 w-4 text-purple-500" />;
      case 'backend':
        return <Server className="h-4 w-4 text-orange-500" />;
      case 'library':
        return <Package className="h-4 w-4 text-cyan-500" />;
      default:
        return <HelpCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getAppTypeColor = (confidence?: string) => {
    switch (confidence) {
      case 'high':
        return 'border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900/20';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-900/20';
      case 'low':
        return 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/20';
      default:
        return 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/20';
    }
  };

  const formatTrigger = (trigger: SteeringTrigger): string => {
    switch (trigger.type) {
      case 'time_interval':
        return `Every ${Math.floor(trigger.intervalMs / (1000 * 60))} minutes`;
      case 'plan_step':
        return `When plan step is ${trigger.stepStatus}`;
      case 'message_count':
        return `After ${trigger.count} messages`;
      case 'idle_time':
        return `After ${Math.floor(trigger.idleMs / (1000 * 60))} minutes idle`;
      case 'context_change':
        return `On context change${trigger.filePattern ? ` (${trigger.filePattern})` : ''}`;
      case 'manual':
        return 'Manual trigger';
      default:
        return 'Unknown trigger';
    }
  };

  const formatAction = (action: SteeringAction): string => {
    switch (action.type) {
      case 'reminder':
        return `Reminder (${action.priority}): ${action.message}`;
      case 'suggestion':
        return `Suggestion: ${action.content}`;
      case 'constraint':
        return `Constraint: ${action.rules.join(', ')}`;
      case 'redirect':
        return `Redirect to: ${action.new_focus}`;
      default:
        return 'Unknown action';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Target className="h-4 w-4 mr-2" />
            Agent Steering
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Agent Steering Configuration
          </DialogTitle>
          <DialogDescription>
            Configure spec-driven agent steering with reminders to guide agent behavior.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="specs" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="specs">Steering Specs</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
          </TabsList>

          <TabsContent value="specs" className="space-y-4">
            {/* Create new spec */}
            <Card className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Create New Steering Spec</h3>
                  {currentFolder && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Target className="h-3 w-3" />
                      <span>Auto-detecting app type from: {currentFolder.split('/').pop()}</span>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="spec-name">Name</Label>
                    <Input
                      id="spec-name"
                      value={newSpecName}
                      onChange={(e) => setNewSpecName(e.target.value)}
                      placeholder="e.g., Progress Reminder"
                    />
                  </div>
                  <div>
                    <Label htmlFor="spec-description">Description (optional)</Label>
                    <Input
                      id="spec-description"
                      value={newSpecDescription}
                      onChange={(e) => setNewSpecDescription(e.target.value)}
                      placeholder="Brief description of what this spec does"
                    />
                  </div>
                </div>
                <Button onClick={handleCreateSpec} disabled={!newSpecName.trim() || isCreatingSpec}>
                  <Plus className="h-4 w-4 mr-2" />
                  {isCreatingSpec ? 'Creating...' : 'Create Spec'}
                </Button>
              </div>
            </Card>

            {/* Existing specs */}
            <div className="space-y-3">
              {Object.values(specs).map((spec) => (
                <Card key={spec.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-sm font-medium">{spec.name}</h3>
                        <Switch
                          checked={spec.enabled}
                          onCheckedChange={() => toggleSpec(spec.id)}
                        />
                        <Badge variant={spec.enabled ? 'default' : 'secondary'}>
                          {spec.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                        <Badge variant="outline">
                          {getSpecActivationCount(spec.id)} activations
                        </Badge>
                        {spec.app_type && (
                          <div className="flex items-center gap-1">
                            {getAppTypeIcon(spec.app_type.details?.primary_language || 'unknown')}
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getAppTypeColor(spec.app_type.confidence)}`}
                            >
                              {spec.app_type.framework}
                            </Badge>
                          </div>
                        )}
                      </div>
                      
                      {spec.description && (
                        <p className="text-sm text-muted-foreground">{spec.description}</p>
                      )}
                      
                      {/* App Type Information */}
                      {spec.app_type && (
                        <div className={`p-3 rounded-lg border-l-4 ${getAppTypeColor(spec.app_type.confidence)}`}>
                          <div className="flex items-start gap-2">
                            {getAppTypeIcon(spec.app_type.details?.primary_language)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium">
                                  {getAppTypeDisplayName({
                                    type: (spec.app_type.details?.primary_language || 'unknown') as any,
                                    framework: spec.app_type.framework,
                                    detected_at: spec.app_type.detected_at,
                                    workspace_path: spec.app_type.workspace_path || '',
                                    confidence: spec.app_type.confidence || 'low',
                                    details: spec.app_type.details || {}
                                  })}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {spec.app_type.confidence} confidence
                                </Badge>
                              </div>
                              
                              {/* App Type Guidance */}
                              <div className="space-y-1">
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Lightbulb className="h-3 w-3" />
                                  <span>Focus areas for this app type:</span>
                                </div>
                                <div className="pl-4">
                                  {getAppTypeFocusGuidance({
                                    type: (spec.app_type.details?.primary_language || 'unknown') as any,
                                    framework: spec.app_type.framework,
                                    detected_at: spec.app_type.detected_at,
                                    workspace_path: spec.app_type.workspace_path || '',
                                    confidence: spec.app_type.confidence || 'low',
                                    details: spec.app_type.details || {}
                                  }).slice(0, 2).map((guidance, index) => (
                                    <div key={index} className="text-xs text-muted-foreground">
                                      • {guidance}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-muted-foreground">Triggers:</div>
                        {spec.triggers.length > 0 ? (
                          spec.triggers.map((trigger, index) => (
                            <Badge key={index} variant="outline" className="mr-1 mb-1">
                              {formatTrigger(trigger)}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">No triggers configured</span>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-muted-foreground">Actions:</div>
                        {spec.actions.length > 0 ? (
                          spec.actions.map((action, index) => (
                            <div key={index} className="text-xs text-muted-foreground">
                              {formatAction(action)}
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">No actions configured</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedSpec(selectedSpec === spec.id ? null : spec.id)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteSpec(spec.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {selectedSpec === spec.id && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="text-sm text-muted-foreground">
                        Detailed configuration for triggers and actions would be implemented here.
                        For now, specs can be created from templates.
                      </div>
                    </div>
                  )}
                </Card>
              ))}
              
              {Object.keys(specs).length === 0 && (
                <Card className="p-8 text-center">
                  <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Steering Specs</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first steering spec or use a template to get started.
                  </p>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Predefined Templates</h3>
              <p className="text-sm text-muted-foreground">
                Choose from these common steering patterns to quickly set up agent guidance.
              </p>
              
              {DEFAULT_STEERING_TEMPLATES.map((template, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <h4 className="text-sm font-medium">{template.name}</h4>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                      
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-muted-foreground">Triggers:</div>
                        {template.triggers.map((trigger, triggerIndex) => (
                          <Badge key={triggerIndex} variant="outline" className="mr-1">
                            {formatTrigger(trigger)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCreateFromTemplate(index)}
                      disabled={isCreatingSpec}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      {isCreatingSpec ? 'Creating...' : 'Use Template'}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-500" />
                  <div>
                    <div className="text-2xl font-bold">{Object.keys(specs).length}</div>
                    <div className="text-sm text-muted-foreground">Total Specs</div>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-green-500" />
                  <div>
                    <div className="text-2xl font-bold">
                      {Object.values(specs).filter(s => s.enabled).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Active Specs</div>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-purple-500" />
                  <div>
                    <div className="text-2xl font-bold">
                      {Object.values(specs).reduce((sum, spec) => sum + getSpecActivationCount(spec.id), 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Activations</div>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};