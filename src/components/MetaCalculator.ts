
import { MetaInput, MetaResult } from './MetaBot';

export default class MetaCalculator {
  private pontosPorProduto = {
    'Pós': 50,
    'SV': 30,
    'Workshop': 25,
    'ATLS': 40,
    'ACLS': 35,
    'IOT': 20
  };

  calculateMetas(input: MetaInput): MetaResult {
    console.log('Iniciando cálculo de metas:', input);
    
    // 1. Calcular leads por produto
    const leadsPorProduto = this.calculateLeads(input);
    console.log('Leads por produto:', leadsPorProduto);
    
    // 2. Calcular vendas por vendedor/produto
    const vendasPorVendedor = this.calculateVendas(leadsPorProduto, input);
    console.log('Vendas por vendedor:', vendasPorVendedor);
    
    // 3. Aplicar fator desafio e rampagem
    const vendasComDesafio = this.applyDesafioERampagem(vendasPorVendedor, input);
    console.log('Vendas com desafio:', vendasComDesafio);
    
    // 4. Calcular metas mensais totais
    const metaMensal = this.calculateMetaMensal(vendasComDesafio);
    console.log('Meta mensal:', metaMensal);
    
    // 5. Distribuir em metas semanais
    const metasSemanais = this.distributeWeeklyTargets(vendasComDesafio, input.weekly_weights);
    console.log('Metas semanais:', metasSemanais);
    
    // 6. Gerar JSON de saída
    const jsonOutput = this.generateJsonOutput(input, metaMensal, metasSemanais);
    
    return {
      periodo: input.periodo,
      meta_mensal: metaMensal,
      metas_semanais: metasSemanais,
      json_output: jsonOutput
    };
  }

  private calculateLeads(input: MetaInput): { [produto: string]: number } {
    const leads: { [produto: string]: number } = {};
    
    Object.entries(input.orcamentos).forEach(([produto, orcamento]) => {
      const cplProduto = input.cpl.Pós && produto === 'Pós' ? input.cpl.Pós : { "Meta Ads": input.cpl.Demais, "Google Ads": input.cpl.Demais };
      
      const leadsMetaAds = orcamento["Meta Ads"] / (cplProduto["Meta Ads"] || input.cpl.Demais);
      const leadsGoogleAds = orcamento["Google Ads"] / (cplProduto["Google Ads"] || input.cpl.Demais);
      
      leads[produto] = Math.round(leadsMetaAds + leadsGoogleAds);
    });
    
    return leads;
  }

  private calculateVendas(leads: { [produto: string]: number }, input: MetaInput): { [vendedor: string]: { [produto: string]: number } } {
    const vendas: { [vendedor: string]: { [produto: string]: number } } = {};
    
    // Distribuir leads entre vendedores baseado em suas taxas de conversão
    Object.entries(leads).forEach(([produto, totalLeads]) => {
      const vendedoresParaProduto = Object.entries(input.conv)
        .filter(([_, produtos]) => produtos[produto] && produtos[produto] > 0);
      
      if (vendedoresParaProduto.length === 0) return;
      
      // Calcular peso de cada vendedor baseado na taxa de conversão
      const totalConversao = vendedoresParaProduto.reduce((sum, [_, produtos]) => sum + produtos[produto], 0);
      
      vendedoresParaProduto.forEach(([vendedor, produtos]) => {
        if (!vendas[vendedor]) vendas[vendedor] = {};
        
        const proporcao = produtos[produto] / totalConversao;
        const leadsVendedor = Math.round(totalLeads * proporcao);
        const vendasVendedor = Math.round(leadsVendedor * (produtos[produto] / 100));
        
        vendas[vendedor][produto] = vendasVendedor;
      });
    });
    
    return vendas;
  }

