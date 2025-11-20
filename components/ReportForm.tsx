
import React, { useState, useMemo, useEffect } from 'react';
import { Project, Report, InspectionStatus, ChecklistItem, InspectionItemResult, Photo, ActionPlan, UserProfile } from '../types';
import { CHECKLIST_DEFINITIONS } from '../constants';
import { getNewReportTemplate } from '../services/dbApi';
import { CameraIcon, CheckIcon, PaperAirplaneIcon, XMarkIcon, DocumentCheckIcon, MinusIcon, UserCircleIcon, ExclamationTriangleIcon, ConcreteMixerIcon, WastePipeIcon, HardHatIcon, OilBarrelIcon, GasPumpIcon } from './icons';

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
    <div className="mt-3 flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
      <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleFileChange} className="hidden" disabled={disabled} />
      
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
        className="flex-shrink-0 h-24 w-24 bg-white border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 hover:border-blue-400 hover:text-blue-500 transition disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        <CameraIcon className="h-8 w-8 mb-1" />
        <span className="text-[10px] font-bold uppercase">Adicionar</span>
      </button>

      {photos.map(photo => (
        <div key={photo.id} className="relative group flex-shrink-0">
          <img src={photo.dataUrl} alt="inspection" className="h-24 w-24 rounded-xl object-cover shadow-sm border border-gray-200" />
          <button disabled={disabled} onClick={() => onRemovePhoto(photo.id)} className={`absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1.5 shadow-md ${disabled ? 'hidden' : 'opacity-100'} transition-opacity`}>
            <XMarkIcon className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
};

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
                    ) }

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
            </div>
        </div>
    )
}

