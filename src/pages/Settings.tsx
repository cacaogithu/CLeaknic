import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { X } from "lucide-react";
import DocumentationTab from "./DocumentationTab";

const Settings = () => {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("ai");

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const { data: config, isLoading } = useQuery({
    queryKey: ['system-configuration'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_configuration')
        .select('*')
        .single();
      if (error) throw error;
      return data;
    }
  });

  const updateConfig = useMutation({
    mutationFn: async (updates: any) => {
      const { error } = await supabase
        .from('system_configuration')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', 1);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-configuration'] });
      toast.success('Configuration updated successfully!');
    },
    onError: (error: any) => {
      toast.error(`Failed to update: ${error.message}`);
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading configuration...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border p-6">
        <h1 className="text-3xl font-bold text-foreground">Configurações do Sistema</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure comportamento da IA, configurações de buffer e parâmetros do sistema</p>
      </header>

      <div className="max-w-6xl mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            <TabsTrigger value="ai">AI</TabsTrigger>
            <TabsTrigger value="buffer">Buffer</TabsTrigger>
            <TabsTrigger value="handoff">Handoff</TabsTrigger>
            <TabsTrigger value="testing">Testing</TabsTrigger>
            <TabsTrigger value="tools">Tools</TabsTrigger>
            <TabsTrigger value="documentation">Documentação</TabsTrigger>
          </TabsList>

          <TabsContent value="ai">
            <AIConfigTab config={config} updateConfig={updateConfig} />
          </TabsContent>

          <TabsContent value="buffer">
            <BufferConfigTab config={config} updateConfig={updateConfig} />
          </TabsContent>

          <TabsContent value="handoff">
            <HandoffConfigTab config={config} updateConfig={updateConfig} />
          </TabsContent>

          <TabsContent value="testing">
            <TestingConfigTab config={config} updateConfig={updateConfig} />
          </TabsContent>

          <TabsContent value="tools">
            <ToolsConfigTab config={config} updateConfig={updateConfig} />
          </TabsContent>
          <TabsContent value="documentation">
            <DocumentationTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const AIConfigTab = ({ config, updateConfig }: any) => {
  const [additionalNotes, setAdditionalNotes] = useState(config?.additional_notes || '');
  const [model, setModel] = useState(config?.ai_model || 'gpt-4-turbo-preview');
  const [temperature, setTemperature] = useState([config?.ai_temperature || 0.7]);
  const [maxTokens, setMaxTokens] = useState(config?.max_tokens || 500);

  const handleSave = () => {
    updateConfig.mutate({
      additional_notes: additionalNotes,
      ai_model: model,
      ai_temperature: temperature[0],
      max_tokens: maxTokens
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Configuration</CardTitle>
        <CardDescription>Configurações do modelo de IA e contexto adicional</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="additional-notes">Observações Adicionais</Label>
          <Textarea
            id="additional-notes"
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            rows={8}
            className="mt-2"
            placeholder="Adicione contexto ou instruções personalizadas que serão incluídas nas conversas da IA..."
          />
          <p className="text-xs text-muted-foreground mt-2">
            Essas observações serão adicionadas ao prompt base da IA para personalizar o comportamento
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="model">AI Model</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger id="model" className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4-turbo-preview">GPT-4 Turbo</SelectItem>
                <SelectItem value="gpt-4">GPT-4</SelectItem>
                <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="max-tokens">Max Tokens: {maxTokens}</Label>
            <Input
              id="max-tokens"
              type="number"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value))}
              className="mt-2"
            />
          </div>
        </div>

        <div>
          <Label>Temperature: {temperature[0].toFixed(1)}</Label>
          <Slider
            value={temperature}
            onValueChange={setTemperature}
            min={0}
            max={2}
            step={0.1}
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Lower = more focused, Higher = more creative
          </p>
        </div>

        <Button onClick={handleSave} disabled={updateConfig.isPending}>
          {updateConfig.isPending ? 'Saving...' : 'Save AI Configuration'}
        </Button>
      </CardContent>
    </Card>
  );
};

