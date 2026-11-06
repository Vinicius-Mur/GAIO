import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getErrorMessage } from '../utils/error';

export const CadastroPage = () => {
  const { registrar } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ nome?: string; email?: string; senha?: string }>({});

  const validate = (): boolean => {
    const nextErrors: { nome?: string; email?: string; senha?: string } = {};
    if (!nome.trim()) nextErrors.nome = 'Informe seu nome.';
    if (!email.trim()) nextErrors.email = 'Informe seu e-mail.';
    if (senha.length < 6) nextErrors.senha = 'A senha deve ter ao menos 6 caracteres.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await registrar({ nome, email, senha });
      showToast({ type: 'success', title: 'Cadastro realizado', description: 'Sua conta já está pronta para uso.' });
      navigate('/dashboard', { replace: true });
    } catch (error) {
      showToast({ type: 'error', title: 'Não foi possível cadastrar', description: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='flex min-h-screen items-center justify-center bg-surface-50 px-4'>
      <div className='w-full max-w-md rounded-3xl bg-white p-8 shadow-soft'>
        <div className='text-center'>
          <h1 className='font-serifBrand text-5xl font-bold tracking-wide text-brand-900'>GAIÒ</h1>
          <p className='mt-2 text-sm text-gray-600'>Crie sua conta para salvar estimativas e anúncios</p>
        </div>
        <form className='mt-8 space-y-4' onSubmit={handleSubmit} noValidate>
          <Input label='Nome completo' type='text' placeholder='Seu nome' value={nome} onChange={(e) => setNome(e.target.value)} error={errors.nome} required />
          <Input label='E-mail' type='email' placeholder='seu@email.com' value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} required />
          <Input label='Senha' type='password' placeholder='Crie uma senha' value={senha} onChange={(e) => setSenha(e.target.value)} error={errors.senha} required />
          <Button type='submit' fullWidth loading={loading}>Criar conta</Button>
        </form>
        <p className='mt-6 text-center text-sm text-gray-500'>
          Já tem conta?{' '}
          <Link className='font-semibold text-brand-900 hover:underline' to='/login'>
            Entrar
          </Link>
        </p>
        <div className='mt-4 border-t border-surface-100 pt-4 text-center'>
          <Link className='text-sm font-semibold text-brand-900 hover:underline' to='/estimativas/nova'>
            Calcular uma estimativa sem entrar
          </Link>
          <p className='mt-1 text-xs text-gray-500'>Para salvar a estimativa e criar anúncios, é preciso ter uma conta.</p>
        </div>
      </div>
    </div>
  );
};
