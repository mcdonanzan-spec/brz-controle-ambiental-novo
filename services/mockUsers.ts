
import { UserProfile } from '../types';

export const MOCK_USERS: UserProfile[] = [
  {
    id: 'user-1',
    email: 'diretoria@example.com',
    full_name: 'Diretoria',
    role: 'admin',
    assigned_project_ids: ['proj-1', 'proj-2', 'proj-3'], // Acesso a todos os projetos
  },
  {
    id: 'user-2',
    email: 'eng.novara@example.com',
    full_name: 'Engenheiro - Novara',
    role: 'manager',
    assigned_project_ids: ['proj-1'], // Acesso apenas ao projeto 1
  },
  {
    id: 'user-3',
    email: 'eng.vistavale@example.com',
    full_name: 'Engenheiro - Vista do Vale',
    role: 'manager',
    assigned_project_ids: ['proj-2'], // Acesso apenas ao projeto 2
  },
];
