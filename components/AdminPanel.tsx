
import React, { useState, useEffect } from 'react';
import { Project, UserProfile, UserRole } from '../types';
import { fetchAllProfiles, updateUserProfile, createUserByAdmin } from '../services/auth';
import { upsertProject } from '../services/dbApi';
import { BuildingOfficeIcon, UserCircleIcon, PlusIcon, CheckIcon } from './icons';

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

    // New User State
    const [newUserFullName, setNewUserFullName] = useState('');
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [newUserRole, setNewUserRole] = useState<UserRole>('assistant');
    const [newUserProjects, setNewUserProjects] = useState<string[]>([]);
    const [isCreatingUser, setIsCreatingUser] = useState(false);

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

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUserEmail || !newUserPassword || !newUserFullName) return;

        setIsCreatingUser(true);
        try {
            await createUserByAdmin(newUserEmail, newUserPassword, newUserFullName, newUserRole, newUserProjects);
            alert(`Usuário ${newUserFullName} criado com sucesso!`);
            
            // Limpar form
            setNewUserFullName('');
            setNewUserEmail('');
            setNewUserPassword('');
            setNewUserRole('assistant');
            setNewUserProjects([]);
            
            // Recarregar lista
            loadUsers();
        } catch (error: any) {
            console.error(error);
            alert("Erro ao criar usuário: " + (error.message || "Verifique os dados."));
        } finally {
            setIsCreatingUser(false);
        }
    };

    const handleToggleProjectAccess = (user: UserProfile, projectId: string) => {
        const currentIds = user.assigned_project_ids || [];
        const newIds = currentIds.includes(projectId) 
            ? currentIds.filter(id => id !== projectId)
            : [...currentIds, projectId];
        
        handleUpdateUser(user.id, { assigned_project_ids: newIds });
    };

    const handleToggleNewUserProject = (projectId: string) => {
        setNewUserProjects(prev => 
            prev.includes(projectId) ? prev.filter(id => id !== projectId) : [...prev, projectId]
        );
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
                <div className="space-y-8">
                    {/* Formulário de Cadastro de Usuário */}
                    <div className="bg-white p-6 rounded-lg shadow-md border border-blue-100">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <PlusIcon className="h-5 w-5 mr-2 text-blue-600"/>
                            Cadastrar Novo Usuário
                        </h3>
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={newUserFullName} 
                                        onChange={e => setNewUserFullName(e.target.value)}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Ex: João Silva"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email Corporativo</label>
                                    <input 
                                        type="email" 
                                        required
                                        value={newUserEmail} 
                                        onChange={e => setNewUserEmail(e.target.value)}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="joao@brz.com.br"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Senha Provisória</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={newUserPassword} 
                                        onChange={e => setNewUserPassword(e.target.value)}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Mínimo 6 caracteres"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Perfil</label>
                                <div className="flex space-x-4">
                                    {[
                                        { id: 'assistant', label: 'Assistente (Meio Ambiente)' },
                                        { id: 'manager', label: 'Engenheiro Gerente' },
                                        { id: 'admin', label: 'Diretoria (Admin)' },
                                    ].map((role) => (
                                        <label key={role.id} className="flex items-center cursor-pointer">
                                            <input 
                                                type="radio" 
                                                name="newRole" 
                                                value={role.id}
                                                checked={newUserRole === role.id}
                                                onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">{role.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {newUserRole !== 'admin' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Vincular Obras (Opcional)</label>
                                    <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-md border border-gray-200">
                                        {projects.map(proj => (
                                            <button
                                                key={proj.id}
                                                type="button"
                                                onClick={() => handleToggleNewUserProject(proj.id)}
                                                className={`text-xs px-3 py-1.5 rounded-full border transition-colors flex items-center ${
                                                    newUserProjects.includes(proj.id)
                                                    ? 'bg-blue-600 text-white border-blue-600' 
                                                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'
                                                }`}
                                            >
                                                {newUserProjects.includes(proj.id) && <CheckIcon className="h-3 w-3 mr-1"/>}
                                                {proj.name}
                                            </button>
                                        ))}
                                        {projects.length === 0 && <span className="text-sm text-gray-400">Nenhuma obra cadastrada.</span>}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end">
                                <button 
                                    type="submit" 
                                    disabled={isCreatingUser}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
                                >
                                    {isCreatingUser ? 'Criando...' : 'Cadastrar Usuário'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Lista de Usuários */}
                    <div>
                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Usuários Cadastrados</h3>
                        {loading ? <p className="text-gray-500">Carregando usuários...</p> : (
                            <div className="bg-white shadow overflow-hidden rounded-lg border border-gray-200">
                                <ul className="divide-y divide-gray-200">
                                    {users.map(user => (
                                        <li key={user.id} className="p-4 hover:bg-gray-50 transition-colors">
                                            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                                                <div>
                                                    <div className="flex items-center">
                                                        <UserCircleIcon className="h-10 w-10 text-gray-400 mr-3" />
                                                        <div>
                                                            <p className="text-base font-bold text-gray-900">{user.full_name}</p>
                                                            <p className="text-sm text-gray-500">{user.email}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex flex-col gap-2 md:w-2/3">
                                                    <div className="flex items-center gap-2 justify-end">
                                                        <label className="text-xs font-semibold uppercase text-gray-500">Perfil:</label>
                                                        <select 
                                                            value={user.role} 
                                                            onChange={(e) => handleUpdateUser(user.id, { role: e.target.value as any })}
                                                            className="block w-48 pl-3 pr-8 py-1 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md shadow-sm"
                                                        >
                                                            <option value="assistant">Assistente (Meio Ambiente)</option>
                                                            <option value="manager">Engenheiro Gerente</option>
                                                            <option value="admin">Diretoria (Admin)</option>
                                                            <option value="viewer">Visitante (Leitura)</option>
                                                        </select>
                                                    </div>
                                                    
                                                    {user.role !== 'admin' && (
                                                        <div className="flex flex-col items-end">
                                                            <div className="flex flex-wrap gap-1 justify-end mt-1">
                                                                {projects.map(proj => {
                                                                    const hasAccess = user.assigned_project_ids?.includes(proj.id);
                                                                    return (
                                                                        <button
                                                                            key={proj.id}
                                                                            onClick={() => handleToggleProjectAccess(user, proj.id)}
                                                                            className={`text-[10px] px-2 py-1 rounded border transition-colors ${
                                                                                hasAccess 
                                                                                ? 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200' 
                                                                                : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-100'
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
                </div>
            )}

            {activeTab === 'projects' && (
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-md border border-blue-100">
                        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                            <PlusIcon className="h-5 w-5 mr-2 text-green-600"/>
                            Cadastrar Nova Obra
                        </h3>
                        <form onSubmit={handleCreateProject} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nome da Obra</label>
                                <input 
                                    type="text" 
                                    required
                                    value={newProjectName} 
                                    onChange={e => setNewProjectName(e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Localização (Cidade/UF)</label>
                                <input 
                                    type="text" 
                                    required
                                    value={newProjectLocation} 
                                    onChange={e => setNewProjectLocation(e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                />
                            </div>
                            <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700">
                                Cadastrar Obra
                            </button>
                        </form>
                    </div>

                    <div className="bg-white shadow overflow-hidden rounded-lg border border-gray-200">
                        <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">Obras Cadastradas</h3>
                        </div>
                        <ul className="divide-y divide-gray-200">
                            {projects.map(proj => (
                                <li key={proj.id} className="px-4 py-4 flex items-center hover:bg-gray-50">
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
