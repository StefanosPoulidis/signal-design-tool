import { useState } from 'react';
import { Header } from './components/layout/Header';
import { TabNav } from './components/layout/TabNav';
import { Footer } from './components/layout/Footer';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { LandingPage } from './components/modules/LandingPage';
import { SignalSimulator } from './components/modules/SignalSimulator';
import { IDEDecomposition } from './components/modules/IDEDecomposition';
import { ScoreLineGeometry } from './components/modules/ScoreLineGeometry';
import { ArchetypeExplorer } from './components/modules/ArchetypeExplorer';
import type { ModuleId } from './lib/types';

function App() {
  const [activeModule, setActiveModule] = useState<ModuleId>('landing');

  const renderModule = () => {
    switch (activeModule) {
      case 'landing':
        return <LandingPage onNavigate={(id) => setActiveModule(id as ModuleId)} />;
      case 'simulator':
        return <SignalSimulator />;
      case 'ide':
        return <IDEDecomposition />;
      case 'scoreline':
        return <ScoreLineGeometry />;
      case 'archetypes':
        return <ArchetypeExplorer />;
      default:
        return <LandingPage onNavigate={(id) => setActiveModule(id as ModuleId)} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <TabNav active={activeModule} onSelect={setActiveModule} />
      <main className="flex-1 px-4 py-8">
        <ErrorBoundary key={activeModule}>
          {renderModule()}
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  );
}

export default App;