  private applyDesafioERampagem(vendas: { [vendedor: string]: { [produto: string]: number } }, input: MetaInput): { [vendedor: string]: { [produto: string]: number } } {
    const vendasComDesafio: { [vendedor: string]: { [produto: string]: number } } = {};
    
    Object.entries(vendas).forEach(([vendedor, produtos]) => {
      vendasComDesafio[vendedor] = {};
      
      Object.entries(produtos).forEach(([produto, qtd]) => {
        let metaFinal = qtd * (1 + input.desafio);
        
        // Aplicar rampagem para novatos
        if (input.novatos && input.novatos[vendedor]) {
          const mesesNoTime = input.novatos[vendedor];
          let fatorRampagem = 1;
          
          if (mesesNoTime <= 1) fatorRampagem = 0.3;
          else if (mesesNoTime <= 2) fatorRampagem = 0.6;
          else if (mesesNoTime <= 3) fatorRampagem = 0.8;
          
          metaFinal *= fatorRampagem;
        }
        
        vendasComDesafio[vendedor][produto] = Math.round(metaFinal);
      });
    });
    
    return vendasComDesafio;
  }

  private calculateMetaMensal(vendas: { [vendedor: string]: { [produto: string]: number } }): {
    pontos_total: number;
    unidades_total: number;
    por_produto: { [produto: string]: { pontos: number; unidades: number } }
  } {
    const metaMensal = {
      pontos_total: 0,
      unidades_total: 0,
      por_produto: {} as { [produto: string]: { pontos: number; unidades: number } }
    };
    
    // Inicializar produtos
    Object.keys(this.pontosPorProduto).forEach(produto => {
      metaMensal.por_produto[produto] = { pontos: 0, unidades: 0 };
    });
    
    // Somar vendas por produto
    Object.values(vendas).forEach(produtos => {
      Object.entries(produtos).forEach(([produto, qtd]) => {
        if (metaMensal.por_produto[produto]) {
          metaMensal.por_produto[produto].unidades += qtd;
          metaMensal.por_produto[produto].pontos += qtd * this.pontosPorProduto[produto as keyof typeof this.pontosPorProduto];
        }
      });
    });
    
    // Calcular totais
    Object.values(metaMensal.por_produto).forEach(produto => {
      metaMensal.pontos_total += produto.pontos;
      metaMensal.unidades_total += produto.unidades;
    });
    
    return metaMensal;
  }

  private distributeWeeklyTargets(vendas: { [vendedor: string]: { [produto: string]: number } }, weights?: number[]): {
    [vendedor: string]: { [produto: string]: { semanas: number[]; total_mensal: number } }
  } {
    const weeklyWeights = weights || [0.15, 0.25, 0.30, 0.30];
    const metasSemanais: { [vendedor: string]: { [produto: string]: { semanas: number[]; total_mensal: number } } } = {};
    
    Object.entries(vendas).forEach(([vendedor, produtos]) => {
      metasSemanais[vendedor] = {};
      
      Object.entries(produtos).forEach(([produto, total]) => {
        const semanas = weeklyWeights.map(weight => Math.round(total * weight));
        
        // Ajustar para garantir que a soma seja igual ao total
        const somaSegmentada = semanas.reduce((sum, val) => sum + val, 0);
        const diferenca = total - somaSegmentada;
        
        if (diferenca !== 0) {
          semanas[semanas.length - 1] += diferenca;
        }
        
        metasSemanais[vendedor][produto] = {
          semanas,
          total_mensal: total
        };
      });
    });
    
    return metasSemanais;
  }

  private generateJsonOutput(input: MetaInput, metaMensal: any, metasSemanais: any): any {
    return {
      timestamp: new Date().toISOString(),
      periodo: input.periodo,
      configuracao: {
        fator_desafio: input.desafio,
        pesos_semanais: input.weekly_weights || [0.15, 0.25, 0.30, 0.30],
        novatos: input.novatos || {}
      },
      resultado: {
        meta_mensal: metaMensal,
        metas_semanais: metasSemanais,
        detalhamento: {
          orcamentos_investidos: input.orcamentos,
          cpl_utilizado: input.cpl,
          conversoes_por_vendedor: input.conv
        }
      }
    };
  }
}
