import { Archive, Eye, EyeOff, UserRound } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Field } from '../components/common/Field';
import { Brand } from '../components/layout/Brand';
import { useLibrary } from '../state/LibraryContext';

type AuthPageProps = {
  mode: 'login' | 'register';
};

export function AuthPage({ mode }: AuthPageProps) {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login, register } = useLibrary();
  const isLogin = mode === 'login';

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (!email.trim() || !password) { setError('Veuillez remplir tous les champs obligatoires.'); return; }

    setSubmitting(true);
    try {
      if (!isLogin) {
        if (!name.trim() || password.length < 6) { setError('Le nom est obligatoire et le mot de passe doit contenir 6 caractères.'); return; }
        if (password !== confirmation) { setError('Les mots de passe ne correspondent pas.'); return; }
        const registerError = await register(name, email, password);
        if (registerError) { setError(registerError); return; }
        navigate('/login');
        return;
      }
      const loginError = await login(email, password);
      if (loginError) { setError(loginError); return; }
      navigate('/admin');
    } finally {
      setSubmitting(false);
    }
  };

  return <main className="auth-page"><div className="auth-message"><p className="eyebrow">{isLogin ? 'VOTRE ESPACE DE LECTURE' : 'UNE COMMUNAUTÉ DE LECTEURS'}</p><h1>{isLogin ? <>Les livres<br />ouvrent des portes<br />sur de nouveaux<br />mondes.</> : <>Rejoignez notre<br />communauté de<br />lecteurs</>}</h1><span className="little-line"></span><div className="auth-illustration"><div className="illustration-books"><i></i><i></i><i></i></div><div className="illustration-plant"><i></i><i></i><i></i></div><span className="illustration-leaf leaf-one"></span><span className="illustration-leaf leaf-two"></span></div></div><div className="auth-card"><Brand /><div className="auth-card-content"><h2>{isLogin ? 'Se connecter' : "S'inscrire"}</h2><p className="muted">{isLogin ? 'Connectez-vous pour accéder à votre compte.' : 'Créez votre compte pour commencer.'}</p><form onSubmit={submit} autoComplete="off">{error && <p className="form-error" role="alert">{error}</p>}{!isLogin && <Field icon={<UserRound size={14} />} placeholder="Nom complet" value={name} onChange={setName} autoComplete="off" preventAutofill />}{<Field icon={<Archive size={14} />} placeholder="Adresse e-mail" type="email" value={email} onChange={setEmail} autoComplete="off" preventAutofill />}{<Field icon={<span>⌕</span>} placeholder="Mot de passe" type={show ? 'text' : 'password'} value={password} onChange={setPassword} autoComplete="new-password" preventAutofill trailing={<button type="button" className="icon-button" onClick={() => setShow(!show)}>{show ? <EyeOff size={15} /> : <Eye size={15} />}</button>} />}{!isLogin && <Field icon={<Archive size={14} />} placeholder="Confirmer le mot de passe" type="password" value={confirmation} onChange={setConfirmation} autoComplete="new-password" preventAutofill />}<Button type="submit" loading={submitting}>{isLogin ? 'Se connecter' : "S'inscrire"}</Button></form>{!isLogin && <div className="auth-separator"></div>}<p className="switch-auth">{isLogin ? "Vous n'avez pas de compte ?" : 'Déjà un compte ?'} <Link to={isLogin ? '/register' : '/login'}>{isLogin ? "S'inscrire" : 'Se connecter'}</Link></p></div></div></main>;
}