const BufferConfigTab = ({ config, updateConfig }: any) => {
  const [bufferTime, setBufferTime] = useState(config?.buffer_time_seconds || 15);
  const [bufferEnabled, setBufferEnabled] = useState(config?.buffer_enabled ?? true);
  const [batchSizeLimit, setBatchSizeLimit] = useState(config?.batch_size_limit || 10);

  const handleSave = () => {
    updateConfig.mutate({
      buffer_time_seconds: bufferTime,
      buffer_enabled: bufferEnabled,
      batch_size_limit: batchSizeLimit
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Buffer Settings</CardTitle>
        <CardDescription>Control message batching and processing delays</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="buffer-enabled">Buffer System</Label>
            <p className="text-sm text-muted-foreground">Enable 15-second sliding window</p>
          </div>
          <Switch
            id="buffer-enabled"
            checked={bufferEnabled}
            onCheckedChange={setBufferEnabled}
          />
        </div>

        <div>
          <Label htmlFor="buffer-time">Buffer Time (seconds)</Label>
          <Input
            id="buffer-time"
            type="number"
            value={bufferTime}
            onChange={(e) => setBufferTime(parseInt(e.target.value))}
            className="mt-2"
            min={1}
            max={60}
          />
          <p className="text-xs text-muted-foreground mt-2">
            Messages wait this long for additional messages before processing
          </p>
        </div>

        <div>
          <Label htmlFor="batch-limit">Batch Size Limit</Label>
          <Input
            id="batch-limit"
            type="number"
            value={batchSizeLimit}
            onChange={(e) => setBatchSizeLimit(parseInt(e.target.value))}
            className="mt-2"
            min={1}
            max={50}
          />
          <p className="text-xs text-muted-foreground mt-2">
            Maximum messages to process in one batch
          </p>
        </div>

        <Button onClick={handleSave} disabled={updateConfig.isPending}>
          {updateConfig.isPending ? 'Saving...' : 'Save Buffer Settings'}
        </Button>
      </CardContent>
    </Card>
  );
};

const HandoffConfigTab = ({ config, updateConfig }: any) => {
  const [notificationNumber, setNotificationNumber] = useState(config?.handoff_notification_number || '');
  const [timeoutHours, setTimeoutHours] = useState(config?.handoff_timeout_hours || 2);
  const [keywords, setKeywords] = useState<string[]>(config?.handoff_keywords || []);
  const [newKeyword, setNewKeyword] = useState('');

  const addKeyword = () => {
    if (newKeyword && !keywords.includes(newKeyword)) {
      setKeywords([...keywords, newKeyword]);
      setNewKeyword('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setKeywords(keywords.filter(k => k !== keyword));
  };

  const handleSave = () => {
    updateConfig.mutate({
      handoff_notification_number: notificationNumber,
      handoff_timeout_hours: timeoutHours,
      handoff_keywords: keywords
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Handoff Settings</CardTitle>
        <CardDescription>Configure human agent handoff behavior</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="notification-number">Notification Number (Eliana)</Label>
          <Input
            id="notification-number"
            value={notificationNumber}
            onChange={(e) => setNotificationNumber(e.target.value)}
            placeholder="5511949128259"
            className="font-mono mt-2"
          />
          <p className="text-xs text-muted-foreground mt-2">
            WhatsApp number to receive handoff notifications
          </p>
        </div>

        <div>
          <Label htmlFor="timeout-hours">Auto-deactivation Timeout (hours)</Label>
          <Input
            id="timeout-hours"
            type="number"
            value={timeoutHours}
            onChange={(e) => setTimeoutHours(parseInt(e.target.value))}
            className="mt-2"
            min={1}
            max={48}
          />
          <p className="text-xs text-muted-foreground mt-2">
            Handoff deactivates after this many hours of agent inactivity
          </p>
        </div>

        <div>
          <Label>Handoff Keywords</Label>
          <div className="flex gap-2 mt-2">
            <Input
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
              placeholder="Add keyword..."
            />
            <Button onClick={addKeyword} variant="outline">Add</Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {keywords.map(keyword => (
              <Badge key={keyword} variant="secondary" className="pl-3 pr-1 py-1">
                {keyword}
                <button onClick={() => removeKeyword(keyword)} className="ml-2">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Keywords that trigger handoff detection
          </p>
        </div>

        <Button onClick={handleSave} disabled={updateConfig.isPending}>
          {updateConfig.isPending ? 'Saving...' : 'Save Handoff Settings'}
        </Button>
      </CardContent>
    </Card>
  );
};

const TestingConfigTab = ({ config, updateConfig }: any) => {
  const [testMode, setTestMode] = useState(config?.test_mode ?? false);

  // Additional allowed numbers to add
  const additionalAllowedNumbers = [
    '14079897155',    // +1 (407) 989-7155
    '13213331224',    // +1 (321) 333-1224
    '5521992420891',  // +55 21 99242-0891
    '5521989732007',  // +55 21 98973-2007
    '14077280505',    // +1 (407) 728-0505
  ];

  const [testNumbers, setTestNumbers] = useState<string[]>(() => {
    const existing = config?.test_numbers || [];
    const combined = [...new Set([...existing, ...additionalAllowedNumbers])];
    return combined;
  });
  const [newNumber, setNewNumber] = useState('');

  const addNumber = () => {
    if (newNumber && !testNumbers.includes(newNumber)) {
      setTestNumbers([...testNumbers, newNumber]);
      setNewNumber('');
    }
  };

  const removeNumber = (number: string) => {
    setTestNumbers(testNumbers.filter(n => n !== number));
  };

  const handleSave = () => {
    updateConfig.mutate({
      test_mode: testMode,
      test_numbers: testNumbers
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Allowed Numbers Configuration</CardTitle>
        <CardDescription>Control which numbers can interact with the system</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 border border-border rounded-lg">
          <div>
            <Label htmlFor="test-mode" className="text-base">Restrict to Allowed Numbers</Label>
            <p className="text-sm text-muted-foreground">Only process webhooks from the allowed numbers list</p>
          </div>
          <Switch
            id="test-mode"
            checked={testMode}
            onCheckedChange={setTestMode}
          />
        </div>

        {testMode && (
          <div>
            <Label>Allowed Phone Numbers</Label>
            <div className="flex gap-2 mt-2">
              <Input
                value={newNumber}
                onChange={(e) => setNewNumber(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addNumber()}
                placeholder="5511999999999 or 14079897155"
                className="font-mono"
              />
              <Button onClick={addNumber} variant="outline">Add</Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {testNumbers.map(number => (
                <Badge key={number} variant="secondary" className="pl-3 pr-1 py-1 font-mono">
                  {number}
                  <button onClick={() => removeNumber(number)} className="ml-2">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Only these numbers will be processed by the system when restriction is enabled
            </p>
          </div>
        )}

        <Button onClick={handleSave} disabled={updateConfig.isPending}>
          {updateConfig.isPending ? 'Saving...' : 'Save Allowed Numbers Configuration'}
        </Button>
      </CardContent>
    </Card>
  );
};

const ToolsConfigTab = ({ config, updateConfig }: any) => {
  const [toolsEnabled, setToolsEnabled] = useState(
    config?.tools_enabled || {
      handoff_to_human: true,
      schedule_appointment: true,
      update_client: true,
      log_interest: true
    }
  );

  const toggleTool = (tool: string) => {
    setToolsEnabled({
      ...toolsEnabled,
      [tool]: !toolsEnabled[tool]
    });
  };

  const handleSave = () => {
    updateConfig.mutate({ tools_enabled: toolsEnabled });
  };

  const tools = [
    { id: 'handoff_to_human', name: 'Handoff to Human', description: 'Transfer conversations to human agents' },
    { id: 'schedule_appointment', name: 'Schedule Appointment', description: 'Book appointments with clients' },
    { id: 'update_client', name: 'Update Client', description: 'Update client information in database' },
    { id: 'log_interest', name: 'Log Interest', description: 'Track treatment interests' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Tools Management</CardTitle>
        <CardDescription>Enable or disable AI function calling tools</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {tools.map(tool => (
          <div key={tool.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div>
              <Label className="text-base">{tool.name}</Label>
              <p className="text-sm text-muted-foreground">{tool.description}</p>
            </div>
            <Switch
              checked={toolsEnabled[tool.id]}
              onCheckedChange={() => toggleTool(tool.id)}
            />
          </div>
        ))}

        <Button onClick={handleSave} disabled={updateConfig.isPending} className="w-full mt-4">
          {updateConfig.isPending ? 'Saving...' : 'Save Tools Configuration'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default Settings;
