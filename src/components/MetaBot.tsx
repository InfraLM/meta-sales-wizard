
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Calculator, Download, Target } from "lucide-react";
import MetaCalculator from './MetaCalculator';
import ResultsDisplay from './ResultsDisplay';

export interface MetaInput {
  periodo: string;
  orcamentos: {
    [produto: string]: {
      "Meta Ads": number;
      "Google Ads": number;
    }
  };
  cpl: {
    Pós: {
      "Meta Ads": number;
      "Google Ads": number;
    };
    Demais: number;
  };
  conv: {
    [vendedor: string]: {
      [produto: string]: number;
    }
  };
  desafio: number;
  novatos?: {
    [vendedor: string]: number;
  };
  weekly_weights?: number[];
}

export interface MetaResult {
  periodo: string;
  meta_mensal: {
    pontos_total: number;
    unidades_total: number;
    por_produto: {
      [produto: string]: {
        pontos: number;
        unidades: number;
      }
    }
  };
  metas_semanais: {
    [vendedor: string]: {
      [produto: string]: {
        semanas: number[];
        total_mensal: number;
      }
    }
  };
  json_output: any;
}

const MetaBot = () => {
  const [inputData, setInputData] = useState('');
  const [results, setResults] = useState<MetaResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerateMeta = async () => {
    if (!inputData.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira os dados de entrada no formato JSON.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const parsedInput: MetaInput = JSON.parse(inputData);
      const calculator = new MetaCalculator();
      const result = calculator.calculateMetas(parsedInput);
      setResults(result);
      
      toast({
        title: "Sucesso!",
        description: "Metas geradas com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao processar dados",
        description: error.message || "Verifique o formato JSON dos dados de entrada.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadJson = () => {
    if (!results) return;
    
    const dataStr = JSON.stringify(results.json_output, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `metas_${results.periodo}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exampleInput = {
    "periodo": "2024-01",
    "orcamentos": {
      "Pós": { "Meta Ads": 50000, "Google Ads": 30000 },
      "SV": { "Meta Ads": 25000, "Google Ads": 15000 },
      "Workshop": { "Meta Ads": 20000, "Google Ads": 10000 },
      "ATLS": { "Meta Ads": 15000, "Google Ads": 8000 },
      "ACLS": { "Meta Ads": 12000, "Google Ads": 6000 },
      "IOT": { "Meta Ads": 18000, "Google Ads": 9000 }
    },
    "cpl": {
      "Pós": { "Meta Ads": 71.83, "Google Ads": 202.61 },
      "Demais": 150
    },
    "conv": {
      "Amanda": { "Pós": 3.6, "SV": 22.22, "Workshop": 33.33, "IOT": 15.79 },
      "Ana": { "Pós": 3.98 },
      "Beatriz": { "IOT": 1.01 },
      "Bruno": { "SV": 5.30, "Workshop": 7.81 },
      "Gustavo": { "Pós": 2.36, "SV": 2.53, "Workshop": 2.44, "IOT": 10.00 },
      "Marcelo": { "Pós": 6.19, "ACLS": 14.28 },
      "Murilo": { "Pós": 4.27, "SV": 5.76, "IOT": 8.33 },
      "Pedro": { "Workshop": 11.11, "IOT": 4.34 },
      "Ricardo": { "Pós": 5.67, "Workshop": 16.67, "IOT": 3.44 }
    },
    "desafio": 0.15,
    "novatos": {
      "Beatriz": 1,
      "Bruno": 2
    },
    "weekly_weights": [0.15, 0.25, 0.30, 0.30]
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Dados de Entrada
          </CardTitle>
          <CardDescription>
            Insira os dados no formato JSON para gerar as metas de vendas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Textarea
              placeholder="Cole aqui o JSON com os dados de entrada..."
              value={inputData}
              onChange={(e) => setInputData(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleGenerateMeta}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Calculator className="h-4 w-4" />
              {isLoading ? 'Processando...' : 'Gerar Metas'}
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => setInputData(JSON.stringify(exampleInput, null, 2))}
            >
              Usar Exemplo
            </Button>
          </div>
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Resultados - {results.periodo}</span>
              <Button 
                onClick={handleDownloadJson}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download JSON
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResultsDisplay results={results} />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MetaBot;
