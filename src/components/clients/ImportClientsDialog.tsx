import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Download, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import * as XLSX from "xlsx";

interface ImportClientsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

interface ImportPreview {
  name: string;
  phone: string;
  cpf?: string;
}

export function ImportClientsDialog({ open, onOpenChange, onImportComplete }: ImportClientsDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview[]>([]);
  const { toast } = useToast();

  const downloadTemplate = () => {
    const template = "Nome,Telefone,CPF\nMaria Silva,11999998888,123.456.789-00\nJoão Santos,11988887777,";
    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "template_importacao_clientes.csv";
    link.click();
  };

  const normalizePhone = (phone: string): string => {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, "");
    
    // Add +55 if not present and has 10-11 digits
    if (cleaned.length === 10 || cleaned.length === 11) {
      return `+55${cleaned}`;
    }
    
    // Already has country code
    if (cleaned.length === 12 || cleaned.length === 13) {
      return `+${cleaned}`;
    }
    
    return phone;
  };

  const parseFile = (fileContent: string | ArrayBuffer, fileName: string): ImportPreview[] => {
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    
    if (isExcel) {
      // Parse Excel
      const workbook = XLSX.read(fileContent, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      
      if (jsonData.length === 0) {
        throw new Error("Arquivo Excel vazio");
      }

      const headers = jsonData[0].map((h: any) => String(h || "").toLowerCase().trim());
      const nameIndex = headers.findIndex((h: string) => h.includes("nome"));
      const phoneIndex = headers.findIndex((h: string) => h.includes("telefone") || h.includes("phone"));
      const cpfIndex = headers.findIndex((h: string) => h.includes("cpf"));

      if (phoneIndex === -1) {
        throw new Error("Coluna 'Telefone' não encontrada");
      }

      return jsonData.slice(1).map((row: any[]) => ({
        name: nameIndex !== -1 ? String(row[nameIndex] || "") : "",
        phone: normalizePhone(String(row[phoneIndex] || "")),
        cpf: cpfIndex !== -1 ? String(row[cpfIndex] || "") : undefined,
      })).filter(item => item.phone);
      
    } else {
      // Parse CSV
      const text = typeof fileContent === 'string' ? fileContent : new TextDecoder().decode(fileContent);
      const lines = text.split("\n").filter(line => line.trim());
      const headers = lines[0].toLowerCase().split(",").map(h => h.trim());
      
      const nameIndex = headers.findIndex(h => h.includes("nome"));
      const phoneIndex = headers.findIndex(h => h.includes("telefone") || h.includes("phone"));
      const cpfIndex = headers.findIndex(h => h.includes("cpf"));

      if (phoneIndex === -1) {
        throw new Error("Coluna 'Telefone' não encontrada");
      }

      return lines.slice(1).map(line => {
        const values = line.split(",").map(v => v.trim());
        return {
          name: nameIndex !== -1 ? values[nameIndex] : "",
          phone: normalizePhone(values[phoneIndex] || ""),
          cpf: cpfIndex !== -1 ? values[cpfIndex] : undefined,
        };
      }).filter(item => item.phone);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    const reader = new FileReader();
    const isExcel = selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls');
    
    reader.onload = (event) => {
      try {
        const content = event.target?.result;
        if (!content) throw new Error("Arquivo vazio");
        
        const parsed = parseFile(content, selectedFile.name);
        setPreview(parsed.slice(0, 5));
      } catch (error) {
        toast({
          title: "Erro ao ler arquivo",
          description: error instanceof Error ? error.message : "Formato inválido",
          variant: "destructive",
        });
        setFile(null);
        setPreview([]);
      }
    };

    if (isExcel) {
      reader.readAsArrayBuffer(selectedFile);
    } else {
      reader.readAsText(selectedFile);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setIsLoading(true);
    const reader = new FileReader();
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    reader.onload = async (event) => {
      try {
        const content = event.target?.result;
        if (!content) throw new Error("Arquivo vazio");
        
        const clients = parseFile(content, file.name);

        const { data, error } = await supabase.functions.invoke("import-clients", {
          body: { clients },
        });

        if (error) throw error;

        toast({
          title: "Importação concluída",
          description: `${data.imported} clientes importados, ${data.updated} atualizados`,
        });

        onImportComplete();
        onOpenChange(false);
        setFile(null);
        setPreview([]);
      } catch (error) {
        toast({
          title: "Erro na importação",
          description: error instanceof Error ? error.message : "Erro desconhecido",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (isExcel) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar Pacientes</DialogTitle>
          <DialogDescription>
            Importe sua lista de pacientes existentes através de um arquivo CSV
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              O telefone é obrigatório. Nome e CPF são opcionais mas recomendados.
              Duplicatas serão identificadas por telefone ou CPF.
            </AlertDescription>
          </Alert>

          <Button
            variant="outline"
            onClick={downloadTemplate}
            className="w-full"
          >
            <Download className="mr-2 h-4 w-4" />
            Baixar Template CSV
          </Button>

          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
              id="csv-upload"
            />
            <label
              htmlFor="csv-upload"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {file ? file.name : "Clique para selecionar CSV ou XLSX"}
              </span>
            </label>
          </div>

          {preview.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Preview (primeiros 5 registros):</h4>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-2 text-left">Nome</th>
                      <th className="p-2 text-left">Telefone</th>
                      <th className="p-2 text-left">CPF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((item, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="p-2">{item.name || "-"}</td>
                        <td className="p-2">{item.phone}</td>
                        <td className="p-2">{item.cpf || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleImport}
              disabled={!file || isLoading}
            >
              {isLoading ? "Importando..." : "Importar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
