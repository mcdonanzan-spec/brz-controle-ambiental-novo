
import React, { useState, useMemo } from 'react';
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
    <div className="mt-2 flex items-center gap-3 flex-wrap">
      {photos.map(photo => (
        <div key={photo.id} className="relative group">
          <img src={photo.dataUrl} alt="inspection" className="h-20 w-20 rounded-lg object-cover shadow-sm" />
          <button disabled={disabled} onClick={() => onRemovePhoto(photo.id)} className={`absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 shadow-md ${disabled ? 'hidden' : 'opacity-100'} transition-opacity`}>
            <XMarkIcon className="h-3 w-3" />
          </button>
        </div>
      ))}
      <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleFileChange} className="hidden" disabled={disabled} />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
        className="h-20 w-20 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:bg-gray-100 hover:border-blue-400 hover:text-blue-500 transition disabled:bg-gray-200 disabled:cursor-not-allowed"
      >
        <CameraIcon className="h-8 w-8" />
        <span className="text-[10px] font-bold uppercase mt-1">Foto</span>
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
    massa: ConcreteMixerIcon,
    efluentes: WastePipeIcon,
    campo: HardHatIcon,
    quimicos: OilBarrelIcon,
    combustivel: GasPumpIcon,
    signatures: DocumentCheckIcon
  };

  return (
    <div className="bg-white md:rounded-lg shadow-xl flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-140px)] w-full max-w-6xl mx-auto">
      <GovBrAuthModal isOpen={showGovLogin} onClose={() => setShowGovLogin(false)} onConfirm={handleGovLoginConfirm} />
      
      {/* Header */}
      <div className="p-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center flex-shrink-0 bg-white md:rounded-t-lg z-10 gap-3">
        <div>
            <h2 className="text-lg md:text-xl font-bold text-gray-800 leading-tight">Inspeção: {project.name}</h2>
            <p className="text-xs text-gray-500">{reportData.inspector}</p>
        </div>
        <div className="flex space-x-2 w-full sm:w-auto">
             <button onClick={onCancel} className="flex-1 sm:flex-none text-gray-600 hover:bg-gray-100 border border-gray-300 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                Cancelar
             </button>
             <button onClick={() => handleSave('Draft')} className="flex-1 sm:flex-none bg-gray-100 text-gray-700 hover:bg-gray-200 px-3 py-2 rounded-lg text-sm font-medium transition-colors" disabled={isReadOnly}>
                Salvar
             </button>
             <button onClick={() => handleSave('Completed')} className="flex-1 sm:flex-none bg-blue-600 text-white hover:bg-blue-700 px-3 py-2 rounded-lg text-sm font-medium shadow-md transition-colors flex items-center justify-center" disabled={isReadOnly}>
                <CheckIcon className="h-4 w-4 mr-1"/>
                Finalizar
             </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        
        {/* Mobile Tabs (Category Icons) - Top Scroll */}
        <div className="md:hidden overflow-x-auto flex border-b bg-white flex-shrink-0 no-scrollbar">
             {CHECKLIST_DEFINITIONS.map(cat => {
                 const Icon = categoryIcons[cat.id] || ConcreteMixerIcon;
                 const isActive = activeCategoryId === cat.id;
                 const catItemIds = cat.subCategories.flatMap(s => s.items.map(i => i.id));
                 const filledCount = reportData.results.filter(r => catItemIds.includes(r.itemId) && r.status !== null).length;
                 const totalCount = catItemIds.length;
                 
                 return (
                    <button
                        key={cat.id}
                        onClick={() => setActiveCategoryId(cat.id)}
                        className={`flex-shrink-0 py-3 px-4 flex flex-col items-center min-w-[80px] relative ${isActive ? 'text-blue-600' : 'text-gray-400'}`}
                    >
                        <div className={`p-2 rounded-full mb-1 ${isActive ? 'bg-blue-50' : ''}`}>
                            <Icon className="h-6 w-6" />
                        </div>
                        <span className="text-[10px] font-bold text-center leading-tight truncate w-full">{cat.title.split(' ')[0]}</span>
                        
                        {/* Progress dot */}
                        <div className="mt-1 h-1 w-8 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                                className={`h-full rounded-full ${filledCount === totalCount ? 'bg-green-500' : 'bg-blue-500'}`} 
                                style={{ width: `${(filledCount / totalCount) * 100}%` }}
                            ></div>
                        </div>
                        
                        {isActive && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>}
                    </button>
                 )
             })}
        </div>

        {/* Sidebar Navigation (Desktop) */}
        <div className="w-72 bg-gray-50 border-r overflow-y-auto hidden md:block custom-scrollbar">
            <nav className="p-4 space-y-2">
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
                            className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                                isActive 
                                ? 'bg-white text-blue-700 shadow-md border border-blue-100' 
                                : 'text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            <div className="flex items-center">
                                <div className={`p-2 rounded-lg mr-3 ${isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500'}`}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <span className="text-sm font-bold text-left">{cat.title}</span>
                            </div>
                            {isComplete ? (
                                <CheckIcon className="h-5 w-5 text-green-500" />
                            ) : (
                                <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full">{filledCount}/{totalCount}</span>
                            )}
                        </button>
                    )
                })}
            </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-gray-50 md:bg-white">
            {activeCategory && (
                <div className="max-w-3xl mx-auto p-4 md:p-8 pb-24 animate-fade-in">
                    {/* Desktop Header for Category */}
                    <div className="hidden md:flex items-center space-x-4 mb-8 border-b pb-4">
                         <div className="p-3 bg-blue-50 rounded-xl">
                            {categoryIcons[activeCategory.id] && React.createElement(categoryIcons[activeCategory.id], { className: "h-8 w-8 text-blue-600" })}
                         </div>
                         <h2 className="text-2xl font-bold text-gray-800">{activeCategory.title}</h2>
                    </div>

                    <div className="space-y-6">
                        {activeCategory.subCategories.map(subCat => (
                            <div key={subCat.title} className="space-y-4">
                                <div className="flex items-center space-x-2 text-blue-800 bg-blue-50 px-3 py-2 rounded-lg">
                                    <span className="font-bold text-sm uppercase tracking-wide">{subCat.title}</span>
                                </div>
                                
                                {subCat.items.map(item => {
                                    const result = reportData.results.find(r => r.itemId === item.id);
                                    if (!result) return null;

                                    return (
                                        <div key={item.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                                            {/* Question */}
                                            <div className="mb-5">
                                                {result.previousNc && (
                                                    <div className="inline-flex items-center px-2 py-0.5 mb-2 rounded text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-200">
                                                        <ExclamationTriangleIcon className="h-3 w-3 mr-1"/> REINCIDÊNCIA
                                                    </div>
                                                )}
                                                <p className="text-gray-800 font-medium leading-snug">{item.text}</p>
                                            </div>

                                            {/* Answer Buttons - ICON ONLY - ORIGINAL APP STYLE */}
                                            <div className="flex justify-center gap-6 mb-5">
                                                {/* Conforme */}
                                                <button
                                                    onClick={() => handleResultChange(item.id, { status: InspectionStatus.C })}
                                                    disabled={isReadOnly}
                                                    className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all transform active:scale-95 shadow-sm ${
                                                        result.status === InspectionStatus.C 
                                                        ? 'bg-green-500 text-white shadow-green-200 ring-2 ring-green-500 ring-offset-2' 
                                                        : 'bg-gray-50 text-gray-400 hover:bg-green-50 hover:text-green-500 border border-gray-200'
                                                    }`}
                                                >
                                                    <CheckIcon className="h-10 w-10" />
                                                </button>

                                                {/* Não Conforme */}
                                                <button
                                                    onClick={() => handleResultChange(item.id, { status: InspectionStatus.NC })}
                                                    disabled={isReadOnly}
                                                    className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all transform active:scale-95 shadow-sm ${
                                                        result.status === InspectionStatus.NC 
                                                        ? 'bg-red-500 text-white shadow-red-200 ring-2 ring-red-500 ring-offset-2' 
                                                        : 'bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 border border-gray-200'
                                                    }`}
                                                >
                                                    <XMarkIcon className="h-10 w-10" />
                                                </button>

                                                {/* N/A */}
                                                <button
                                                    onClick={() => handleResultChange(item.id, { status: InspectionStatus.NA })}
                                                    disabled={isReadOnly}
                                                    className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all transform active:scale-95 shadow-sm ${
                                                        result.status === InspectionStatus.NA 
                                                        ? 'bg-gray-600 text-white shadow-gray-300 ring-2 ring-gray-600 ring-offset-2' 
                                                        : 'bg-gray-50 text-gray-400 hover:bg-gray-200 hover:text-gray-600 border border-gray-200'
                                                    }`}
                                                >
                                                    <MinusIcon className="h-10 w-10" />
                                                </button>
                                            </div>

                                            {/* Extended Actions */}
                                            <div className="border-t pt-4">
                                                <div className="flex items-center gap-2 mb-3">
                                                    {/* Photo Prompt */}
                                                    <PhotoUploader 
                                                        photos={result.photos} 
                                                        onAddPhoto={(p) => handleResultChange(item.id, { photos: [...result.photos, p] })}
                                                        onRemovePhoto={(pid) => handleResultChange(item.id, { photos: result.photos.filter(p => p.id !== pid) })}
                                                        disabled={isReadOnly}
                                                    />
                                                </div>
                                                
                                                <textarea
                                                    placeholder="Adicionar observação..."
                                                    value={result.comment}
                                                    onChange={e => handleResultChange(item.id, { comment: e.target.value })}
                                                    disabled={isReadOnly}
                                                    className="w-full text-sm p-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                    rows={1}
                                                    style={{ minHeight: '2.5rem' }}
                                                />

                                                {/* Action Plan Section */}
                                                {result.status === InspectionStatus.NC && (
                                                    <div className="mt-4 bg-red-50 p-4 rounded-xl border border-red-100 animate-fade-in">
                                                        <h4 className="text-xs font-bold text-red-700 uppercase mb-3 flex items-center">
                                                            <ExclamationTriangleIcon className="h-4 w-4 mr-1"/> Plano de Ação
                                                        </h4>
                                                        <div className="space-y-3">
                                                            <input 
                                                                type="text" 
                                                                value={result.actionPlan?.actions || ''}
                                                                onChange={e => handleResultChange(item.id, { actionPlan: { ...result.actionPlan!, actions: e.target.value } })}
                                                                disabled={isReadOnly}
                                                                placeholder="O que será feito?"
                                                                className="w-full p-2 text-sm border border-red-200 rounded-lg focus:border-red-500 focus:ring-red-500"
                                                            />
                                                            <div className="flex gap-3">
                                                                <input 
                                                                    type="text" 
                                                                    value={result.actionPlan?.responsible || ''}
                                                                    onChange={e => handleResultChange(item.id, { actionPlan: { ...result.actionPlan!, responsible: e.target.value } })}
                                                                    disabled={isReadOnly}
                                                                    placeholder="Responsável"
                                                                    className="w-1/2 p-2 text-sm border border-red-200 rounded-lg focus:border-red-500 focus:ring-red-500"
                                                                />
                                                                <input 
                                                                    type="date" 
                                                                    value={result.actionPlan?.deadline || ''}
                                                                    onChange={e => handleResultChange(item.id, { actionPlan: { ...result.actionPlan!, deadline: e.target.value } })}
                                                                    disabled={isReadOnly}
                                                                    className="w-1/2 p-2 text-sm border border-red-200 rounded-lg focus:border-red-500 focus:ring-red-500"
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
                        ))}
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ReportForm;
