
import { supabase } from './supabaseClient';
import { Project, Report, InspectionItemResult, InspectionStatus } from '../types';
import { CHECKLIST_DEFINITIONS, MOCK_PROJECTS } from '../constants';

const STORAGE_KEYS = {
    PROJECTS: 'env_inspection_projects',
    REPORTS: 'env_inspection_reports'
};

// --- Helpers LocalStorage (Modo Offline) ---
const getLocalProjects = (): Project[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    return stored ? JSON.parse(stored) : [];
};

const saveLocalProjects = (projects: Project[]) => {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
};

const getLocalReports = (): Report[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.REPORTS);
    return stored ? JSON.parse(stored) : [];
};

const saveLocalReport = (report: Report) => {
    const reports = getLocalReports();
    const index = reports.findIndex(r => r.id === report.id);
    if (index >= 0) {
        reports[index] = report;
    } else {
        reports.push(report);
    }
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
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

export const fetchProjects = async (): Promise<Project[]> => {
  if (!supabase) {
    let projects = getLocalProjects();
    if (projects.length === 0) {
        projects = MOCK_PROJECTS;
        saveLocalProjects(projects);
    }
    return projects;
  }
  
  const { data, error } = await supabase.from('projects').select('*');
  if (error || !data || data.length === 0) {
      // Fallback to mock/local if DB is empty or error
      console.warn("Supabase vazio ou indisponível, usando dados locais.");
       let projects = getLocalProjects();
        if (projects.length === 0) {
            projects = MOCK_PROJECTS;
            saveLocalProjects(projects);
        }
      return projects;
  }
  return data as Project[];
};

export const fetchReports = async (): Promise<Report[]> => {
  if (!supabase) {
    return getLocalReports();
  }

  const { data, error } = await supabase.from('reports').select('*');
  if (error) {
    console.error('Error fetching reports:', error);
    return getLocalReports(); // Fallback
  }

  return data.map((row: any) => ({
    ...row.content,
    projectId: row.project_id,
    id: row.id
  }));
};

const uploadPhoto = async (photoId: string, base64Data: string): Promise<string | null> => {
   if (!supabase) return base64Data; // Return original if no backend
   
   try {
    const blob = await base64ToBlob(base64Data);
    const fileName = `${photoId}.jpg`;
    const { error } = await supabase.storage
      .from('inspection-photos')
      .upload(fileName, blob, { upsert: true });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('inspection-photos')
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading photo:', error);
    return base64Data; // Fallback to base64 if upload fails
  }
};

export const upsertReport = async (reportData: Omit<Report, 'id' | 'score' | 'evaluation' | 'categoryScores'> & { id?: string }): Promise<Report | null> => {
  // Process photos
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

  // Calculate scores
  const { score, evaluation, categoryScores } = calculateScores(processedResults);
  
  const id = reportData.id || `report-${Date.now()}`;
  const fullReportData: Report = { ...reportData, results: processedResults, score, evaluation, categoryScores, id };

  if (!supabase) {
      saveLocalReport(fullReportData);
      return fullReportData;
  }

  const { error } = await supabase
    .from('reports')
    .upsert({
      id: id,
      project_id: fullReportData.projectId,
      content: fullReportData,
      created_at: new Date().toISOString()
    });

  if (error) {
    console.error('Supabase error, saving locally:', error);
    saveLocalReport(fullReportData); // Fallback
  }

  return fullReportData;
};

export const getNewReportTemplate = (projectId: string): Omit<Report, 'id' | 'score' | 'evaluation' | 'categoryScores'> => {
  const allItems = CHECKLIST_DEFINITIONS.flatMap(cat => cat.subCategories.flatMap(sub => sub.items));
  
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
    }
  }));

  return {
    projectId,
    date: new Date().toISOString().split('T')[0],
    inspector: 'Gediel da Silva', 
    status: 'Draft',
    results,
    signatures: {
      inspector: '',
      manager: '', 
    }
  };
};
