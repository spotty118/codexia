import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useCoreStore, type Provider } from "@/stores/CoreStore";
import { Settings, Zap, Brain, Bot } from "lucide-react";

/**
 * Simplified settings focused on core provider configuration
 * Includes preparation for LangChain and AG UI integration
 */

export const SimpleSettings: React.FC = () => {
  const {
    providers,
    currentModel,
    currentProvider,
    reasoningEffort,
    setCurrentModel,
    setReasoningEffort,
    setProviderApiKey,
    theme,
    setTheme,
  } = useCoreStore();

  const [apiKeys, setApiKeys] = useState<Record<Provider, string>>(
    Object.fromEntries(
      Object.entries(providers).map(([provider, config]) => [provider, config.apiKey])
    ) as Record<Provider, string>
  );

  const handleSaveApiKey = (provider: Provider) => {
    setProviderApiKey(provider, apiKeys[provider]);
  };

  const handleModelSelect = (provider: Provider, model: string) => {
    setCurrentModel(model, provider);
  };

  const getProviderIcon = (provider: Provider) => {
    switch (provider) {
      case 'langchain': return <Brain className="w-4 h-4" />;
      case 'openai': return <Bot className="w-4 h-4" />;
      default: return <Zap className="w-4 h-4" />;
    }
  };

  const getProviderDescription = (provider: Provider) => {
    switch (provider) {
      case 'langchain': 
        return "Advanced LangChain agents and custom workflows";
      case 'openai': 
        return "OpenAI's GPT models for coding assistance";
      case 'google': 
        return "Google's Gemini models";
      case 'ollama': 
        return "Local open-source models";
      case 'openrouter': 
        return "Access to multiple model providers";
      case 'xai': 
        return "Grok models from xAI";
      default: 
        return "AI provider for coding assistance";
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Simple Settings</h1>
      </div>

      <Tabs defaultValue="providers" className="space-y-6">
        <TabsList>
          <TabsTrigger value="providers">AI Providers</TabsTrigger>
          <TabsTrigger value="models">Models & Reasoning</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-4">
          <div className="grid gap-4">
            {Object.entries(providers).map(([providerKey, config]) => {
              const provider = providerKey as Provider;
              const isActive = currentProvider === provider;
              
              return (
                <Card key={provider} className={isActive ? "border-primary" : ""}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getProviderIcon(provider)}
                        <CardTitle className="capitalize">{provider}</CardTitle>
                        {isActive && <Badge variant="default">Active</Badge>}
                        {provider === 'langchain' && <Badge variant="secondary">New</Badge>}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {getProviderDescription(provider)}
                    </p>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <Label htmlFor={`${provider}-api-key`}>API Key</Label>
                        <Input
                          id={`${provider}-api-key`}
                          type="password"
                          placeholder={
                            provider === 'langchain' 
                              ? "Optional - for custom endpoints"
                              : provider === 'ollama' 
                              ? "Not required for local Ollama"
                              : "Enter your API key"
                          }
                          value={apiKeys[provider]}
                          onChange={(e) => setApiKeys(prev => ({ ...prev, [provider]: e.target.value }))}
                        />
                      </div>
                      <div className="flex items-end">
                        <Button 
                          onClick={() => handleSaveApiKey(provider)}
                          className="w-full"
                          variant={apiKeys[provider] !== config.apiKey ? "default" : "outline"}
                        >
                          Save
                        </Button>
                      </div>
                    </div>

                    {config.baseUrl && (
                      <div>
                        <Label>Base URL</Label>
                        <Input value={config.baseUrl} disabled />
                      </div>
                    )}

                    <div>
                      <Label>Available Models</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {config.models.map((model) => (
                          <Badge
                            key={model}
                            variant={currentModel === model && currentProvider === provider ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => handleModelSelect(provider, model)}
                          >
                            {model}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Model Selection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Active Provider</Label>
                <div className="flex items-center gap-2 mt-1">
                  {getProviderIcon(currentProvider as Provider)}
                  <span className="capitalize font-medium">{currentProvider}</span>
                </div>
              </div>

              <div>
                <Label>Active Model</Label>
                <div className="mt-1">
                  <Badge variant="default" className="text-sm px-3 py-1">
                    {currentModel}
                  </Badge>
                </div>
              </div>

              <div>
                <Label htmlFor="reasoning-effort">Reasoning Effort</Label>
                <Select value={reasoningEffort} onValueChange={setReasoningEffort}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minimal">Minimal - Quick responses</SelectItem>
                    <SelectItem value="low">Low - Basic reasoning</SelectItem>
                    <SelectItem value="medium">Medium - Balanced (Recommended)</SelectItem>
                    <SelectItem value="high">High - Deep thinking</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* LangChain specific settings */}
          {currentProvider === 'langchain' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  LangChain Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    LangChain integration enables advanced agent workflows, tool calling, 
                    and custom AI pipelines for enhanced coding assistance.
                  </p>
                  
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm">
                      <strong>Ready for LangChain:</strong> This simplified architecture makes it easy 
                      to integrate LangChain agents and workflows without conflicts with the existing MCP system.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Theme Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="theme">Theme</Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};