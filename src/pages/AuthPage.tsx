import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { ClipboardCheck, Loader2, MailCheck, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LegalDocs from '../components/LegalDocs';

const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [sipa, setSipa] = useState('');
    const [puskesmas, setPuskesmas] = useState('');
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isEmailSent, setIsEmailSent] = useState(false);
    
    const [showLegalDocs, setShowLegalDocs] = useState(false);
    const [agreedToLegal, setAgreedToLegal] = useState(false);

    const navigate = useNavigate();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!isLogin && !agreedToLegal) {
            setError("Anda harus menyetujui Dokumen Legal untuk mendaftar.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });
                if (error) throw error;
                navigate('/asuhan');
            } else {
                const { error: signUpError, data } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: name,
                            sipa: sipa,
                            puskesmas: puskesmas,
                            tier: 'free'
                        }
                    }
                });
                if (signUpError) throw signUpError;
                
                // If the user was created but session is null, email confirmation is required by Supabase
                if (data.user && !data.session) {
                    setIsEmailSent(true);
                } else {
                    // If email confirmation is disabled on the Supabase project
                    navigate('/asuhan');
                }
            }

        } catch (err: any) {
            setError(err.message || "Terjadi kesalahan sistem.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            {/* Latar Belakang / Kolom Kiri untuk Desktop */}
            <div className="auth-sidebar">
                <div className="auth-sidebar-content">
                    <ClipboardCheck size={64} color="white" style={{ marginBottom: '1.5rem' }} />
                    <h1 style={{ color: 'white', fontSize: '2.5rem', marginBottom: '1rem', lineHeight: 1.2 }}>FarmasiKu</h1>
                    <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.1rem', maxWidth: '400px', lineHeight: 1.6 }}>
                        Asisten analitik cerdas pendamping Apoteker Puskesmas. Bebaskan diri dari beban administrasi dan dokumentasi.
                    </p>
                </div>
            </div>

            {/* Form Login / Kolom Kanan */}
            <div className="auth-form-wrapper">
                <div className="auth-form-inner card">
                    {isEmailSent ? (
                        <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                            <MailCheck size={64} color="var(--primary)" style={{ margin: '0 auto 1.5rem' }} />
                            <h2 style={{ marginBottom: '1rem' }}>Cek Email Anda!</h2>
                            <p className="text-light" style={{ marginBottom: '2rem' }}>
                                Tautan konfirmasi telah dikirim ke surat elektronik <strong>{email}</strong>. 
                                Silakan klik tautan di dalamnya untuk mengaktifkan akun FarmasiKu Anda.
                            </p>
                            <button className="btn-outline" style={{width: '100%', justifyContent: 'center'}} onClick={() => {
                                setIsEmailSent(false);
                                setIsLogin(true);
                            }}>
                                Kembali ke Halaman Login
                            </button>
                        </div>
                    ) : (
                        <>
                            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                                <div className="mobile-only-logo" style={{ color: 'var(--primary)', marginBottom: '1rem', display: 'none' }}>
                                    <ClipboardCheck size={40} />
                                </div>
                                <h2>{isLogin ? 'Masuk ke FarmasiKu' : 'Buat Akun Apoteker'}</h2>
                                <p className="text-light">
                                    {isLogin ? 'Selamat datang kembali' : 'Lengkapi data keprofesian Anda untuk memulai'}
                                </p>
                            </div>

                            {error && (
                                <div style={{
                                    padding: '1rem',
                                    backgroundColor: '#fef2f2',
                                    color: 'var(--danger)',
                                    borderRadius: '6px',
                                    marginBottom: '1.5rem',
                                    fontSize: '0.85rem',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <span>{error === 'Invalid login credentials' ? 'Email atau kata sandi tidak sesuai.' : error}</span>
                                    <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}>
                                        <X size={16} />
                                    </button>
                                </div>
                            )}

                            <form onSubmit={handleAuth}>
                                {!isLogin && (
                                    <>
                                        <div className="form-group">
                                            <label>Nama Lengkap (Sesuai SIPA)</label>
                                            <input
                                                type="text"
                                                required
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="apt. Budi Santoso, S.Farm"
                                            />
                                        </div>
                                        <div className="form-group-row">
                                            <div className="form-group">
                                                <label>No. SIPA</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={sipa}
                                                    onChange={(e) => setSipa(e.target.value)}
                                                    placeholder="123/SIPA/2026"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Instansi</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={puskesmas}
                                                    onChange={(e) => setPuskesmas(e.target.value)}
                                                    placeholder="Puskesmas Melati"
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}
                                
                                <div className="form-group">
                                    <label>Email Akses</label>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="email@puskesmas.id"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Kata Sandi</label>
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Minimal 6 karakter"
                                        minLength={6}
                                    />
                                </div>

                                {!isLogin && (
                                    <div className="legal-checkbox-container">
                                        <label className="checkbox-wrapper">
                                            <input 
                                                type="checkbox" 
                                                checked={agreedToLegal}
                                                onChange={(e) => setAgreedToLegal(e.target.checked)}
                                            />
                                            <span className="checkbox-custom"></span>
                                            <span className="checkbox-label">
                                                Saya menyetujui seluruh <button type="button" className="link-btn" onClick={() => setShowLegalDocs(true)}>Dokumen Legal FarmasiKu</button>
                                            </span>
                                        </label>
                                    </div>
                                )}

                                <button 
                                    type="submit" 
                                    className="btn-primary" 
                                    disabled={loading || (!isLogin && !agreedToLegal)}
                                    style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', height: '3.2rem', fontSize: '1rem' }}
                                >
                                    {loading && <Loader2 className="animate-spin" size={18} />}
                                    {isLogin ? 'Masuk Dashboard' : 'Daftar Sekarang'}
                                </button>
                            </form>

                            <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.9rem' }}>
                                <span className="text-light">
                                    {isLogin ? 'Apoteker baru? ' : 'Sudah punya akun? '}
                                </span>
                                <button 
                                    onClick={() => {
                                        setIsLogin(!isLogin);
                                        setError(null);
                                    }}
                                    style={{
                                        background: 'none', 
                                        border: 'none', 
                                        color: 'var(--primary)', 
                                        fontWeight: 600, 
                                        cursor: 'pointer',
                                        padding: 0,
                                        marginLeft: '0.2rem'
                                    }}>
                                    {isLogin ? 'Daftar di sini' : 'Masuk di sini'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {showLegalDocs && (
                <LegalDocs onClose={() => setShowLegalDocs(false)} />
            )}
            
            <style>{`
                /* Auth Layout Styles */
                .auth-container {
                    display: flex;
                    min-height: 100vh;
                    background-color: var(--bg);
                }


                .auth-sidebar {
                    display: none;
                    flex: 1;
                    background: linear-gradient(135deg, var(--primary) 0%, #1e40af 100%);
                    position: relative;
                    overflow: hidden;
                }

                .auth-sidebar-content {
                    position: relative;
                    z-index: 10;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    height: 100%;
                    padding: 4rem;
                }

                /* Decorative circles for sidebar */
                .auth-sidebar::before {
                    content: '';
                    position: absolute;
                    top: -10%;
                    left: -10%;
                    width: 50vw;
                    height: 50vw;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.05);
                }
                
                .auth-sidebar::after {
                    content: '';
                    position: absolute;
                    bottom: -20%;
                    right: -10%;
                    width: 40vw;
                    height: 40vw;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.05);
                }

                .auth-form-wrapper {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 2rem;
                }

                .auth-form-inner {
                    width: 100%;
                    max-width: 440px;
                    padding: 3rem 2.5rem;
                    border: none;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.05);
                    background: #ffffff;
                    border-radius: 16px;
                }


                .form-group-row {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 0;
                }

                .legal-checkbox-container {
                    margin: 1.5rem 0;
                }

                .checkbox-wrapper {
                    display: flex;
                    align-items: flex-start;
                    gap: 0.75rem;
                    cursor: pointer;
                    user-select: none;
                }

                .checkbox-wrapper input {
                    position: absolute;
                    opacity: 0;
                    cursor: pointer;
                    height: 0;
                    width: 0;
                }

                .checkbox-custom {
                    height: 20px;
                    width: 20px;
                    background-color: #f1f5f9;
                    border: 2px solid var(--border);
                    border-radius: 6px;
                    flex-shrink: 0;
                    transition: all 0.2s;
                    position: relative;
                }

                .checkbox-wrapper:hover input ~ .checkbox-custom {
                    border-color: var(--primary);
                }

                .checkbox-wrapper input:checked ~ .checkbox-custom {
                    background-color: var(--primary);
                    border-color: var(--primary);
                }

                .checkbox-custom:after {
                    content: "";
                    position: absolute;
                    display: none;
                    left: 6px;
                    top: 2px;
                    width: 5px;
                    height: 10px;
                    border: solid white;
                    border-width: 0 2px 2px 0;
                    transform: rotate(45deg);
                }

                .checkbox-wrapper input:checked ~ .checkbox-custom:after {
                    display: block;
                }

                .checkbox-label {
                    font-size: 0.875rem;
                    color: var(--text-light);
                    line-height: 1.4;
                }

                .link-btn {
                    background: none;
                    border: none;
                    padding: 0;
                    color: var(--primary);
                    font-weight: 600;
                    cursor: pointer;
                    font-size: inherit;
                    vertical-align: baseline;
                }

                .link-btn:hover {
                    text-decoration: underline;
                }

                @media (min-width: 900px) {
                    .auth-sidebar {
                        display: block;
                    }
                    .form-group-row {
                        grid-template-columns: 1fr 1fr;
                        gap: 1rem;
                    }
                }

                @media (max-width: 899px) {
                    .mobile-only-logo {
                        display: inline-flex !important;
                    }
                    .auth-form-inner {
                        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
                        border: 1px solid var(--border);
                    }
                }

                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default AuthPage;
