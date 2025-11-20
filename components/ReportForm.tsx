
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
      return existingReport?.status === 'Completed';
  }, [existingReport, userProfile.role]);
  
  const handleResultChange = (itemId: string, newResult: Partial<InspectionItemResult>) => {
    if (isReadOnly) return;
    setReportData(prev => ({
      ...prev,
      results: prev.results.map(res => (res.itemId === itemId ? { ...res, ...newResult } : res)),
    }));
  };

  const handleAddPhoto = (itemId: string, photo: Photo) => {
    const result = reportData.results.find(r => r.itemId === itemId);
    if (result) {
      handleResultChange(itemId, { photos: [...result.photos, photo] });
    }
  };

  const handleRemovePhoto = (itemId: string, photoId: string) => {
    const result = reportData.results.find(r => r.itemId === itemId);
    if (result) {
      handleResultChange(itemId, { photos: result.photos.filter(p => p.id !== photoId) });
    }
  };

  const handleActionPlanChange = (itemId: string, newPlan: Partial<ActionPlan>) => {
      const result = reportData.results.find(r => r.itemId === itemId);
      if(result) {
          handleResultChange(itemId, { actionPlan: { ...result.actionPlan!, ...newPlan } });
      }
  }

  const validateForSignature = () => {
      const unanswered = reportData.results.filter(r => r.status === null);
      if (unanswered.length > 0) {
          const count = unanswered.length;
          alert(`Atenção: Existem ${count} itens sem resposta no checklist. Todos os itens devem ser inspecionados (Conforme, Não Conforme ou Não Aplicável) antes de assinar.`);
          return false;
      }
      return true;
  }
  
  const initiateSignature = (role: 'inspector' | 'manager') => {
      if(!validateForSignature()) return;
      setSigningRole(role);
      setShowGovLogin(true);
  }
  
  const completeSignature = () => {
      if(!signingRole) return;
      const dateStr = new Date().toLocaleString();
      setReportData(prev => ({
          ...prev,
          signatures: {
              ...prev.signatures,
              [signingRole]: userProfile.full_name,
              [`${signingRole}Date`]: dateStr
          }
      }));
      setShowGovLogin(false);
      setSigningRole(null);
  }

  const handleSubmit = (status: 'Draft' | 'Completed') => {
    if (isReadOnly) return;
    
    if (status === 'Completed') {
        // Validação de completude
        const unanswered = reportData.results.filter(r => r.status === null);
        if (unanswered.length > 0) {
            alert(`Não é possível concluir o relatório com itens pendentes de avaliação.`);
            return;
        }
        
        // Validação de NC
        const pendingNc = reportData.results.filter(r => r.status === InspectionStatus.NC && (!r.actionPlan?.actions || r.actionPlan.actions.trim() === ''));
        if (pendingNc.length > 0) {
            alert("Existem itens Não Conformes sem Plano de Ação (Tratativa) definido. Preencha o campo 'Ações / Provisões' para todos os itens em vermelho.");
            return;
        }

        if (!reportData.signatures.inspector) {
            alert("A assinatura do Responsável Ambiental é obrigatória para concluir.");
            return;
        }
        if (!reportData.signatures.manager) {
             const confirm = window.confirm("A assinatura do Engenheiro Gerente ainda não foi feita. Deseja concluir mesmo assim?");
             if(!confirm) return;
        }
    }
    
    const finalData = { ...reportData, date: new Date().toISOString().split('T')[0] };
    onSave(finalData, status);
  };
  
  const StatusButton: React.FC<{result: InspectionItemResult; itemId: string; status: InspectionStatus; icon: React.FC<React.SVGProps<SVGSVGElement>>; color: string;}> = ({ result, itemId, status, icon: Icon, color }) => {
    const isSelected = result.status === status;
    return (
      <button
        type="button"
        onClick={() => handleResultChange(itemId, { status })}
        disabled={isReadOnly}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 border-2 ${
          isSelected
            ? `bg-${color}-500 text-white border-${color}-600 shadow-md`
            : `bg-white text-${color}-500 border-gray-300 hover:bg-${color}-50`
        } disabled:bg-gray-200 disabled:text-gray-400 disabled:border-gray-300 disabled:cursor-not-allowed`}
        aria-label={status}
        aria-pressed={isSelected}
      >
        <Icon className="h-5 w-5" />
      </button>
    );
  };
  
  const renderItem = (item: ChecklistItem, index: number) => {
    const result = reportData.results.find(r => r.itemId === item.id);
    if (!result) return null;
    const isNC = result.status === InspectionStatus.NC;

    return (
      <div key={item.id} id={`item-${item.id}`} className={`py-4 border-b border-gray-200 last:border-b-0 scroll-mt-20 ${result.previousNc ? 'bg-orange-50 -mx-4 px-4' : ''}`}>
        <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
                {result.previousNc && (
                     <div className="flex items-center text-orange-600 text-xs font-bold uppercase mb-1">
                         <ExclamationTriangleIcon className="h-3 w-3 mr-1"/>
                         Pendência Anterior
                     </div>
                )}
                <p className="font-medium text-gray-800 pt-1.5">{(index + 1).toString().padStart(2, '0')}. {item.text}</p>
            </div>
            <div className="flex space-x-2">
                <StatusButton result={result} itemId={item.id} status={InspectionStatus.C} icon={CheckIcon} color="green"/>
                <StatusButton result={result} itemId={item.id} status={InspectionStatus.NC} icon={XMarkIcon} color="red"/>
                <StatusButton result={result} itemId={item.id} status={InspectionStatus.NA} icon={MinusIcon} color="gray"/>
            </div>
        </div>
        
        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isNC ? 'max-h-[1000px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
            <div className="p-4 bg-red-50/50 border border-red-200 rounded-lg space-y-4">
                <div>
                    <label className="text-sm font-semibold text-gray-700">Observações</label>
                    <textarea value={result.comment} onChange={e => handleResultChange(item.id, { comment: e.target.value })} placeholder="Descreva a não conformidade..."
                    disabled={isReadOnly}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100" rows={2}/>
                </div>
                 <div>
                    <label className="text-sm font-semibold text-gray-700">Evidência Fotográfica</label>
                    <PhotoUploader photos={result.photos} onAddPhoto={(photo) => handleAddPhoto(item.id, photo)} onRemovePhoto={(photoId) => handleRemovePhoto(item.id, photoId)} disabled={isReadOnly} />
                </div>
                 <div>
                    <h4 className="font-semibold text-red-800 text-sm">Plano de Ação Corretiva (Tratativa Obrigatória)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 mt-2">
                        <input type="text" placeholder="Ações / Provisões (Obrigatório)" value={result.actionPlan?.actions} onChange={(e) => handleActionPlanChange(item.id, {actions: e.target.value})} disabled={isReadOnly} className="p-2 border rounded-md text-sm disabled:bg-gray-100 border-red-200 focus:border-red-500"/>
                        <input type="text" placeholder="Responsável" value={result.actionPlan?.responsible} onChange={(e) => handleActionPlanChange(item.id, {responsible: e.target.value})} disabled={isReadOnly} className="p-2 border rounded-md text-sm disabled:bg-gray-100"/>
                        <input type="date" placeholder="Prazo Limite" title="Prazo Limite" value={result.actionPlan?.deadline} onChange={(e) => handleActionPlanChange(item.id, {deadline: e.target.value})} disabled={isReadOnly} className="p-2 border rounded-md text-sm disabled:bg-gray-100"/>
                    </div>
                </div>
            </div>
        </div>
      </div>
    );
  };
  
  const categoryIcons: { [key: string]: React.FC<React.SVGProps<SVGSVGElement>> } = {
    massa: CubeTransparentIcon,
    efluentes: FunnelIcon,
    campo: WrenchScrewdriverIcon,
    quimicos: BeakerIcon,
    combustivel: FireIcon,
    signatures: DocumentCheckIcon
  };
  
  const categoryColors: { [key: string]: string } = {
    massa: 'text-blue-600',
    efluentes: 'text-teal-600',
    campo: 'text-orange-600',
    quimicos: 'text-purple-600',
    combustivel: 'text-red-600',
    signatures: 'text-green-700',
  }

  const activeCategory = CHECKLIST_DEFINITIONS.find(c => c.id === activeCategoryId);
  
  // Regras de Assinatura
  const canSignInspector = !isReadOnly && (userProfile.role === 'assistant' || userProfile.role === 'admin');
  const canSignManager = !isReadOnly && (userProfile.role === 'manager' || userProfile.role === 'admin');

  return (
    <div className="bg-white pb-32">
        <GovBrAuthModal isOpen={showGovLogin} onClose={() => setShowGovLogin(false)} onConfirm={completeSignature} />

        <div className="p-4 sm:p-6 min-h-[calc(100vh-200px)]">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">{existingReport ? 'Editar Relatório' : 'Novo Relatório de Inspeção'}</h2>
            {isReadOnly && (
              <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
                <p className="font-bold">Modo de Leitura</p>
                <p>Você está visualizando este relatório como {userProfile.role === 'director' ? 'Diretoria' : 'Visitante'} ou o relatório já foi concluído.</p>
              </div>
            )}
            
            {activeCategory && (
                <div className="animate-fade-in">
                    <h2 className="text-xl font-bold text-gray-700 bg-gray-100 p-3 rounded-lg">{activeCategory.title}</h2>
                    {activeCategory.subCategories.map((subCat, index) => (
                        <div key={subCat.title} className={index > 0 ? 'mt-8' : 'mt-4'}>
                            <h3 className="text-lg font-bold text-gray-800 mb-3 pb-3 border-b-2 border-gray-200">
                                {subCat.title}
                            </h3>
                            {subCat.items.map((item, itemIndex) => renderItem(item, itemIndex))}
                        </div>
                    ))}
                </div>
            )}
            
            {activeCategoryId === 'signatures' && (
                <div id="signatures" className="animate-fade-in">
                    <h3 className="text-xl font-semibold text-gray-700 mb-4 bg-gray-100 p-3 rounded-lg">Assinaturas Digitais</h3>
                    <p className="text-sm text-gray-500 my-4">A assinatura eletrônica garante a autenticidade deste documento. Utilize sua conta gov.br para assinar.</p>
                    
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded mb-6 text-sm text-blue-800">
                         <strong>Nota do Sistema:</strong> A assinatura só será habilitada após o preenchimento de 100% dos itens do checklist (Conforme, Não Conforme ou Não Aplicável).
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Assinatura Inspetor */}
                        <div className={`p-5 rounded-lg border-2 transition-all ${reportData.signatures.inspector ? 'border-[#1351B4] bg-blue-50 shadow-sm' : 'border-dashed border-gray-300'}`}>
                            <div className="flex justify-between items-start mb-2">
                                <label className="block text-sm font-bold text-gray-700">Responsável Ambiental</label>
                                {reportData.signatures.inspector && <ShieldCheckIcon className="h-6 w-6 text-[#1351B4]" title="Verificado via gov.br" />}
                            </div>
                            
                            {reportData.signatures.inspector ? (
                                <div>
                                    <p className="text-lg font-bold text-gray-900">{reportData.signatures.inspector}</p>
                                    <p className="text-xs text-gray-600 flex items-center mt-1">
                                        <CheckIcon className="h-3 w-3 mr-1 text-green-600"/>
                                        Assinado em {reportData.signatures.inspectorDate}
                                    </p>
                                    <div className="mt-3 inline-flex items-center px-2 py-1 rounded bg-[#1351B4] text-white text-[10px] font-bold uppercase tracking-wider">
                                        Identidade gov.br verificada
                                    </div>
                                </div>
                            ) : (
                                <button 
                                    onClick={() => initiateSignature('inspector')}
                                    disabled={!canSignInspector}
                                    className="w-full py-3 bg-[#1351B4] text-white rounded-lg shadow hover:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center font-semibold transition-colors"
                                >
                                    <span className="mr-2 font-serif italic font-bold">gov.br</span>
                                    {canSignInspector ? 'Assinar como Responsável' : 'Aguardando Assinatura'}
                                </button>
                            )}
                        </div>

                        {/* Assinatura Gerente */}
                        <div className={`p-5 rounded-lg border-2 transition-all ${reportData.signatures.manager ? 'border-[#1351B4] bg-blue-50 shadow-sm' : 'border-dashed border-gray-300'}`}>
                             <div className="flex justify-between items-start mb-2">
                                <label className="block text-sm font-bold text-gray-700">Engenheiro Gerente</label>
                                {reportData.signatures.manager && <ShieldCheckIcon className="h-6 w-6 text-[#1351B4]" title="Verificado via gov.br" />}
                            </div>

                             {reportData.signatures.manager ? (
                                <div>
                                    <p className="text-lg font-bold text-gray-900">{reportData.signatures.manager}</p>
                                    <p className="text-xs text-gray-600 flex items-center mt-1">
                                        <CheckIcon className="h-3 w-3 mr-1 text-green-600"/>
                                        Assinado em {reportData.signatures.managerDate}
                                    </p>
                                    <div className="mt-3 inline-flex items-center px-2 py-1 rounded bg-[#1351B4] text-white text-[10px] font-bold uppercase tracking-wider">
                                        Identidade gov.br verificada
                                    </div>
                                </div>
                            ) : (
                                <button 
                                    onClick={() => initiateSignature('manager')}
                                    disabled={!canSignManager}
                                    className="w-full py-3 bg-[#1351B4] text-white rounded-lg shadow hover:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center font-semibold transition-colors"
                                >
                                    <span className="mr-2 font-serif italic font-bold">gov.br</span>
                                    {canSignManager ? 'Assinar como Gerente' : 'Aguardando Engenharia'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>

      <div className="fixed bottom-16 left-0 right-0 bg-white shadow-[0_-2px_5px_rgba(0,0,0,0.1)] flex justify-around p-2 z-50 border-t">
        {CHECKLIST_DEFINITIONS.map(cat => {
            const isActive = activeCategoryId === cat.id;
            return (
                <button key={cat.id} onClick={() => setActiveCategoryId(cat.id)} className={`flex flex-col items-center w-16 transition-colors ${isActive ? categoryColors[cat.id] : 'text-gray-500 hover:text-blue-600'}`}>
                    {React.createElement(categoryIcons[cat.id] || CubeTransparentIcon, {className: "h-6 w-6 mb-1"})}
                    <span className="text-xs text-center leading-tight font-medium">{cat.title.split(' ')[0]}</span>
                </button>
            )
        })}
        <button onClick={() => setActiveCategoryId('signatures')} className={`flex flex-col items-center w-16 transition-colors ${activeCategoryId === 'signatures' ? categoryColors['signatures'] : 'text-gray-500 hover:text-blue-600'}`}>
          <FingerPrintIcon className="h-6 w-6 mb-1"/>
          <span className="text-xs font-medium">Assinar</span>
        </button>
      </div>
      
      {!isReadOnly && (
          <div className="fixed bottom-0 left-0 right-0 bg-gray-100 p-3 flex flex-col sm:flex-row justify-end items-center gap-3 border-t-2 z-[51] h-auto sm:h-16">
            <button onClick={onCancel} className="w-full sm:w-auto px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 font-semibold">Cancelar</button>
            <button onClick={() => handleSubmit('Draft')} className="w-full sm:w-auto flex justify-center items-center px-4 py-2 text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 font-semibold disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed">
                <PaperAirplaneIcon className="h-5 w-5 mr-2"/>
                Salvar Rascunho
            </button>
            <button onClick={() => handleSubmit('Completed')} className="w-full sm:w-auto flex justify-center items-center px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed">
                <CheckIcon className="h-5 w-5 mr-2"/>
                Concluir e Enviar
            </button>
          </div>
      )}
    </div>
  );
};

export default ReportForm;
