
import React, { useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ClientList from './components/ClientList';
import PracticeList from './components/PracticeList';
import ClientDetail from './components/ClientDetail';
import CalendarView from './components/CalendarView';
import AIAssistant from './components/AIAssistant';
import ReminderList from './components/ReminderList';
import ClientForm from './components/ClientForm';
import DocumentScanner from './components/DocumentScanner';
import PracticeForm from './components/PracticeForm';
import AISearch from './components/AISearch';
import Reporting from './components/Reporting';
import FirmProfile from './components/FirmProfile';
import LawyerList from './components/LawyerList';
import LawyerForm from './components/LawyerForm';
import LetterList from './components/LetterList';
import PracticeDetail from './components/PracticeDetail';
import Quotes from './components/Quotes';
import QuoteList from './components/QuoteList';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import AdminPanel from './components/AdminPanel';
import { type View, type Client, type Document, type Lawyer } from './types';
import { addDocument } from './services/api';
import { useSWRConfig } from 'swr';
import { useAuth } from './contexts/AuthContext';
import { LoadingIcon } from './components/icons';


const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { mutate } = useSWRConfig();
  const [view, setView] = useState<View>('dashboard');
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [selectedPracticeId, setSelectedPracticeId] = useState<number | null>(null);
  const [isClientFormOpen, setIsClientFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isPracticeFormOpen, setIsPracticeFormOpen] = useState(false);
  const [isLawyerFormOpen, setIsLawyerFormOpen] = useState(false);
  const [editingLawyer, setEditingLawyer] = useState<Lawyer | null>(null);
  
  // State for Login/Register switch
  const [isRegistering, setIsRegistering] = useState(false);
  
  const handleSelectClient = useCallback((id: number) => {
    setSelectedClientId(id);
    setView('client-detail');
  }, []);

  const handleSelectPractice = useCallback((practiceId: number, clientId: number) => {
    setSelectedPracticeId(practiceId);
    setSelectedClientId(clientId); // Manteniamo il contesto del cliente
    setView('practice-detail');
  }, []);

  const handleViewChange = useCallback((newView: View) => {
    setView(newView);
    if (newView !== 'client-detail' && newView !== 'practice-detail') {
      setSelectedClientId(null);
      setSelectedPracticeId(null);
    }
  }, []);

  const handleGoBack = useCallback(() => {
    if (view === 'practice-detail') {
      setView('client-detail');
      setSelectedPracticeId(null); // Pulisci la selezione della pratica, ma mantieni il cliente
    } else if (view === 'client-detail') {
      setView('clients');
      setSelectedClientId(null);
    }
  }, [view]);

  const handleOpenClientForm = useCallback((client: Client | null = null) => {
    setEditingClient(client);
    setIsClientFormOpen(true);
  }, []);

  const handleCloseClientForm = useCallback(() => {
    setIsClientFormOpen(false);
    setEditingClient(null);
  }, []);

  const handleOpenPracticeForm = useCallback(() => {
    setIsPracticeFormOpen(true);
  }, []);

  const handleClosePracticeForm = useCallback(() => {
    setIsPracticeFormOpen(false);
  }, []);

  const handleOpenLawyerForm = useCallback((lawyer: Lawyer | null = null) => {
    setEditingLawyer(lawyer);
    setIsLawyerFormOpen(true);
  }, []);

  const handleCloseLawyerForm = useCallback(() => {
    setIsLawyerFormOpen(false);
    setEditingLawyer(null);
  }, []);

  const handleScanDocument = useCallback(() => {
    if (selectedClientId) {
      setIsScannerOpen(true);
    }
  }, [selectedClientId]);

  const handleCaptureScan = async (dataUrl: string) => {
    if (selectedClientId) {
      const newDocument: Document = {
        clientId: selectedClientId,
        practiceId: view === 'practice-detail' ? selectedPracticeId ?? undefined : undefined,
        name: `Scansione_${new Date().toISOString()}.jpg`,
        type: 'image/jpeg',
        dataUrl,
        createdAt: new Date().toISOString(),
      };
      await addDocument(newDocument);
      // Ricarica i documenti per il contesto corretto
      const clientDocsKey = `/api/documents?clientId=${selectedClientId}`;
      const practiceDocsKey = (view === 'practice-detail' && selectedPracticeId) ? `/api/documents?practiceId=${selectedPracticeId}` : null;
      
      await mutate(clientDocsKey);
      if (practiceDocsKey) {
          await mutate(practiceDocsKey);
      }
    }
    setIsScannerOpen(false);
  };

  if (isLoading) {
      return <div className="h-screen w-full flex justify-center items-center"><LoadingIcon className="w-10 h-10 text-primary" /></div>;
  }

  if (!isAuthenticated) {
      return isRegistering 
        ? <RegisterPage onSwitchToLogin={() => setIsRegistering(false)} /> 
        : <LoginPage onSwitchToRegister={() => setIsRegistering(true)} />;
  }
  
  const renderView = () => {
    switch (view) {
      case 'dashboard':
        return <Dashboard onNavigate={handleViewChange} />;
      case 'clients':
        return <ClientList onSelectPractice={handleSelectPractice} onEditClient={handleOpenClientForm} />;
      case 'client-detail':
        if (selectedClientId === null) {
          setView('clients');
          return <ClientList onSelectPractice={handleSelectPractice} onEditClient={handleOpenClientForm}/>;
        }
        return <ClientDetail clientId={selectedClientId} onBack={handleGoBack} onEditClient={handleOpenClientForm} onScanDocument={handleScanDocument} onSelectPractice={handleSelectPractice} />;
      case 'practices':
        return <PracticeList onNewPractice={handleOpenPracticeForm} onSelectPractice={handleSelectPractice} />;
       case 'practice-detail':
        if (selectedPracticeId === null) {
            setView('practices');
            return <PracticeList onNewPractice={handleOpenPracticeForm} onSelectPractice={handleSelectPractice} />;
        }
        return <PracticeDetail practiceId={selectedPracticeId} clientId={selectedClientId!} onBack={handleGoBack} onScanDocument={handleScanDocument} />;
      case 'lawyers':
        return <LawyerList onEditLawyer={handleOpenLawyerForm} />;
      case 'calendar':
        return <CalendarView />;
      case 'ai-assistant':
        return <AIAssistant />;
      case 'reminders':
        return <ReminderList />;
      case 'ai-search':
        return <AISearch />;
      case 'reporting':
        return <Reporting />;
      case 'firm-profile':
        return <FirmProfile />;
      case 'letters':
        return <LetterList />;
      case 'quotes':
        return <Quotes handleOpenClientForm={handleOpenClientForm} />;
      case 'quotelist':
        return <QuoteList />;
      case 'admin':
        return user?.role === 'admin' ? <AdminPanel /> : <Dashboard onNavigate={handleViewChange} />;
      default:
        return <Dashboard onNavigate={handleViewChange} />;
    }
  };

  return (
    <div className="flex h-screen bg-light font-sans print:block print:h-auto print:bg-white overflow-hidden">
      <Sidebar currentView={view} onNavigate={handleViewChange} />
      <main className="flex-1 overflow-y-auto print:overflow-visible print:p-0">
        <div className="p-4 sm:p-6 lg:p-8 print:p-0">
          {renderView()}
        </div>
      </main>
      {isClientFormOpen && <ClientForm client={editingClient} onClose={handleCloseClientForm} />}
      {isPracticeFormOpen && <PracticeForm onClose={handleClosePracticeForm} handleOpenClientForm={handleOpenClientForm} />}
      {isLawyerFormOpen && <LawyerForm lawyer={editingLawyer} onClose={handleCloseLawyerForm} />}
      {isScannerOpen && <DocumentScanner onCapture={handleCaptureScan} onClose={() => setIsScannerOpen(false)} />}
    </div>
  );
};

const App: React.FC = () => {
    return <AppContent />;
};

export default App;
