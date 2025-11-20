
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
      results: prev.results.map(res => (res.itemId === itemId ? { ...res