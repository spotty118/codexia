import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { useCodebaseSteeringStore } from '@/stores/CodebaseSteeringStore';
import type { 
  ProductOverview,
  TechnologyStack,
  ProjectStructure
} from '@/types/codebaseSteering';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Download,
  RefreshCw,
  Code,
  Target
} from 'lucide-react';

interface CodebaseSteeringDialogProps {
  trigger?: React.ReactNode;
}

export const CodebaseSteeringDialog: React.FC<CodebaseSteeringDialogProps> = ({ trigger }) => {
  const [open, setOpen] = useState(false);
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null);
  const [newCodebaseName, setNewCodebaseName] = useState('');
  const [newCodebasePath, setNewCodebasePath] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedFiles, setGeneratedFiles] = useState<{ product: string; tech: string; structure: string } | null>(null);

  const {
    configurations,
    current_codebase,
    createConfiguration,
    updateConfiguration,
    deleteConfiguration,
    setCurrentCodebase,
    generateSteeringFiles,
    detectProjectStructure,
    detectTechnologyStack,
    suggestProductOverview,
  } = useCodebaseSteeringStore();

  const selectedConfig = selectedConfigId ? configurations[selectedConfigId] : null;

  useEffect(() => {
    if (current_codebase && !selectedConfigId) {
      setSelectedConfigId(current_codebase);
    }
  }, [current_codebase, selectedConfigId]);

  const handleCreateConfiguration = async () => {
    if (!newCodebaseName.trim() || !newCodebasePath.trim()) return;
    
    const id = createConfiguration(newCodebaseName.trim(), newCodebasePath.trim());
    setSelectedConfigId(id);
    setNewCodebaseName('');
    setNewCodebasePath('');

    // Auto-detect project information
    try {
      const [structure, tech, product] = await Promise.all([
        detectProjectStructure(newCodebasePath.trim()),
        detectTechnologyStack(newCodebasePath.trim()),
        suggestProductOverview(newCodebaseName.trim(), newCodebasePath.trim()),
      ]);

      updateConfiguration(id, {
        structure: { ...configurations[id].structure, ...structure },
        tech: { ...configurations[id].tech, ...tech },
        product: { ...configurations[id].product, ...product },
      });
    } catch (error) {
      console.warn('Auto-detection failed:', error);
    }
  };

  const handleGenerateSteeringFiles = async () => {
    if (!selectedConfigId) return;
    
    setIsGenerating(true);
    try {
      const files = await generateSteeringFiles(selectedConfigId);
      setGeneratedFiles(files);
    } catch (error) {
      console.error('Failed to generate steering files:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateProduct = (updates: Partial<ProductOverview>) => {
    if (!selectedConfigId) return;
    const config = configurations[selectedConfigId];
    updateConfiguration(selectedConfigId, {
      product: { ...config.product, ...updates },
    });
  };

  const handleUpdateTech = (updates: Partial<TechnologyStack>) => {
    if (!selectedConfigId) return;
    const config = configurations[selectedConfigId];
    updateConfiguration(selectedConfigId, {
      tech: { ...config.tech, ...updates },
    });
  };

  const handleUpdateStructure = (updates: Partial<ProjectStructure>) => {
    if (!selectedConfigId) return;
    const config = configurations[selectedConfigId];
    updateConfiguration(selectedConfigId, {
      structure: { ...config.structure, ...updates },
    });
  };

  const handleDownloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Generate Steering
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Codebase Steering Files Generator
          </DialogTitle>
          <DialogDescription>
            Generate steering files (product.md, tech.md, structure.md) to guide AI agents working on your codebase.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="configurations" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="configurations">Codebases</TabsTrigger>
            <TabsTrigger value="product">Product</TabsTrigger>
            <TabsTrigger value="tech">Tech Stack</TabsTrigger>
            <TabsTrigger value="structure">Structure</TabsTrigger>
          </TabsList>

          <TabsContent value="configurations" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Codebase Configurations</h3>
                <div className="flex gap-2">
                  {selectedConfigId && (
                    <Button onClick={handleGenerateSteeringFiles} disabled={isGenerating}>
                      {isGenerating ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      Generate Files
                    </Button>
                  )}
                </div>
              </div>

              {/* Create new configuration */}
              <Card className="p-4">
                <div className="space-y-3">
                  <h4 className="font-medium">Add New Codebase</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="codebase-name">Codebase Name</Label>
                      <Input
                        id="codebase-name"
                        value={newCodebaseName}
                        onChange={(e) => setNewCodebaseName(e.target.value)}
                        placeholder="My Project"
                      />
                    </div>
                    <div>
                      <Label htmlFor="codebase-path">Codebase Path</Label>
                      <Input
                        id="codebase-path"
                        value={newCodebasePath}
                        onChange={(e) => setNewCodebasePath(e.target.value)}
                        placeholder="/path/to/project"
                      />
                    </div>
                  </div>
                  <Button onClick={handleCreateConfiguration} disabled={!newCodebaseName.trim() || !newCodebasePath.trim()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Configuration
                  </Button>
                </div>
              </Card>

              {/* Existing configurations */}
              <div className="space-y-3">
                {Object.entries(configurations).map(([id, config]) => (
                  <Card 
                    key={id} 
                    className={`p-4 cursor-pointer transition-colors ${
                      selectedConfigId === id ? 'bg-primary/5 border-primary' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedConfigId(id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{config.codebase_name}</h4>
                          {current_codebase === id && (
                            <Badge variant="default">Current</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{config.codebase_path}</p>
                        <p className="text-xs text-muted-foreground">
                          Updated: {new Date(config.generated_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentCodebase(id);
                          }}
                        >
                          Set as Current
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteConfiguration(id);
                            if (selectedConfigId === id) {
                              setSelectedConfigId(null);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}

                {Object.keys(configurations).length === 0 && (
                  <Card className="p-8 text-center">
                    <Code className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Codebases Configured</h3>
                    <p className="text-muted-foreground">
                      Add your first codebase configuration to generate steering files.
                    </p>
                  </Card>
                )}
              </div>

              {/* Generated files preview */}
              {generatedFiles && (
                <Card className="p-4">
                  <h4 className="font-medium mb-3">Generated Steering Files</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">product.md</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadFile(generatedFiles.product, 'product.md')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">tech.md</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadFile(generatedFiles.tech, 'tech.md')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">structure.md</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadFile(generatedFiles.structure, 'structure.md')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="product" className="space-y-4">
            {selectedConfig ? (
              <ProductConfigurationForm
                product={selectedConfig.product}
                onUpdate={handleUpdateProduct}
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Select a codebase configuration to edit product details.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="tech" className="space-y-4">
            {selectedConfig ? (
              <TechConfigurationForm
                tech={selectedConfig.tech}
                onUpdate={handleUpdateTech}
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Select a codebase configuration to edit tech stack.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="structure" className="space-y-4">
            {selectedConfig ? (
              <StructureConfigurationForm
                structure={selectedConfig.structure}
                onUpdate={handleUpdateStructure}
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Select a codebase configuration to edit project structure.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

// Product configuration form component
interface ProductConfigurationFormProps {
  product: ProductOverview;
  onUpdate: (updates: Partial<ProductOverview>) => void;
}

const ProductConfigurationForm: React.FC<ProductConfigurationFormProps> = ({ product, onUpdate }) => {
  const [localProduct, setLocalProduct] = useState(product);

  useEffect(() => {
    setLocalProduct(product);
  }, [product]);

  const handleFieldChange = (field: keyof ProductOverview, value: any) => {
    const updated = { ...localProduct, [field]: value };
    setLocalProduct(updated);
    onUpdate({ [field]: value });
  };

  const handleArrayFieldChange = (field: keyof ProductOverview, index: number, value: string) => {
    const array = localProduct[field] as string[];
    const updated = [...array];
    updated[index] = value;
    handleFieldChange(field, updated);
  };

  const handleAddArrayItem = (field: keyof ProductOverview) => {
    const array = (localProduct[field] as string[]) || [];
    handleFieldChange(field, [...array, '']);
  };

  const handleRemoveArrayItem = (field: keyof ProductOverview, index: number) => {
    const array = localProduct[field] as string[];
    const updated = array.filter((_, i) => i !== index);
    handleFieldChange(field, updated);
  };

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <h3 className="text-lg font-medium mb-4">Product Overview</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="product-name">Product Name</Label>
            <Input
              id="product-name"
              value={localProduct.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="product-purpose">Purpose</Label>
            <Input
              id="product-purpose"
              value={localProduct.purpose}
              onChange={(e) => handleFieldChange('purpose', e.target.value)}
              placeholder="What is the main purpose of this product?"
            />
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h4 className="font-medium mb-3">Target Users</h4>
        <div className="space-y-2">
          {localProduct.target_users.map((user, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={user}
                onChange={(e) => handleArrayFieldChange('target_users', index, e.target.value)}
                placeholder="User type"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRemoveArrayItem('target_users', index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAddArrayItem('target_users')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Target User
          </Button>
        </div>
      </Card>

      <Card className="p-4">
        <h4 className="font-medium mb-3">Key Features</h4>
        <div className="space-y-2">
          {localProduct.key_features.map((feature, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={feature}
                onChange={(e) => handleArrayFieldChange('key_features', index, e.target.value)}
                placeholder="Feature description"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRemoveArrayItem('key_features', index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAddArrayItem('key_features')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Feature
          </Button>
        </div>
      </Card>

      <Card className="p-4">
        <h4 className="font-medium mb-3">Business Objectives</h4>
        <div className="space-y-2">
          {localProduct.business_objectives.map((objective, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={objective}
                onChange={(e) => handleArrayFieldChange('business_objectives', index, e.target.value)}
                placeholder="Business objective"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRemoveArrayItem('business_objectives', index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAddArrayItem('business_objectives')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Objective
          </Button>
        </div>
      </Card>
    </div>
  );
};

// Tech configuration form component (simplified for space)
interface TechConfigurationFormProps {
  tech: TechnologyStack;
  onUpdate: (updates: Partial<TechnologyStack>) => void;
}

const TechConfigurationForm: React.FC<TechConfigurationFormProps> = ({ tech, onUpdate }) => {
  return (
    <div className="space-y-6">
      <Card className="p-4">
        <h3 className="text-lg font-medium mb-4">Frontend Technologies</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Framework</Label>
            <Input
              value={tech.frontend.framework}
              onChange={(e) => onUpdate({
                frontend: { ...tech.frontend, framework: e.target.value }
              })}
            />
          </div>
          <div>
            <Label>UI Library</Label>
            <Input
              value={tech.frontend.ui_library || ''}
              onChange={(e) => onUpdate({
                frontend: { ...tech.frontend, ui_library: e.target.value }
              })}
            />
          </div>
          <div>
            <Label>State Management</Label>
            <Input
              value={tech.frontend.state_management || ''}
              onChange={(e) => onUpdate({
                frontend: { ...tech.frontend, state_management: e.target.value }
              })}
            />
          </div>
          <div>
            <Label>Build Tool</Label>
            <Input
              value={tech.frontend.build_tool || ''}
              onChange={(e) => onUpdate({
                frontend: { ...tech.frontend, build_tool: e.target.value }
              })}
            />
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="text-lg font-medium mb-4">Development Tools</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Package Manager</Label>
            <Input
              value={tech.development_tools.package_manager}
              onChange={(e) => onUpdate({
                development_tools: { ...tech.development_tools, package_manager: e.target.value }
              })}
            />
          </div>
          <div>
            <Label>Version Control</Label>
            <Input
              value={tech.development_tools.version_control}
              onChange={(e) => onUpdate({
                development_tools: { ...tech.development_tools, version_control: e.target.value }
              })}
            />
          </div>
        </div>
      </Card>
    </div>
  );
};

// Structure configuration form component (simplified for space)
interface StructureConfigurationFormProps {
  structure: ProjectStructure;
  onUpdate: (updates: Partial<ProjectStructure>) => void;
}

const StructureConfigurationForm: React.FC<StructureConfigurationFormProps> = ({ structure, onUpdate }) => {
  return (
    <div className="space-y-6">
      <Card className="p-4">
        <h3 className="text-lg font-medium mb-4">Project Structure</h3>
        <div className="space-y-4">
          <div>
            <Label>Root Directory</Label>
            <Input
              value={structure.root_directory}
              onChange={(e) => onUpdate({ root_directory: e.target.value })}
            />
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h4 className="font-medium mb-3">File Naming Conventions</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Components</Label>
            <Input
              value={structure.file_naming_conventions.components || ''}
              onChange={(e) => onUpdate({
                file_naming_conventions: { ...structure.file_naming_conventions, components: e.target.value }
              })}
              placeholder="PascalCase.tsx"
            />
          </div>
          <div>
            <Label>Utilities</Label>
            <Input
              value={structure.file_naming_conventions.utilities || ''}
              onChange={(e) => onUpdate({
                file_naming_conventions: { ...structure.file_naming_conventions, utilities: e.target.value }
              })}
              placeholder="camelCase.ts"
            />
          </div>
        </div>
      </Card>
    </div>
  );
};