const ReportForm: React.FC<ReportFormProps> = ({ project, existingReport, userProfile, onSave, onCancel, initialCategoryId }) => {
  const [reportData, setReportData] = useState<Omit<Report, 'id' | 'score' | 'evaluation' | 'categoryScores'> & {id?: string}>(
    existingReport ? {...existingReport} : getNewReportTemplate(project.id, userProfile.full_name, userProfile.id)
  );
  const [activeCategoryId, setActiveCategoryId] = useState<string>(initialCategoryId || CHECKLIST_DEFINITIONS[0].id);
  
  const [showGovLogin, setShowGovLogin] = useState(false);
  const [signingRole, setSigningRole] = useState<'inspector' | 'manager' | null>(null);

  const isReadOnly = useMemo(() => {
      if (userProfile.role === 'director' || userProfile.role === 'viewer') return true;
      return existingReport?.status === 'Completed' && userProfile.role !== 'manager'; 
  }, [existingReport, userProfile.role]);
  
  const handleResultChange = (itemId: string, status: InspectionStatus) => {
    if (isReadOnly) return;

    setReportData(prev => {
        // Se o status não for NC, limpamos as evidências para não salvar lixo no banco
        const shouldClearEvidence = status !== InspectionStatus.NC;

        return {
            ...prev,
            results: prev.results.map(res => {
                if (res.itemId === itemId) {
                    return { 
                        ...res, 
                        status: status,
                        // Se mudou para Conforme ou NA, reseta fotos e plano
                        photos: shouldClearEvidence ? [] : res.photos,
                        comment: shouldClearEvidence ? '' : res.comment,
                        actionPlan: shouldClearEvidence ? undefined : (res.actionPlan || { actions: '', responsible: '', deadline: '', resources: { fin: false, mo: false, adm: false }})
                    };
                }
                return res;
            }),
        }
    });
  };

  const updateEvidence = (itemId: string, updates: Partial<InspectionItemResult>) => {
      if (isReadOnly) return;
      setReportData(prev => ({
          ...prev,
          results: prev.results.map(res => (res.itemId === itemId ? { ...res, ...updates } : res))
      }));
  }

  const handleSave = (status: 'Draft' | 'Completed') => {
      if (status === 'Completed') {
          // Validação
          const categoryItemIds = CHECKLIST_DEFINITIONS.flatMap(cat => cat.subCategories.flatMap(sc => sc.items.map(i => i.id)));
          const unansweredItem = categoryItemIds.find(itemId => {
              const result = reportData.results.find(r => r.itemId === itemId);
              return !result || result.status === null;
          });

          if (unansweredItem) {
              alert("Por favor, responda todos os itens antes de finalizar.");
              return;
          }

          const invalidNC = reportData.results.find(r => r.status === InspectionStatus.NC && (!r.actionPlan?.actions));
          if (invalidNC) {
              alert("Itens Não Conformes exigem Plano de Ação preenchido.");
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
    massa: ConcreteMixerIcon,
    efluentes: WastePipeIcon,
    campo: HardHatIcon,
    quimicos: OilBarrelIcon,
    combustivel: GasPumpIcon,
    signatures: DocumentCheckIcon
  };

  return (
    <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col h-[100dvh] w-full">
      <GovBrAuthModal isOpen={showGovLogin} onClose={() => setShowGovLogin(false)} onConfirm={handleGovLoginConfirm} />
      
      {/* APP HEADER */}
      <div className="bg-white border-b px-4 py-3 flex justify-between items-center shadow-sm flex-shrink-0">
            <div className="flex flex-col">
                <h1 className="text-lg font-bold text-gray-900 leading-tight">{project.name}</h1>
                <span className="text-xs text-gray-500">Inspeção em andamento</span>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={onCancel} className="text-gray-500 text-sm font-medium px-3 py-2">Sair</button>
                <button 
                    onClick={() => handleSave('Completed')} 
                    disabled={isReadOnly}
                    className="bg-blue-600 text-white text-sm font-bold px-4 py-2 rounded-full shadow hover:bg-blue-700 disabled:opacity-50"
                >
                    Finalizar
                </button>
            </div>
      </div>

      {/* MAIN SCROLL AREA */}
      <div className="flex-1 overflow-y-auto bg-gray-100 pb-32">
        {activeCategory && (
            <div className="max-w-3xl mx-auto p-4">
                 <div className="flex items-center space-x-2 mb-6 mt-2">
                     <div className="p-2 bg-blue-100 rounded-lg text-blue-700">
                         {categoryIcons[activeCategory.id] && React.createElement(categoryIcons[activeCategory.id], { className: "h-6 w-6" })}
                     </div>
                     <h2 className="text-xl font-bold text-gray-800">{activeCategory.title}</h2>
                 </div>

                 <div className="space-y-4">
                    {activeCategory.subCategories.map(subCat => (
                        <div key={subCat.title} className="space-y-3">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider ml-1">{subCat.title}</h3>
                            
                            {subCat.items.map(item => {
                                const result = reportData.results.find(r => r.itemId === item.id);
                                if (!result) return null;

                                return (
                                    <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                        <div className="p-4 md:p-6">
                                            {/* Status Badge if Previous NC */}
                                            {result.previousNc && (
                                                <div className="inline-flex items-center px-2 py-1 mb-3 rounded bg-orange-50 text-orange-700 border border-orange-100 text-[10px] font-bold uppercase tracking-wide">
                                                    <ExclamationTriangleIcon className="h-3 w-3 mr-1"/> Reincidência
                                                </div>
                                            )}
                                            
                                            {/* Question */}
                                            <p className="text-gray-900 font-medium text-base md:text-lg leading-snug mb-6">
                                                {item.text}
                                            </p>

                                            {/* ACTION BUTTONS - BIG TOUCH TARGETS */}
                                            <div className="grid grid-cols-3 gap-3">
                                                <button
                                                    onClick={() => handleResultChange(item.id, InspectionStatus.C)}
                                                    className={`h-14 rounded-xl flex flex-col items-center justify-center border-2 transition-all ${
                                                        result.status === InspectionStatus.C
                                                        ? 'bg-green-500 border-green-500 text-white shadow-md transform scale-[1.02]'
                                                        : 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    <CheckIcon className="h-6 w-6" strokeWidth={3} />
                                                    {result.status === InspectionStatus.C && <span className="text-[10px] font-bold mt-1">Conforme</span>}
                                                </button>

                                                <button
                                                    onClick={() => handleResultChange(item.id, InspectionStatus.NC)}
                                                    className={`h-14 rounded-xl flex flex-col items-center justify-center border-2 transition-all ${
                                                        result.status === InspectionStatus.NC
                                                        ? 'bg-red-500 border-red-500 text-white shadow-md transform scale-[1.02]'
                                                        : 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    <XMarkIcon className="h-6 w-6" strokeWidth={3} />
                                                    {result.status === InspectionStatus.NC && <span className="text-[10px] font-bold mt-1">Não Conforme</span>}
                                                </button>

                                                <button
                                                    onClick={() => handleResultChange(item.id, InspectionStatus.NA)}
                                                    className={`h-14 rounded-xl flex flex-col items-center justify-center border-2 transition-all ${
                                                        result.status === InspectionStatus.NA
                                                        ? 'bg-gray-500 border-gray-500 text-white shadow-md transform scale-[1.02]'
                                                        : 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    <MinusIcon className="h-6 w-6" strokeWidth={3} />
                                                    {result.status === InspectionStatus.NA && <span className="text-[10px] font-bold mt-1">N/A</span>}
                                                </button>
                                            </div>
                                        </div>

                                        {/* EVIDENCE PANEL - EXPANDS ONLY ON NC */}
                                        {result.status === InspectionStatus.NC && (
                                            <div className="bg-red-50 border-t border-red-100 p-4 animate-fade-in">
                                                <div className="space-y-4">
                                                    {/* Photos */}
                                                    <div>
                                                        <label className="block text-xs font-bold text-red-800 uppercase mb-2">Evidências (Fotos)</label>
                                                        <PhotoUploader 
                                                            photos={result.photos} 
                                                            onAddPhoto={(p) => updateEvidence(item.id, { photos: [...result.photos, p] })}
                                                            onRemovePhoto={(pid) => updateEvidence(item.id, { photos: result.photos.filter(p => p.id !== pid) })}
                                                            disabled={isReadOnly}
                                                        />
                                                    </div>

                                                    {/* Observation */}
                                                    <div>
                                                        <label className="block text-xs font-bold text-red-800 uppercase mb-2">Observação</label>
                                                        <textarea
                                                            value={result.comment}
                                                            onChange={e => updateEvidence(item.id, { comment: e.target.value })}
                                                            placeholder="Descreva o problema encontrado..."
                                                            className="w-full p-3 rounded-lg border border-red-200 focus:border-red-400 focus:ring-1 focus:ring-red-400 text-sm bg-white"
                                                            rows={3}
                                                        />
                                                    </div>

                                                    {/* Action Plan */}
                                                    <div className="bg-white rounded-lg p-3 border border-red-200 shadow-sm">
                                                        <div className="flex items-center mb-3 text-red-700">
                                                            <ExclamationTriangleIcon className="h-4 w-4 mr-1.5"/>
                                                            <span className="text-xs font-bold uppercase">Plano de Ação Obrigatório</span>
                                                        </div>
                                                        
                                                        <div className="space-y-3">
                                                            <div>
                                                                <span className="block text-[10px] font-bold text-gray-500 mb-1">AÇÃO CORRETIVA</span>
                                                                <input
                                                                    type="text"
                                                                    value={result.actionPlan?.actions || ''}
                                                                    onChange={e => updateEvidence(item.id, { actionPlan: { ...result.actionPlan!, actions: e.target.value } })}
                                                                    className="w-full p-2 text-sm border border-gray-300 rounded focus:border-red-400 outline-none"
                                                                    placeholder="O que será feito?"
                                                                />
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <div className="flex-1">
                                                                    <span className="block text-[10px] font-bold text-gray-500 mb-1">RESPONSÁVEL</span>
                                                                    <input
                                                                        type="text"
                                                                        value={result.actionPlan?.responsible || ''}
                                                                        onChange={e => updateEvidence(item.id, { actionPlan: { ...result.actionPlan!, responsible: e.target.value } })}
                                                                        className="w-full p-2 text-sm border border-gray-300 rounded focus:border-red-400 outline-none"
                                                                        placeholder="Nome"
                                                                    />
                                                                </div>
                                                                <div className="w-1/3">
                                                                    <span className="block text-[10px] font-bold text-gray-500 mb-1">PRAZO</span>
                                                                    <input
                                                                        type="date"
                                                                        value={result.actionPlan?.deadline || ''}
                                                                        onChange={e => updateEvidence(item.id, { actionPlan: { ...result.actionPlan!, deadline: e.target.value } })}
                                                                        className="w-full p-2 text-sm border border-gray-300 rounded focus:border-red-400 outline-none"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    ))}
                 </div>
            </div>
        )}
      </div>

      {/* BOTTOM CATEGORY NAV - STICKY */}
      <div className="h-20 bg-white border-t border-gray-200 flex items-center px-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] flex-shrink-0">
        <div className="flex w-full overflow-x-auto gap-2 no-scrollbar px-2">
             {CHECKLIST_DEFINITIONS.map(cat => {
                 const Icon = categoryIcons[cat.id] || ConcreteMixerIcon;
                 const isActive = activeCategoryId === cat.id;
                 const catItemIds = cat.subCategories.flatMap(s => s.items.map(i => i.id));
                 const filledCount = reportData.results.filter(r => catItemIds.includes(r.itemId) && r.status !== null).length;
                 const totalCount = catItemIds.length;
                 const isComplete = filledCount === totalCount;
                 
                 return (
                    <button
                        key={cat.id}
                        onClick={() => setActiveCategoryId(cat.id)}
                        className={`flex-shrink-0 flex flex-col items-center justify-center min-w-[70px] h-16 rounded-lg transition-all ${
                            isActive ? 'bg-blue-50' : 'bg-transparent'
                        }`}
                    >
                        <div className={`relative transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                            <Icon className="h-6 w-6" />
                            {isComplete && !isActive && (
                                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
                            )}
                        </div>
                        <span className={`text-[10px] font-bold mt-1 truncate max-w-[80px] ${isActive ? 'text-blue-700' : 'text-gray-400'}`}>
                            {cat.title.split(' ')[0]}
                        </span>
                    </button>
                 )
             })}
        </div>
      </div>

    </div>
  );
};

export default ReportForm;
