
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MetaResult } from './MetaBot';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface ResultsDisplayProps {
  results: MetaResult;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results }) => {
  // Preparar dados para gráficos
  const chartDataProdutos = Object.entries(results.meta_mensal.por_produto).map(([produto, data]) => ({
    produto,
    unidades: data.unidades,
    pontos: data.pontos
  }));

  const chartDataVendedores = Object.entries(results.metas_semanais).map(([vendedor, produtos]) => {
    const totalUnidades = Object.values(produtos).reduce((sum, produto) => sum + produto.total_mensal, 0);
    return {
      vendedor,
      total: totalUnidades
    };
  });

  const pieData = Object.entries(results.meta_mensal.por_produto).map(([produto, data]) => ({
    name: produto,
    value: data.unidades
  }));

  return (
    <div className="space-y-6">
      {/* Resumo Geral */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total de Pontos</CardDescription>
            <CardTitle className="text-2xl font-bold text-blue-600">
              {results.meta_mensal.pontos_total.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total de Unidades</CardDescription>
            <CardTitle className="text-2xl font-bold text-green-600">
              {results.meta_mensal.unidades_total.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Período</CardDescription>
            <CardTitle className="text-2xl font-bold text-purple-600">
              {results.periodo}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Metas por Produto</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartDataProdutos}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="produto" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="unidades" fill="#8884d8" name="Unidades" />
                <Bar dataKey="pontos" fill="#82ca9d" name="Pontos" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Produto</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Metas por Produto */}
      <Card>
        <CardHeader>
          <CardTitle>Metas Mensais por Produto</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Unidades</TableHead>
                <TableHead className="text-right">Pontos</TableHead>
                <TableHead className="text-right">Pontos/Unidade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(results.meta_mensal.por_produto).map(([produto, data]) => (
                <TableRow key={produto}>
                  <TableCell className="font-medium">
                    <Badge variant="outline">{produto}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{data.unidades}</TableCell>
                  <TableCell className="text-right">{data.pontos}</TableCell>
                  <TableCell className="text-right">{data.unidades > 0 ? (data.pontos / data.unidades).toFixed(0) : 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Metas Semanais por Vendedor */}
      <Card>
        <CardHeader>
          <CardTitle>Metas Semanais por Vendedor</CardTitle>
          <CardDescription>Distribuição das metas ao longo das semanas do mês</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Object.entries(results.metas_semanais).map(([vendedor, produtos]) => (
              <div key={vendedor}>
                <h4 className="font-semibold text-lg mb-3 text-blue-700">{vendedor}</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-center">Semana 1</TableHead>
                      <TableHead className="text-center">Semana 2</TableHead>
                      <TableHead className="text-center">Semana 3</TableHead>
                      <TableHead className="text-center">Semana 4</TableHead>
                      <TableHead className="text-right">Total Mensal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(produtos).map(([produto, meta]) => (
                      <TableRow key={produto}>
                        <TableCell>
                          <Badge variant="secondary">{produto}</Badge>
                        </TableCell>
                        {meta.semanas.map((qtd, index) => (
                          <TableCell key={index} className="text-center">
                            {qtd}
                          </TableCell>
                        ))}
                        <TableCell className="text-right font-semibold">
                          {meta.total_mensal}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Metas por Vendedor */}
      <Card>
        <CardHeader>
          <CardTitle>Total de Metas por Vendedor</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartDataVendedores} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="vendedor" type="category" width={80} />
              <Tooltip />
              <Bar dataKey="total" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResultsDisplay;
