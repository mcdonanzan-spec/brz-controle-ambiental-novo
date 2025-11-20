
import React from 'react';
import { Project, Report, InspectionStatus, UserRole } from '../types';
import { CHECKLIST_DEFINITIONS } from '../constants';
import { ArrowLeftIcon, PlusIcon, DocumentCheckIcon, ClockIcon, CheckCircleIcon, ConcreteMixerIcon, WastePipeIcon, HardHatIcon, OilBarrelIcon, GasPumpIcon } from './icons';

interface ProjectDashboardProps {
  project: Project;
  reports: Report[];
  onViewReport: (report: Report) => void;
  onNewReport: () => void;
  onEditReportCategory: (report: Report, categoryId: string) => void;
  onBack: () => void;
  userRole: UserRole;
}

const categoryIcons: { [key: string]: React.FC<React.SVGProps<SVGSVGElement>> } = {
    massa: ConcreteMixerIcon,
    efluentes: WastePipeIcon,
    campo: HardHatIcon,
    quimicos: OilBarrelIcon,
    combustivel: GasPumpIcon,
    signatures: DocumentCheckIcon
};

const ScoreRing: React.FC<{ score: number }> = ({ score }) => {
    const size = 40; 
    const strokeWidth = 3;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    const getColor = (s: number) => {
        if (s >= 90) return 'text-green-500';
        if (s >= 70) return 'text-blue-500';
        if (s >= 50) return 'text-yellow-500';
        return 'text-red-500';
    };

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg className="absolute" width={size} height={size}>
                <circle
                    className="text-gray-100"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                <circle
                    className={`transform -rotate-90 origin-center transition-all duration-1000 ${getColor(score)}`}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
            </svg>
            <span className={`text-xs font-bold ${getColor(score)}`}>{score}</span>
        </div>
    );
};

const ProjectDashboard: React.FC<ProjectDashboardProps> = ({ project, reports, onViewReport, onNewReport, onEditReportCategory, onBack, userRole }) => {

  const latestReport = reports.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  const isLatestReportCompleted = latestReport?.status === 'Completed';
  
  const canCreateOrEdit = userRole === 'admin' || userRole === 'assistant' || userRole === 'manager'; 

  const getCategoryStatus = (categoryId: string) => {
      if (!latestReport) return { isComplete: false };
      const categoryItemIds = CHECKLIST_DEFINITIONS.find(c => c.id === categoryId)?.subCategories.flatMap(sc => sc.items.map(i => i.id));
      if (!categoryItemIds) return { isComplete: false };
      
      const allAnswered = categoryItemIds.every(itemId => {
          const result = latestReport.results.find(r => r.itemId === itemId);
          return result && result.status !== null;
      });
      return { isComplete: allAnswered };
  }

  return (
    <div className="space-y-6 animate-fade-in pb-20">
        {/* Header */}
        <div className="bg-white p-4 -m-4 mb-2 shadow-sm md:bg-transparent md:shadow-none md:m-0 md:p-0">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <button onClick={onBack} className="flex items-center text-sm text-gray-500 hover:text-blue-600 mb-1">
                        <ArrowLeftIcon className="h-4 w-4 mr-1" />
                        Voltar
                    </button>
                    <h1 className="text-2xl font-bold text-gray-800 leading-tight">{project.name}</h1>
                    <p className="text-sm text-gray-500">{project.location}</p>
                </div>
                
                {canCreateOrEdit && (
                    <button
                    onClick={() => (latestReport && !isLatestReportCompleted) ? onEditReportCategory(latestReport, 'massa') : onNewReport()}
                    className="w-full md:w-auto flex items-center justify-center bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:bg-blue-700 transition duration-300"
                    >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    {(latestReport && !isLatestReportCompleted) ? 'Continuar Inspeção' : 'Nova Inspeção'}
                    </button>
                )}
            </div>
        </div>
      
        { !latestReport ? (
            <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-dashed border-gray-300 mx-auto max-w-lg">
                <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <DocumentCheckIcon className="h-8 w-8 text-gray-400"/>
                </div>
                <p className="text-gray-600 font-semibold text-lg">Nenhuma inspeção realizada.</p>
                {canCreateOrEdit && <p className="text-gray-400 text-sm mt-2">Inicie a primeira inspeção para esta obra.</p>}
            </div>
        ) : (
            <>
                {/* Score Card */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-5 rounded-2xl shadow-lg text-white relative overflow-hidden">
                    <div className="relative z-10 flex justify-between items-center">
                        <div>
                            <h2 className="text-lg font-bold text-white opacity-90">Conformidade Geral</h2>
                            <p className="text-xs text-blue-100 mt-1">Atualizado em: {new Date(latestReport.date).toLocaleDateString()}</p>
                            <span className={`inline-block mt-3 px-3 py-1 text-xs font-bold rounded-full bg-white bg-opacity-20 backdrop-blur-sm`}>
                                {latestReport.evaluation}
                            </span>
                        </div>
                        <div className="text-right">
                             <span className="text-5xl font-bold">{latestReport.score}<span className="text-xl opacity-70">%</span></span>
                        </div>
                    </div>
                    <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4">
                         <DocumentCheckIcon className="h-40 w-40"/>
                    </div>
                </div>

                {/* Category Grid */}
                <h3 className="text-gray-800 font-bold text-lg mt-6 mb-2">Categorias</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {CHECKLIST_DEFINITIONS.map(category => {
                        const score = latestReport.categoryScores[category.id] ?? 0;
                        const status = getCategoryStatus(category.id);
                        const Icon = categoryIcons[category.id];
                        return (
                            <div key={category.id} onClick={() => onEditReportCategory(latestReport, category.id)} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md active:scale-[0.99] transition-all cursor-pointer flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl ${status.isComplete ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-500'}`}>
                                        {Icon && <Icon className="h-6 w-6"/>}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-sm leading-tight">{category.title}</h3>
                                        <p className={`text-xs mt-1 font-medium ${status.isComplete ? 'text-green-600' : 'text-orange-500'}`}>
                                            {status.isComplete ? 'Completo' : 'Pendente'}
                                        </p>
                                    </div>
                                </div>
                                <ScoreRing score={score} />
                            </div>
                        )
                    })}
                </div>
            </>
        )}
        
        {/* History */}
        {reports.length > 1 && (
             <div className="mt-8">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Histórico de Inspeções</h2>
                  <div className="space-y-3">
                    {reports.filter(r => r.id !== latestReport?.id).map(report => (
                      <div key={report.id} onClick={() => onViewReport(report)} className="bg-white p-4 rounded-xl border border-gray-100 flex justify-between items-center cursor-pointer hover:bg-gray-50">
                          <div className="flex items-center gap-3">
                            <div className="bg-gray-100 p-2 rounded-lg text-gray-500">
                                <ClockIcon className="h-5 w-5"/>
                            </div>
                            <div>
                                <p className="font-bold text-gray-800 text-sm">{new Date(report.date).toLocaleDateString()}</p>
                                <p className="text-xs text-gray-500">{report.inspector}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                             <span className={`text-xs font-bold px-2 py-1 rounded ${report.evaluation === 'ÓTIMO' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{report.score}%</span>
                             <ArrowLeftIcon className="h-4 w-4 text-gray-300 rotate-180"/>
                          </div>
                      </div>
                    ))}
                  </div>
              </div>
        )}
    </div>
  );
};

export default ProjectDashboard;
