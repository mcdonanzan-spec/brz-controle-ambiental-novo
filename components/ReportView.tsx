
import React from 'react';
import { Report, Project, InspectionStatus, UserRole } from '../types';
import { CHECKLIST_DEFINITIONS } from '../constants';
import { ArrowLeftIcon, PencilIcon, ShieldCheckIcon } from './icons';

interface ReportViewProps {
  report: Report;
  project: Project;
  onBack: () => void;
  onEdit: (report: Report) => void;
  userRole: UserRole;
}

const ReportView: React.FC<ReportViewProps> = ({ report, project, onBack, onEdit, userRole }) => {
  const getStatusBadge = (status: InspectionStatus | null) => {
    switch (status) {
      case InspectionStatus.C:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Conforme</span>;
      case InspectionStatus.NC:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Não Conforme</span>;
      case InspectionStatus.NA:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-200 text-gray-800">Não Aplicável</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending</span>;
    }
  };
  
  const getEvaluationChip = (evaluation: string) => {
    switch (evaluation) {
      case 'ÓTIMO': return 'bg-green-100 text-green-800';
      case 'BOM': return 'bg-blue-100 text-blue-800';
      case 'REGULAR': return 'bg-yellow-100 text-yellow-800';
      case 'RUIM': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Edição permitida se:
  // 1. Status for Rascunho (E usuário não é Diretor/Viewer)
  // 2. Gerente assinando um relatório concluído sem assinatura dele
  // 3. Admin (superusuário)
  const canEdit = 
    (userRole !== 'director' && userRole !== 'viewer') && 
    (
        report.status === 'Draft' || 
        (userRole === 'manager' && !report.signatures.manager) ||
        userRole === 'admin'
    );

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl mx-auto">
      <div className="flex justify-between items-start mb-4 border-b pb-4">
        <div>
          <button onClick={onBack} className="flex items-center text-sm text-blue-600 hover:underline mb-2">
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Voltar
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Relatório de Inspeção</h1>
          <p className="text-gray-600">{project.name} - {new Date(report.date).toLocaleDateString()}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Inspetor</p>
          <p className="font-semibold text-gray-800">{report.inspector}</p>
          <div className="mt-2">
            <span className={`px-3 py-1 text-sm font-bold rounded-full ${getEvaluationChip(report.evaluation)}`}>
                {report.evaluation} ({report.score}%)
            </span>
          </div>
        </div>
      </div>
      
       {canEdit && (
         <div className="flex justify-end mb-4">
            <button
              onClick={() => onEdit(report)}
              className="flex items-center bg-yellow-500 text-white font-semibold py-2 px-4 rounded-lg shadow hover:bg-yellow-600 transition duration-300 text-sm"
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              {report.status === 'Draft' ? 'Editar Rascunho' : 'Assinar/Editar'}
            </button>
         </div>
      )}


      {CHECKLIST_DEFINITIONS.map(category => (
        <div key={category.id} className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700 bg-gray-100 p-3 rounded-t-lg">{category.title}</h2>
          {category.subCategories.map(subCat => (
            <div key={subCat.title} className="border border-t-0 rounded-b-lg p-3">
              <h3 className="text-md font-semibold text-gray-600 mb-2">{subCat.title}</h3>
              <ul className="divide-y divide-gray-200">
                {subCat.items.map(item => {
                  const result = report.results.find(r => r.itemId === item.id);
                  if (!result) return null;
                  return (
                    <li key={item.id} className="py-3">
                      <div className="flex justify-between items-start">
                        <p className="text-sm text-gray-800 flex-1 pr-4">{item.text}</p>
                        {getStatusBadge(result.status)}
                      </div>
                      {result.comment && <p className="text-sm text-gray-500 mt-2 pl-4 border-l-2 border-gray-200">"{result.comment}"</p>}
                      {result.photos.length > 0 && (
                        <div className="mt-2 flex items-center flex-wrap gap-2">
                            {result.photos.map(photo => (
                                <img key={photo.id} src={photo.dataUrl} alt="evidence" className="h-24 w-24 object-cover rounded-md border"/>
                            ))}
                        </div>
                      )}
                      {result.status === InspectionStatus.NC && result.actionPlan && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md text-sm">
                            <h5 className="font-bold text-red-700">Plano de Ação</h5>
                            <p><span className="font-semibold">Ação:</span> {result.actionPlan.actions}</p>
                            <p><span className="font-semibold">Responsável:</span> {result.actionPlan.responsible}</p>
                            <p><span className="font-semibold">Prazo:</span> {result.actionPlan.deadline}</p>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      ))}
      
      <div className="mt-8 pt-4 border-t">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Assinaturas do Documento</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Assinatura Inspetor */}
          <div className="bg-white border-2 border-[#1351B4] border-opacity-20 p-4 rounded-lg relative overflow-hidden">
             <div className="absolute top-0 right-0 p-2">
                 <ShieldCheckIcon className={`h-8 w-8 ${report.signatures.inspector ? 'text-[#1351B4]' : 'text-gray-300'}`}/>
             </div>
             <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Responsável Ambiental</p>
             <p className="font-bold text-lg text-gray-800">{report.signatures.inspector || 'Pendente'}</p>
             {report.signatures.inspectorDate && (
                 <div className="mt-2 pt-2 border-t border-dashed border-gray-300">
                     <p className="text-xs text-gray-500">Assinado eletronicamente em: <br/> <span className="font-mono text-gray-700">{report.signatures.inspectorDate}</span></p>
                     <div className="mt-2 inline-flex items-center px-2 py-1 rounded bg-[#1351B4] bg-opacity-10 text-[#1351B4] text-[10px] font-bold uppercase tracking-wider">
                        Verificado gov.br
                    </div>
                 </div>
             )}
          </div>

          {/* Assinatura Gerente */}
          <div className="bg-white border-2 border-[#1351B4] border-opacity-20 p-4 rounded-lg relative overflow-hidden">
             <div className="absolute top-0 right-0 p-2">
                 <ShieldCheckIcon className={`h-8 w-8 ${report.signatures.manager ? 'text-[#1351B4]' : 'text-gray-300'}`}/>
             </div>
             <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Engenheiro Gerente</p>
             <p className="font-bold text-lg text-gray-800">{report.signatures.manager || 'Pendente'}</p>
             {report.signatures.managerDate && (
                 <div className="mt-2 pt-2 border-t border-dashed border-gray-300">
                     <p className="text-xs text-gray-500">Assinado eletronicamente em: <br/> <span className="font-mono text-gray-700">{report.signatures.managerDate}</span></p>
                     <div className="mt-2 inline-flex items-center px-2 py-1 rounded bg-[#1351B4] bg-opacity-10 text-[#1351B4] text-[10px] font-bold uppercase tracking-wider">
                        Verificado gov.br
                    </div>
                 </div>
             )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ReportView;
