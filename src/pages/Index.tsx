
import MetaBot from "@/components/MetaBot";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-900 mb-2">MetaBot LM</h1>
          <p className="text-xl text-blue-700">Gerador de Metas de Vendas - Liberdade Médica</p>
        </div>
        <MetaBot />
      </div>
    </div>
  );
};

export default Index;
