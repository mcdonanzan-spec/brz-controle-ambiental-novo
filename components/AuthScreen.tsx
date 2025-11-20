
import React, { useState } from 'react';
import { signIn, signUp } from '../services/auth';
import { LogoIcon, MascotIcon } from './icons';

interface AuthScreenProps {
    onLoginSuccess: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            if (isLogin) {
                await signIn(email, password);
                onLoginSuccess();
            } else {
                await signUp(email, password, fullName);
                setSuccessMsg("Conta criada! Verifique seu email se necessário ou faça login.");
                setIsLogin(true);
            }
        } catch (error: any) {
            console.error(error);
            setErrorMsg(error.message || "Ocorreu um erro. Verifique suas credenciais.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
            <div className="mb-8 flex flex-col items-center">
                <div className="flex items-center space-x-2 mb-2">
                    <MascotIcon className="h-16 w-auto" />
                    <LogoIcon className="h-12 w-auto" />
                </div>
                <h1 className="text-3xl font-bold text-gray-800">Controle Ambiental</h1>
                <p className="text-gray-500">Gestão Inteligente de Obras BRZ</p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                    {isLogin ? 'Acesse sua Conta' : 'Criar Nova Conta'}
                </h2>

                {errorMsg && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{errorMsg}</div>}
                {successMsg && <div className="bg-green-100 text-green-700 p-3 rounded mb-4 text-sm">{successMsg}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
                            <input 
                                type="text" 
                                required 
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    )}
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input 
                            type="email" 
                            required 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Senha</label>
                        <input 
                            type="password" 
                            required 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400"
                    >
                        {loading ? 'Processando...' : (isLogin ? 'Entrar' : 'Cadastrar')}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button 
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-sm text-blue-600 hover:text-blue-500"
                    >
                        {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça Login'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuthScreen;
