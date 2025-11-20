
import React, { useState, useMemo } from 'react';
import { Project, Report, InspectionStatus, ChecklistItem, InspectionItemResult, Photo, ActionPlan, UserProfile } from '../types';
import { CHECKLIST_DEFINITIONS } from '../constants';
import { getNewReportTemplate } from '../services/dbApi';
import { CameraIcon, CheckIcon, PaperAirplaneIcon, XMarkIcon, CubeTransparentIcon, FunnelIcon, WrenchScrewdriverIcon, BeakerIcon, FireIcon, DocumentCheckIcon, MinusIcon, FingerPrintIcon, ShieldCheckIcon, UserCircleIcon, ExclamationTriangleIcon } from './icons';

interface ReportFormProps {
  project: Project;
  existingReport: Report | null;
  userProfile: UserProfile;
  onSave: (data: Omit<Report, 'id' | 'score' | 'evaluation' | 'categoryScores'> & {id?: string}, status: 'Draft' | 'Completed') => void;
  onCancel: () => void;
  initialCategoryId?: string;
}

const PhotoUploader: React.FC<{ photos: Photo[], onAddPhoto: (photo: Photo) => void, onRemovePhoto: (id: string) => void, disabled?: boolean }> = ({ photos, onAddPhoto, onRemovePhoto, disabled }) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const newPhoto: Photo = {
          id: `photo-${Date.now()}`,
          dataUrl: reader.result as string,
        };
        onAddPhoto(newPhoto);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="mt-2 flex items-center gap-2 flex-wrap">
      {photos.map(photo => (
        <div key={photo.id} className="relative group">
          <img src={photo.dataUrl} alt="inspection" className="h-20 w-20 rounded-md object-cover" />
          <button disabled={disabled} onClick={() => onRemovePhoto(photo.id)} className={`absolute top-0 right-0 bg-red-600 text-white rounded-full p-1 transform translate-x-1/2 -translate-y-1/2 ${disabled ? 'hidden' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
            <XMarkIcon className="h-3 w-3" />
          </button>
        </div>
      ))}
      <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleFileChange} className="hidden" disabled={disabled} />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
        className="h-20 w-20 bg-gray-100 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center text-gray-500 hover:bg-gray-200 hover:border-gray-400 transition disabled:bg-gray-200 disabled:cursor-not-allowed"
      >
        <CameraIcon className="h-8 w-8" />
        <span className="text-xs mt-1">Adicionar</span>
      </button>
    </div>
  );
};

// Simulação Modal Gov.br
const GovBrAuthModal: React.FC<{ isOpen: boolean; onClose: () => void; onConfirm: () => void }> = ({ isOpen, onClose, onConfirm }) => {
    const [step, setStep] = useState<'cpf' | 'password'>('cpf');
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleNext = () => {
        if(step === 'cpf') {
            setStep('password');
        } else {
            setIsLoading(true);
            setTimeout(() => {
                setIsLoading(false);
                onConfirm();
                setStep('cpf');
            }, 1500);
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden">
                <div className="flex items-center p-4 border-b">
                    <div className="flex space-x-2 font-bold text-2xl text-[#1351B4]">
                         <span className="italic">gov.br</span>
                    </div>
                </div>
                <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Identifique-se no gov.br</h3>
                    <p className="text-sm text-gray-600 mb-6">Utilize sua conta gov.br para assinar digitalmente este documento.</p>

                    {step === 'cpf' ? (
                         <div className="space-y-4">
                             <div>
                                 <label className="block text-sm font-medium text-gray-700">Número do CPF</label>
                                 <input type="text" placeholder="Digite seu CPF" className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-[#1351B4] focus:border-[#1351B4]" autoFocus/>
                             </div>
                             <div className="text-sm text-gray-500">
                                 Digite seu CPF para <span className="font-bold">criar</span> ou <span className="font-bold">acessar</span> sua conta gov.br
                             </div>
                         </div>
                    ) : (
                         <div className="space-y-4 animate-fade-in">
                             <div className="flex items-center space-x-2 mb-2">
                                 <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600">
                                     <UserCircleIcon className="h-6 w-6"/>
                                 </div>
                                 <span className="text-sm font-bold">***.***.***-**</span>
                             </div>
                             <div>
                                 <label className="block text-sm font-medium text-gray-700">Senha</label>
                                 <input type="password" placeholder="Digite sua senha" className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-[#1351B4] focus:border-[#1351B4]" autoFocus/>
                             </div>
                         </div>
                    )}

                    <div className="mt-8 flex justify-end space-x-3">
                        <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancelar</button>
                        <button 
                            onClick={handleNext}
                            disabled={isLoading}
                            className="px-6 py-2 bg-[#1351B4] text-white font-semibold rounded-full hover:bg-blue-800 transition-colors flex items-center"
                        >
                            {isLoading ? (
                                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            ) : null}
                            {step === 'cpf' ? 'Continuar' : 'Entrar'}
                        </button>
                    </div>
                </div>
                <div className="bg-gray-50 p-3 text-center text-xs text-gray-500 border-t">
                    Ministério da Gestão e da Inovação em Serviços Públicos
                </div>
            </div>
        </div>
    )
}

const ReportForm: React.FC<ReportFormProps> = ({ project, existingReport, userProfile, onSave, onCancel, initialCategoryId }) => {
  const [reportData, setReportData] = useState<Omit<Report, 'id' | 'score' | 'evaluation' | 'categoryScores'> & {id?: string}>(
    existingReport ? {...existingReport} : getNewReportTemplate(project.id, userProfile.full_name, userProfile.id)
  );
  const [activeCategoryId, setActiveCategoryId] = useState<string>(initialCategoryId || CHECKLIST_DEFINITIONS[0].id);
  
  // Estados para Modal Gov.br
  const [showGovLogin, setShowGovLogin] = useState(false);
  const [signingRole, setSigningRole] = useState<'inspector' | 'manager' | null>(null);

  // Diretor e Viewer nunca editam, independente do status.
  const isReadOnly = useMemo(() => {
      if (userProfile.role === 'director' || userProfile.role === 'viewer') return true;
      return existingReport?.status === 'Completed' && userProfile.role !== 'manager'; 
  }, [existingReport, userProfile.role]);
  
  const handleResultChange = (itemId: string, newResult: Partial<InspectionItemResult>) => {
    if (isReadOnly) return;
    setReportData(prev => ({
      ...prev,
      results: prev.results.map(res => (res.itemId === itemId ? { ...res, ...newResult } : res)),
    }));
  };

  const handleSave = (status: 'Draft' | 'Completed') => {
      if (status === 'Completed') {
          // Validação: Verificar se todos os itens foram respondidos
          const categoryItemIds = CHECKLIST_DEFINITIONS.flatMap(cat => cat.subCategories.flatMap(sc => sc.items.map(i => i.id)));
          const unansweredItem = categoryItemIds.find(itemId => {
              const result = reportData.results.find(r => r.itemId === itemId);
              return !result || result.status === null;
          });

          if (unansweredItem) {
              const itemDef = CHECKLIST_DEFINITIONS.flatMap(c => c.subCategories.flatMap(sc => sc.items)).find(i => i.id === unansweredItem);
              alert(`Não é possível finalizar.\n\nO item abaixo ainda não foi avaliado:\n"${itemDef?.text.substring(0, 50)}..."`);
              return;
          }

          // Validação: Verificar se NC tem plano de ação
          const invalidNC = reportData.results.find(r => r.status === InspectionStatus.NC && (!r.actionPlan?.actions));
          if (invalidNC) {
              const itemDef = CHECKLIST_DEFINITIONS.flatMap(c => c.subCategories.flatMap(sc => sc.items)).find(i => i.id === invalidNC.itemId);
              alert(`Não é possível finalizar.\n\nO item "Não Conforme" abaixo precisa de um Plano de Ação:\n"${itemDef?.text.substring(0, 50)}..."`);
              return;
          }

          if (userProfile.role === 'manager') {
               setSigningRole('manager');
               setShowGovLogin(true);
          } else {
               setSigningRole('inspector');
               setShowGovLogin(true);
          }
      } else {
          onSave(reportData, 'Draft');
      }
  }

  const handleGovLoginConfirm = () => {
      const dateStr = new Date().toLocaleString('pt-BR');
      const updatedReport = { ...reportData };
      
      if (signingRole === 'inspector') {
          updatedReport.signatures.inspector = userProfile.full_name;
          updatedReport.signatures.inspectorDate = dateStr;
      } else if (signingRole === 'manager') {
          updatedReport.signatures.manager = userProfile.full_name;
          updatedReport.signatures.managerDate = dateStr;
      }

      setReportData(updatedReport);
      setShowGovLogin(false);
      onSave(updatedReport, 'Completed');
  }

  const activeCategory = CHECKLIST_DEFINITIONS.find(c => c.id === activeCategoryId);

  const categoryIcons: { [key: string]: React.FC<React.SVGProps<SVGSVGElement>> } = {
    massa: CubeTransparentIcon,
    efluentes: FunnelIcon,
    campo: WrenchScrewdriverIcon,
    quimicos: BeakerIcon,
    combustivel: FireIcon,
    signatures: DocumentCheckIcon
  };

  return (
    <div className="bg-white rounded-lg shadow-xl flex flex-col h-[calc(100vh-140px)]">
      <GovBrAuthModal isOpen={showGovLogin} onClose={() => setShowGovLogin(false)} onConfirm={handleGovLoginConfirm} />
      
      {/* Header fixo */}
      <div className="p-4 border-b flex justify-between items-center flex-shrink-0 bg-white rounded-t-lg z-10">
        <div>
            <h2 className="text-xl font-bold text-gray-800">Nova Inspeção: {project.name}</h2>
            <p className="text-sm text-gray-500">Inspetor: {reportData.inspector}</p>
        </div>
        <div className="space-x-3">
             <button onClick={onCancel} className="text-gray-600 hover:text-gray-800 font-medium px-3 py-2">Cancelar</button>
             <button onClick={() => handleSave('Draft')} className="bg-gray-200 text-gray-700 hover:bg-gray-300 px-4 py-2 rounded-lg font-medium transition-colors" disabled={isReadOnly}>
                Salvar Rascunho
             </button>
             <button onClick={() => handleSave('Completed')} className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg font-medium shadow-md transition-colors flex items-center" disabled={isReadOnly}>
                <CheckIcon className="h-5 w-5 mr-1"/>
                Finalizar
             </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navegação */}
        <div className="w-64 bg-gray-50 border-r overflow-y-auto hidden md:block">
            <nav className="p-4 space-y-2">
                {CHECKLIST_DEFINITIONS.map(cat => {
                    const Icon = categoryIcons[cat.id] || CubeTransparentIcon;
                    const isActive = activeCategoryId === cat.id;
                    
                    const catItemIds = cat.subCategories.flatMap(s => s.items.map(i => i.id));
                    const filledCount = reportData.results.filter(r => catItemIds.includes(r.itemId) && r.status !== null).length;
                    const totalCount = catItemIds.length;
                    const isComplete = filledCount === totalCount;

                    return (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategoryId(cat.id)}
                            className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${isActive ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            <div className="flex items-center">
                                <Icon className={`h-5 w-5 mr-3 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                                <span className="text-sm font-medium">{cat.title.split(' ')[0]}...</span>
                            </div>
                            {isComplete ? (
                                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                            ) : (
                                <span className="text-xs text-gray-400">{filledCount}/{totalCount}</span>
                            )}
                        </button>
                    )
                })}
            </nav>
        </div>

        {/* Mobile Tabs */}
        <div className="md:hidden overflow-x-auto flex border-b bg-gray-50 flex-shrink-0">
             {CHECKLIST_DEFINITIONS.map(cat => {
                 const Icon = categoryIcons[cat.id] || CubeTransparentIcon;
                 const isActive = activeCategoryId === cat.id;
                 return (
                    <button
                        key={cat.id}
                        onClick={() => setActiveCategoryId(cat.id)}
                        className={`flex-shrink-0 p-4 flex flex-col items-center min-w-[80px] ${isActive ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50' : 'text-gray-500'}`}
                    >
                        <Icon className="h-6 w-6 mb-1" />
                        <span className="text-[10px] font-bold text-center leading-tight">{cat.title.slice(0, 8)}..</span>
                    </button>
                 )
             })}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
            {activeCategory && (
                <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
                    <div className="flex items-center space-x-3 mb-6 border-b pb-4">
                         {categoryIcons[activeCategory.id] && React.createElement(categoryIcons[activeCategory.id], { className: "h-8 w-8 text-blue-600" })}
                         <h2 className="text-2xl font-bold text-gray-800">{activeCategory.title}</h2>
                    </div>

                    {activeCategory.subCategories.map(subCat => (
                        <div key={subCat.title} className="bg-white border rounded-lg overflow-hidden shadow-sm">
                            <div className="bg-gray-100 px-4 py-2 border-b">
                                <h3 className="font-semibold text-gray-700">{subCat.title}</h3>
                            </div>
                            <div className="divide-y">
                                {subCat.items.map(item => {
                                    const result = reportData.results.find(r => r.itemId === item.id);
                                    if (!result) return null;

                                    return (
                                        <div key={item.id} className="p-5 hover:bg-gray-50 transition-colors">
                                            {/* Question Text & Previous Warning */}
                                            <div className="mb-4">
                                                <p className="text-gray-800 text-base font-medium mb-2">{item.text}</p>
                                                {result.previousNc && (
                                                    <div className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200 animate-pulse">
                                                        <ExclamationTriangleIcon className="h-4 w-4 mr-1"/>
                                                        PENDÊNCIA DO RELATÓRIO ANTERIOR
                                                    </div>
                                                )}
                                            </div>

                                            {/* Botões de Ação - Layout Clássico */}
                                            <div className="flex items-center gap-4 mb-4">
                                                <button
                                                    onClick={() => handleResultChange(item.id, { status: InspectionStatus.C })}
                                                    disabled={isReadOnly}
                                                    className={`flex-1 flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                                                        result.status === InspectionStatus.C 
                                                        ? 'bg-green-500 border-green-600 text-white shadow-md transform scale-105' 
                                                        : 'bg-white border-gray-200 text-gray-400 hover:border-green-300 hover:bg-green-50'
                                                    }`}
                                                >
                                                    <CheckIcon className="h-8 w-8 mb-1" />
                                                    <span className="text-xs font-bold">Conforme</span>
                                                </button>

                                                <button
                                                    onClick={() => handleResultChange(item.id, { status: InspectionStatus.NC })}
                                                    disabled={isReadOnly}
                                                    className={`flex-1 flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                                                        result.status === InspectionStatus.NC 
                                                        ? 'bg-red-500 border-red-600 text-white shadow-md transform scale-105' 
                                                        : 'bg-white border-gray-200 text-gray-400 hover:border-red-300 hover:bg-red-50'
                                                    }`}
                                                >
                                                    <XMarkIcon className="h-8 w-8 mb-1" />
                                                    <span className="text-xs font-bold">Não Conforme</span>
                                                </button>

                                                <button
                                                    onClick={() => handleResultChange(item.id, { status: InspectionStatus.NA })}
                                                    disabled={isReadOnly}
                                                    className={`flex-1 flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                                                        result.status === InspectionStatus.NA 
                                                        ? 'bg-gray-500 border-gray-600 text-white shadow-md transform scale-105' 
                                                        : 'bg-white border-gray-200 text-gray-400 hover:border-gray-400 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    <MinusIcon className="h-8 w-8 mb-1" />
                                                    <span className="text-xs font-bold">N/A</span>
                                                </button>
                                            </div>

                                            {/* Campos Condicionais (Fotos, Comentários, Plano de Ação) */}
                                            <div className="mt-3 space-y-3 pl-1">
                                                {/* Photos */}
                                                <PhotoUploader 
                                                    photos={result.photos} 
                                                    onAddPhoto={(p) => handleResultChange(item.id, { photos: [...result.photos, p] })}
                                                    onRemovePhoto={(pid) => handleResultChange(item.id, { photos: result.photos.filter(p => p.id !== pid) })}
                                                    disabled={isReadOnly}
                                                />
                                                
                                                {/* Comment */}
                                                <textarea
                                                    placeholder="Observações adicionais..."
                                                    value={result.comment}
                                                    onChange={e => handleResultChange(item.id, { comment: e.target.value })}
                                                    disabled={isReadOnly}
                                                    className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 bg-gray-50 focus:bg-white transition-colors"
                                                    rows={2}
                                                />

                                                {/* Action Plan (Only if NC) */}
                                                {result.status === InspectionStatus.NC && (
                                                    <div className="bg-red-50 p-4 rounded-lg border border-red-200 mt-4 animate-fade-in shadow-sm">
                                                        <div className="flex items-center mb-3 text-red-700">
                                                            <ExclamationTriangleIcon className="h-5 w-5 mr-2"/>
                                                            <h4 className="text-sm font-bold uppercase">Plano de Ação Obrigatório</h4>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div className="md:col-span-2">
                                                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">O que será feito?</label>
                                                                <input 
                                                                    type="text" 
                                                                    value={result.actionPlan?.actions || ''}
                                                                    onChange={e => handleResultChange(item.id, { actionPlan: { ...result.actionPlan!, actions: e.target.value } })}
                                                                    disabled={isReadOnly}
                                                                    placeholder="Descreva a ação corretiva..."
                                                                    className="w-full p-2 border border-red-300 rounded focus:ring-red-500 focus:border-red-500"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Responsável</label>
                                                                <input 
                                                                    type="text" 
                                                                    value={result.actionPlan?.responsible || ''}
                                                                    onChange={e => handleResultChange(item.id, { actionPlan: { ...result.actionPlan!, responsible: e.target.value } })}
                                                                    disabled={isReadOnly}
                                                                    className="w-full p-2 border border-red-300 rounded focus:ring-red-500 focus:border-red-500"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Prazo Limite</label>
                                                                <input 
                                                                    type="date" 
                                                                    value={result.actionPlan?.deadline || ''}
                                                                    onChange={e => handleResultChange(item.id, { actionPlan: { ...result.actionPlan!, deadline: e.target.value } })}
                                                                    disabled={isReadOnly}
                                                                    className="w-full p-2 border border-red-300 rounded focus:ring-red-500 focus:border-red-500"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ReportForm;
