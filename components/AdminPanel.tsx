
import React, { useState, useEffect } from 'react';
import { Project, UserProfile } from '../types';
import { fetchAllProfiles, updateUserProfile } from '../services/auth';
import { upsertProject } from '../services/dbApi';
import { BuildingOfficeIcon, UserCircleIcon, PlusIcon } from './icons';

interface AdminPanelProps {
    projects: Project[];
    onRefreshData: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ projects, onRefreshData }) => {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [activeTab, setActiveTab] = useState<'users' | 'projects'>('users');
    const [loading, setLoading] = useState(false);

    // New Project State
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectLocation, setNewProjectLocation] = useState('');

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await fetchAllProfiles();
            setUsers(data);
        } catch (error) {
            console.error(error);
            alert("Erro ao carregar usuários.");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateUser = async (userId: string, updates: Partial<UserProfile>) => {
        try {
            await updateUserProfile(userId, updates);
            setUsers(users.map(u => u.id === userId ? { ...u, ...updates } : u));
        } catch (error) {
            alert("Erro ao atualizar usuário.");
        }
    };

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProjectName || !newProjectLocation) return;
        
        try {
            await upsertProject({ id: `proj-${Date.now()}`, name: newProjectName, location: newProjectLocation });
            setNewProjectName('');
            setNewProjectLocation('');
            onRefreshData();
            alert("Obra criada com sucesso!");
        } catch (error) {
            alert("Erro ao criar obra.");
        }
    }

    const handleToggleProjectAccess = (user: UserProfile, projectId: string) => {
        const currentIds = user.assigned_project_ids || [];
        const newIds = currentIds.includes(projectId) 
            ? currentIds.filter(id => id !== projectId)
            : [...currentIds, projectId];
        
        handleUpdateUser(user.id, { assigned_project_ids: newIds });
    };

    return (
        <div className="animate-fade-in pb-20">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Administração do Sistema</h1>
            
            <div className="flex space-x-4 mb-6 border-b">
                <button 
                    className={`pb-2 px-4 font-medium ${activeTab === 'users' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('users')}
                >
                    Gerenciar Usuários
                </button>
                <button 
                    className={`pb-2 px-4 font-medium ${activeTab === 'projects' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('projects')}
                >
                    Gerenciar Obras
                </button>
            </div>

            {activeTab === 'users' && (
                <div className="space-y-6">
                    {loading ? <p>Carregando usuários...</p> : (
                        <div className="bg-white shadow overflow-hidden rounded-lg">
                            <ul className="divide-y divide-gray-200">
                                {users.map(user => (
                                    <li key={user.id} className="p-4 hover:bg-gray-50">
                                        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                                            <div>
                                                <div className="flex items-center">
                                                    <UserCircleIcon className="h-8 w-8 text-gray-400 mr-2" />
                                                    <p className="text-lg font-medium text-gray-900">{user.full_name}</p>
                                                </div>
                                                <p className="text-sm text-gray-500 ml-10">{user.email}</p>
                                            </div>
                                            
                                            <div className="flex flex-col gap-2 md:w-1/2">
                                                <div className="flex items-center gap-2">
                                                    <label className="text-sm font-medium text-gray-700 w-20">Cargo:</label>
                                                    <select 
                                                        value={user.role} 
                                                        onChange={(e) => handleUpdateUser(user.id, { role: e.target.value as any })}
                                                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                                    >
                                                        <option value="assistant">Assistente (Meio Ambiente)</option>
                                                        <option value="manager">Engenheiro Gerente</option>
                                                        <option value="admin">Diretoria (Admin)</option>
                                                        <option value="viewer">Visitante (Leitura)</option>
                                                    </select>
                                                </div>
                                                
                                                {user.role !== 'admin' && (
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-700 mb-1">Acesso às Obras:</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {projects.map(proj => {
                                                                const hasAccess = user.assigned_project_ids?.includes(proj.id);
                                                                return (
                                                                    <button
                                                                        key={proj.id}
                                                                        onClick={() => handleToggleProjectAccess(user, proj.id)}
                                                                        className={`text-xs px-2 py-1 rounded-full border ${
                                                                            hasAccess 
                                                                            ? 'bg-blue-100 text-blue-800 border-blue-300' 
                                                                            : 'bg-gray-50 text-gray-500 border-gray-300'
                                                                        }`}
                                                                    >
                                                                        {proj.name}
                                                                    </button>
                                                                )
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'projects' && (
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Cadastrar Nova Obra</h3>
                        <form onSubmit={handleCreateProject} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nome da Obra</label>
                                <input 
                                    type="text" 
                                    required
                                    value={newProjectName} 
                                    onChange={e => setNewProjectName(e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Localização (Cidade/UF)</label>
                                <input 
                                    type="text" 
                                    required
                                    value={newProjectLocation} 
                                    onChange={e => setNewProjectLocation(e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                            </div>
                            <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700">
                                <PlusIcon className="h-5 w-5 mr-2" />
                                Cadastrar Obra
                            </button>
                        </form>
                    </div>

                    <div className="bg-white shadow overflow-hidden rounded-lg">
                        <div className="px-4 py-5 sm:px-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">Obras Cadastradas</h3>
                        </div>
                        <ul className="divide-y divide-gray-200">
                            {projects.map(proj => (
                                <li key={proj.id} className="px-4 py-4 flex items-center">
                                    <BuildingOfficeIcon className="h-6 w-6 text-gray-400 mr-3"/>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{proj.name}</p>
                                        <p className="text-sm text-gray-500">{proj.location}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
