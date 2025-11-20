
import { supabase } from './supabaseClient';
import { Project, Report, InspectionItemResult, InspectionStatus } from '../types';
import { CHECKLIST_DEFINITIONS, MOCK_PROJECTS } from '../constants';

const STORAGE_KEYS = {
    PROJECTS: 'env_inspection_projects',
    REPORTS: 'env_inspection_reports'
};

// --- Helpers LocalStorage (Modo Offline) ---
const getLocalProjects = (): Project[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.PROJECTS);
        return stored ? JSON.parse(stored) : [];
    } catch (e) { return []; }
};

const saveLocalProjects = (projects: Project[]) => {
    try { localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects)); } catch(e){}
};

const getLocalReports = (): Report[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.REPORTS);
        return stored ? JSON.parse(stored) : [];
    } catch (e) { return []; }
};

const saveLocalReport = (report: Report) => {
    try {
        const reports = getLocalReports();
        const index = reports.findIndex(r => r.id === report.id);
        if (index >= 0) {
            reports[index] = report;
        } else {
            reports.push(report);
        }
        localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
    } catch(e){}
};

// --- Helper Utils ---
const base64ToBlob = async (base64: string) => {
  const res = await fetch(base64);
  return await res.blob();
};

const calculateScores = (results: InspectionItemResult[]) => {
    const categoryScores: { [categoryId: string]: number } = {};
    let totalScore = 0;
    let scoredCategories = 0;

    CHECKLIST_DEFINITIONS.forEach(category => {
        const categoryItemIds = category.subCategories.flatMap(sc => sc.items.map(i => i.id));
        const categoryResults = results.filter(r => categoryItemIds.includes(r.itemId));
        const applicableResults = categoryResults.filter(r => r.status !== InspectionStatus.NA);
        const compliantResults = applicableResults.filter(r => r.status === InspectionStatus.C);

        if (applicableResults.length === 0) {
            categoryScores[category.id] = 100;
        } else {
            const score = (compliantResults.length / applicableResults.length) * 100;
            categoryScores[category.id] = Math.round(score);
        }
        totalScore += categoryScores[category.id];
        scoredCategories++;
    });
    
    const overallScore = scoredCategories > 0 ? Math.round(totalScore / scoredCategories) : 100;

    let evaluation = 'RUIM';
    if (overallScore >= 90) evaluation = 'ÓTIMO';
    else if (overallScore >= 70) evaluation = 'BOM';
    else if (overallScore >= 50) evaluation = 'REGULAR';
    
    return { score: overallScore, evaluation, categoryScores };
}

// --- API Methods ---

export const upsertProject = async (project: Project): Promise<void> => {
    if (supabase) {
        const { error } = await supabase.from('projects').upsert(project);
        if (error) throw error;
        return;
    }
    // Offline
    const projects = getLocalProjects();
    const existing = projects.findIndex(p => p.id === project.id);
    if (existing >= 0) projects[existing] = project;
    else projects.push(project);
    saveLocalProjects(projects);
}

export const fetchProjects = async (): Promise<Project[]> => {
  // Prioriza Supabase se disponível
  if (supabase) {
      const { data, error } = await supabase.from('projects').select('*');
      if (!error && data && data.length > 0) {
          return data as Project[];
      }
      // Se conectado mas tabela vazia, tenta inserir os Mocks para começar (apenas dev)
      if (!error && data && data.length === 0) {
          // Não insere mocks automaticamente em prod para não sujar, retorna vazio
          return [];
      }
  }
  
  // Fallback Offline
  let projects = getLocalProjects();
  if (projects.length === 0) {
      projects = MOCK_PROJECTS; // Mantém mocks apenas no offline total inicial
      saveLocalProjects(projects);
  }
  return projects;
};

export const fetchReports = async (): Promise<Report[]> => {
  if (supabase) {
      const { data, error } = await supabase.from('reports').select('*');
      if (!error && data) {
          return data.map((row: any) => ({
            ...row.content,
            projectId: row.project_id,
            id: row.id
          }));
      }
  }
  return getLocalReports();
};

const uploadPhoto = async (photoId: string, base64Data: string): Promise<string | null> => {
   if (!supabase) return base64Data;
   
   try {
    const blob = await base64ToBlob(base64Data);
    // Nome do arquivo único
    const fileName = `${photoId}-${Date.now()}.jpg`;
    
    const { error } = await supabase.storage
      .from('inspection-photos')
      .upload(fileName, blob, { upsert: true });

    if (error) throw error;

    const { data } = supabase.storage
      .from('inspection-photos')
      .getPublicUrl(fileName);

    return data.publicUrl;
  } catch (error) {
    console.error('Erro uploading photo:', error);
    return base64Data; // Se falhar upload, salva o base64 mesmo
  }
};

export const upsertReport = async (reportData: Omit<Report, 'id' | 'score' | 'evaluation' | 'categoryScores'> & { id?: string }): Promise<Report | null> => {
  // 1. Processar fotos (Upload)
  const processedResults = await Promise.all(reportData.results.map(async (item) => {
    if (item.photos && item.photos.length > 0) {
      const newPhotos = await Promise.all(item.photos.map(async (photo) => {
        if (photo.dataUrl.startsWith('data:image')) {
          const url = await uploadPhoto(photo.id, photo.dataUrl);
          return { ...photo, dataUrl: url || photo.dataUrl };
        }
        return photo;
      }));
      return { ...item, photos: newPhotos };
    }
    return item;
  }));

  // 2. Calcular scores
  const { score, evaluation, categoryScores } = calculateScores(processedResults);
  
  const id = reportData.id || `report-${Date.now()}`;
  const fullReportData: Report = { ...reportData, results: processedResults, score, evaluation, categoryScores, id };

  // 3. Salvar no Banco
  if (supabase) {
      const { error } = await supabase
        .from('reports')
        .upsert({
          id: id,
          project_id: fullReportData.projectId,
          content: fullReportData,
          created_at: new Date().toISOString()
        });
        
      if (!error) return fullReportData;
      console.error('Erro ao salvar no Supabase:', error);
  }

  // Fallback Local
  saveLocalReport(fullReportData);
  return fullReportData;
};

export const getNewReportTemplate = (
    projectId: string, 
    inspectorName: string, 
    inspectorId: string,
    previousReport?: Report | null
): Omit<Report, 'id' | 'score' | 'evaluation' | 'categoryScores'> => {
  const allItems = CHECKLIST_DEFINITIONS.flatMap(cat => cat.subCategories.flatMap(sub => sub.items));
  
  // Identifica itens que foram NC no último relatório
  const previousNcMap = new Map<string, boolean>();
  if (previousReport) {
      previousReport.results.forEach(res => {
          if (res.status === InspectionStatus.NC) {
              previousNcMap.set(res.itemId, true);
          }
      });
  }

  const results: InspectionItemResult[] = allItems.map(item => ({
    itemId: item.id,
    status: null,
    photos: [],
    comment: '',
    actionPlan: {
      actions: '',
      responsible: '',
      deadline: '',
      resources: { fin: false, mo: false, adm: false }
    },
    previousNc: previousNcMap.has(item.id) // Marca se é pendência antiga
  }));

  return {
    projectId,
    date: new Date().toISOString().split('T')[0],
    inspector: inspectorName, 
    inspectorId: inspectorId,
    status: 'Draft',
    results,
    signatures: {
      inspector: '',
      manager: '', 
    }
  };
};
