
import React, { useState, useEffect } from 'react';
import { Project, Report, UserProfile } from './types';
import { fetchProjects, fetchReports, upsertReport, getNewReportTemplate } from './services/dbApi';
import { getCurrentProfile, signOut } from './services/auth';
import AuthScreen from './components/AuthScreen';
import AdminPanel from './components/AdminPanel';
import Dashboard from './components/Dashboard';
import ProjectDashboard from './components/ProjectDashboard';
import ReportForm from './components/ReportForm';
import ReportView from './components/ReportView';
import PendingActions from './components/PendingActions';
import Toast from './components/Toast';
import { LogoIcon, ChartPieIcon, BuildingOfficeIcon, UserCircleIcon, WrenchScrewdriverIcon } from './components/icons';

type View = 'SITES_LIST' | 'PROJECT_DASHBOARD' | 'REPORT_FORM' | 'REPORT_VIEW' | 'MANAGEMENT_DASHBOARD' | 'PENDING_ACTIONS' | 'ADMIN_PANEL';

const App: React.FC = () => {
  const [sessionChecked, setSessionChecked] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  const [view, setView] = useState<View>('SITES_LIST');
  const [projects, setProjects] = useState<Project[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [initialCategoryId, setInitialCategoryId] = useState<string | undefined>(undefined);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [newReportTemplate, setNewReportTemplate] = useState<any>(null); // Estado para segurar o template gerado

  const checkUser = async () => {
      setIsLoading(true);
      try {
        const profile = await getCurrentProfile();
        setUserProfile(profile);
        if(profile) await loadData(profile);
      } catch(e) {
          console.error(e);
      } finally {
          setSessionChecked(true);
          setIsLoading(false);
      }
  }

  const loadData = async (profile: UserProfile) => {
     setIsLoading(true);
     try {
        const allProjects = await fetchProjects();
        const allReports = await fetchReports();
        
        setProjects(allProjects);
        setReports(allReports);
     } catch (error) {
        console.error("Falha ao carregar dados", error);
        setToastMessage("Erro ao carregar dados do servidor.");
     } finally {
        setIsLoading(false);
     }
  };

  useEffect(() => {
    checkUser();
  }, []);

  // Filters
  const getAuthorizedProjects = () => {
      if (!userProfile) return [];
      // Admin (Master) e Director (Visualização) veem todas as obras
      if (userProfile.role === 'admin' || userProfile.role === 'director') return projects;
      return projects.filter(p => userProfile.assigned_project_ids?.includes(p.id));
  }

  const getAuthorizedReports = () => {
      if (!userProfile) return [];
      // Admin e Director veem todos os relatórios
      const authorizedProjectIds = (userProfile.role === 'admin' || userProfile.role === 'director')
        ? projects.map(p => p.id) 
        : userProfile.assigned_project_ids || [];
        
      return reports.filter(r => authorizedProjectIds.includes(r.projectId));
  }
  
  const authorizedProjects = getAuthorizedProjects();
  const authorizedReports = getAuthorizedReports();

  // Handlers
  const handleLoginSuccess = () => {
      checkUser();
  }
  
  const handleLogout = async () => {
      await signOut();
      setUserProfile(null);
      setView('SITES_LIST');
  }

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    setView('PROJECT_DASHBOARD');
  };
  
  const handleNavigateToPendingActions = () => {
    setView('PENDING_ACTIONS');
  }

  const handleViewReport = (report: Report) => {
    setSelectedReport(report);
    setView('REPORT_VIEW');
  };

  const handleCreateNewReport = (project: Project) => {
    // Busca o último relatório desta obra para identificar pendências
    const projectReports = reports.filter(r => r.projectId === project.id);
    const lastReport = projectReports.length > 0 
        ? projectReports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0] 
        : null;

    // Passa o lastReport para o template generator
    const template = getNewReportTemplate(project.id, userProfile?.full_name || 'Desconhecido', userProfile?.id || '', lastReport);
    
    setNewReportTemplate(template);
    setEditingReport(null);
    setSelectedProject(project);
    setInitialCategoryId(undefined);
    setView('REPORT_FORM');
  };
  
  const handleEditReport = (report: Report) => {
    setNewReportTemplate(null);
    setEditingReport(report);
    setSelectedProject(projects.find(p => p.id === report.projectId) || null);
    setInitialCategoryId(undefined);
    setView('REPORT_FORM');
  }
  
  const handleEditReportCategory = (report: Report, categoryId: string) => {
    setNewReportTemplate(null);
    setEditingReport(report);
    setSelectedProject(projects.find(p => p.id === report.projectId) || null);
    setInitialCategoryId(categoryId);
    setView('REPORT_FORM');
  }

  const handleAsyncSave = async (data: any, status: 'Draft' | 'Completed') => {
      if (!userProfile) return;
      setIsLoading(true);
      try {
          // Se for admin ou assistant, pode assinar como inspector
          // Se for manager, pode assinar como manager
          // A lógica está dentro do ReportForm, mas garantimos aqui o refresh
          await upsertReport({ ...data, status });
          await loadData(userProfile);
          setToastMessage(status === 'Draft' ? 'Rascunho salvo!' : 'Relatório concluído!');
          
          if (selectedProject) setView('PROJECT_DASHBOARD');
          else setView('SITES_LIST');
      } catch (e) {
          setToastMessage("Erro ao salvar relatório.");
      } finally {
        setIsLoading(false);
      }
  }

  const navigateToSitesList = () => {
    setSelectedProject(null);
    setSelectedReport(null);
    setView('SITES_LIST');
  };
  
  // Renderers
  if (!sessionChecked) return <div className="h-screen flex items-center justify-center"><div className="animate-spin h-10 w-10 border-4 border-blue-600 rounded-full border-t-transparent"></div></div>;
  
  if (!userProfile) return <AuthScreen onLoginSuccess={handleLoginSuccess} />;

  const Header: React.FC = () => {
    let title = 'Painel de Obras';
    if (view === 'MANAGEMENT_DASHBOARD') title = 'Dashboard Gerencial';
    else if (view === 'PENDING_ACTIONS') title = 'Central de Pendências';
    else if (view === 'ADMIN_PANEL') title = 'Administração';
    else if (view === 'PROJECT_DASHBOARD' && selectedProject) title = selectedProject.name;
    else if (view === 'REPORT_FORM' || view === 'REPORT_VIEW') title = 'Relatório de Inspeção';
    
    let roleLabel = 'Visitante';
    switch(userProfile.role) {
        case 'admin': roleLabel = 'Administrador'; break;
        case 'director': roleLabel = 'Diretoria'; break;
        case 'manager': roleLabel = 'Engenheiro'; break;
        case 'assistant': roleLabel = 'Assistente'; break;
    }

    return (
    <header className="bg-white shadow-md p-4 flex justify-between items-center sticky top-0 z-40 h-16 sm:h-20">
      <div className="flex items-center space-x-4 cursor-pointer" onClick={() => setView('SITES_LIST')}>
        <LogoIcon className="h-10 sm:h-14 w-auto" />
        <div className="h-10 w-px bg-gray-300 hidden sm:block"></div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-800 hidden sm:block uppercase tracking-tight">CONTROLE AMBIENTAL</h1>
      </div>
      <div className="hidden md:block text-md font-semibold text-gray-700">
        {title}
      </div>
      <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-800">{userProfile.full_name}</p>
              <p className="text-xs text-gray-500 capitalize">{roleLabel}</p>
          </div>
          <button onClick={handleLogout} className="text-sm text-red-600 hover:text-red-800 font-medium border border-red-200 rounded px-2 py-1">Sair</button>
      </div>
    </header>
  )};

  const SitesList: React.FC = () => {
    if (authorizedProjects.length === 0) {
        return (
            <div className="text-center py-20">
                <BuildingOfficeIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-600">Nenhuma obra vinculada</h2>
                <p className="text-gray-500">Solicite ao administrador o acesso às suas obras.</p>
            </div>
        )
    }
  
    const data = authorizedProjects.map(project => {
      const projectReports = authorizedReports.filter(r => r.projectId === project.id);
      const lastReport = projectReports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      const score = lastReport ? lastReport.score : null;
      const pendingActions = projectReports.flatMap(r => r.results).filter(res => res.status === 'Não Conforme' && (!res.actionPlan || !res.actionPlan.actions)).length;
      return { project, score, pendingActions };
    });
    
    const getScoreBorderColor = (score: number | null) => {
        if (score === null) return 'border-gray-300';
        if (score >= 90) return 'border-green-500';
        if (score >= 70) return 'border-blue-500';
        if (score >= 50) return 'border-yellow-500';
        return 'border-red-500';
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.map(({ project, score, pendingActions }) => (
          <div key={project.id} onClick={() => handleSelectProject(project)} className={`bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer flex flex-col border-l-4 ${getScoreBorderColor(score)}`}>
            <div className="p-5 flex-grow">
              <h3 className="font-bold text-lg text-gray-800">{project.name}</h3>
              <p className="text-sm text-gray-500">{project.location}</p>
            </div>
            <div className="bg-gray-50 px-5 py-3 rounded-b-lg flex justify-between items-center text-sm">
                <div>
                    <span className="font-semibold text-gray-700">Pontuação: </span>
                    <span className="font-bold">{score !== null ? `${score}%` : 'N/A'}</span>
                </div>
                <div className={`${pendingActions > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                    <span className="font-semibold">{pendingActions}</span>
                    <span> pendências</span>
                </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderContent = () => {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    switch (view) {
      case 'PROJECT_DASHBOARD':
        if (!selectedProject) return null;
        return (
          <ProjectDashboard
            project={selectedProject}
            reports={authorizedReports.filter(r => r.projectId === selectedProject.id)}
            onViewReport={handleViewReport}
            onNewReport={() => handleCreateNewReport(selectedProject)}
            onEditReportCategory={handleEditReportCategory}
            onBack={navigateToSitesList}
            userRole={userProfile?.role || 'viewer'}
          />
        );
      case 'REPORT_FORM':
        if (!selectedProject) return null;
        return (
          <ReportForm
            project={selectedProject}
            // Passa o template novo se não estiver editando um existente
            existingReport={editingReport || newReportTemplate} 
            userProfile={userProfile!}
            onSave={(data, status) => handleAsyncSave(data, status)}
            onCancel={() => selectedProject ? setView('PROJECT_DASHBOARD') : navigateToSitesList()}
            initialCategoryId={initialCategoryId}
          />
        );
      case 'REPORT_VIEW':
        if (!selectedReport) return null;
        const projectForReport = projects.find(p => p.id === selectedReport.projectId);
        if (!projectForReport) return null;
        return (
          <ReportView
            report={selectedReport}
            project={projectForReport}
            onBack={() => setView('PROJECT_DASHBOARD')}
            onEdit={handleEditReport}
            userRole={userProfile?.role || 'viewer'}
          />
        );
      case 'MANAGEMENT_DASHBOARD':
        return <Dashboard projects={authorizedProjects} reports={authorizedReports} onSelectProject={handleSelectProject} onNavigateToSites={navigateToSitesList} onNavigateToPendingActions={handleNavigateToPendingActions} />;
      case 'PENDING_ACTIONS':
        return <PendingActions projects={authorizedProjects} reports={authorizedReports} onNavigateToReportItem={handleEditReportCategory} onBack={() => setView('MANAGEMENT_DASHBOARD')}/>;
      case 'ADMIN_PANEL':
          return <AdminPanel projects={projects} onRefreshData={() => loadData(userProfile!)} />;
      case 'SITES_LIST':
      default:
        return <SitesList />;
    }
  };
  
  const BottomNav: React.FC = () => {
    // Oculta a navegação global se estivermos dentro do formulário de inspeção
    // isso previne conflito visual com a navegação de categorias da inspeção
    if (view === 'REPORT_FORM') return null;

    const navItems = [
      { view: 'SITES_LIST' as View, label: 'Obras', icon: BuildingOfficeIcon, roles: ['admin', 'director', 'manager', 'assistant', 'viewer'] },
      { view: 'MANAGEMENT_DASHBOARD' as View, label: 'Gerencial', icon: ChartPieIcon, roles: ['admin', 'director', 'manager'] },
      { view: 'ADMIN_PANEL' as View, label: 'Admin', icon: WrenchScrewdriverIcon, roles: ['admin'] },
    ];
    
    const availableNavItems = navItems.filter(item => item.roles.includes(userProfile?.role || 'viewer'));

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-2px_5px_rgba(0,0,0,0.1)] flex justify-around items-center z-50 h-16 pb-safe">
          {availableNavItems.map(item => {
            const isActive = view === item.view || (item.view === 'SITES_LIST' && ['PROJECT_DASHBOARD', 'REPORT_VIEW'].includes(view));
            return (
              <button key={item.label} onClick={() => setView(item.view)} className={`flex flex-col items-center justify-center w-full h-full transition-colors ${isActive ? 'text-blue-600' : 'text-gray-500 hover:text-blue-500'}`}>
                <item.icon className="h-6 w-6 mb-1"/>
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            )
          })}
        </nav>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Toast message={toastMessage} onClear={() => setToastMessage('')} />
      <Header />
      <main className={`p-4 md:p-8 ${view === 'REPORT_FORM' ? 'pb-0 p-0' : 'pb-24'}`}>
        {renderContent()}
      </main>
      <BottomNav/>
    </div>
  );
};

export default App;
