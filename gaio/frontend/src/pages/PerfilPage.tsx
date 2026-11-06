import { FormEvent, useEffect, useState } from 'react';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { PageHeader } from '../components/layout/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { usuarioService } from '../services/usuarioService';
import { getErrorMessage } from '../utils/error';

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DadosDaConta = () => {
  const { user, atualizarSessao } = useAuth();
  const { showToast } = useToast();
  const [nome, setNome] = useState(user?.nome ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [erros, setErros] = useState<{ nome?: string; email?: string }>({});
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    usuarioService
      .perfil()
      .then((perfil) => {
        setNome(perfil.nome);
        setEmail(perfil.email);
      })
      .catch(() => undefined);
  }, []);

  const alterado = nome.trim() !== (user?.nome ?? '') || email.trim() !== (user?.email ?? '');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const proximos: { nome?: string; email?: string } = {};
    if (!nome.trim()) proximos.nome = 'Informe seu nome.';
    if (!EMAIL_VALIDO.test(email.trim())) proximos.email = 'Informe um e-mail válido.';
    setErros(proximos);
    if (Object.keys(proximos).length) return;

    setSalvando(true);
    try {
      const sessao = await usuarioService.atualizarPerfil({ nome: nome.trim(), email: email.trim() });
      atualizarSessao(sessao);
      showToast({ type: 'success', title: 'Perfil atualizado', description: 'Seus dados foram salvos.' });
    } catch (error) {
      showToast({ type: 'error', title: 'Não foi possível salvar', description: getErrorMessage(error) });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Card>
      <h2 className='text-sm font-semibold uppercase tracking-wide2 text-brand-800'>Dados da conta</h2>
      <form className='mt-4 space-y-4' onSubmit={handleSubmit}>
        <Input label='Nome' value={nome} onChange={(e) => setNome(e.target.value)} error={erros.nome} autoComplete='name' />
        <Input label='E-mail' type='email' value={email} onChange={(e) => setEmail(e.target.value)} error={erros.email} autoComplete='email' helperText='O e-mail é usado para entrar na conta.' />
        <Button type='submit' loading={salvando} disabled={!alterado}>Salvar dados</Button>
      </form>
    </Card>
  );
};

const TrocarSenha = () => {
  const { showToast } = useToast();
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [erros, setErros] = useState<{ senhaAtual?: string; novaSenha?: string; confirmacao?: string }>({});
  const [salvando, setSalvando] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const proximos: { senhaAtual?: string; novaSenha?: string; confirmacao?: string } = {};
    if (!senhaAtual) proximos.senhaAtual = 'Informe a senha atual.';
    if (novaSenha.length < 6) proximos.novaSenha = 'A nova senha deve ter ao menos 6 caracteres.';
    else if (novaSenha === senhaAtual) proximos.novaSenha = 'A nova senha deve ser diferente da atual.';
    if (confirmacao !== novaSenha) proximos.confirmacao = 'As senhas não conferem.';
    setErros(proximos);
    if (Object.keys(proximos).length) return;

    setSalvando(true);
    try {
      await usuarioService.alterarSenha({ senhaAtual, novaSenha });
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmacao('');
      showToast({ type: 'success', title: 'Senha alterada', description: 'Use a nova senha no próximo login.' });
    } catch (error) {
      showToast({ type: 'error', title: 'Não foi possível alterar a senha', description: getErrorMessage(error) });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Card>
      <h2 className='text-sm font-semibold uppercase tracking-wide2 text-brand-800'>Trocar senha</h2>
      <form className='mt-4 space-y-4' onSubmit={handleSubmit}>
        <Input label='Senha atual' type='password' value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} error={erros.senhaAtual} autoComplete='current-password' />
        <Input label='Nova senha' type='password' value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} error={erros.novaSenha} helperText='Mínimo de 6 caracteres.' autoComplete='new-password' />
        <Input label='Confirmar nova senha' type='password' value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} error={erros.confirmacao} autoComplete='new-password' />
        <Button type='submit' loading={salvando}>Alterar senha</Button>
      </form>
    </Card>
  );
};

export const PerfilPage = () => (
  <div className='space-y-6'>
    <PageHeader title='Meu perfil' subtitle='Atualize seus dados e sua senha.' />
    <div className='grid gap-6 lg:grid-cols-2'>
      <DadosDaConta />
      <TrocarSenha />
    </div>
  </div>
);
