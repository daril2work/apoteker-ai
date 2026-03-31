import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePharmacyStore } from '../store/usePharmacyStore';



const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = usePharmacyStore();

  useEffect(() => {
    if (user) {
      navigate('/asuhan', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    // Simple intersection observer for reveal-on-scroll
    const observerOptions = {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, observerOptions);

    document.querySelectorAll('.reveal-on-scroll').forEach(el => observer.observe(el));

    // Handle nav blur/bg change on scroll
    const handleScroll = () => {
      const nav = document.querySelector('nav');
      if (nav) {
        if (window.scrollY > 20) {
          nav.classList.add('shadow-md', 'bg-white/95');
          nav.classList.remove('bg-white/80');
        } else {
          nav.classList.remove('shadow-md', 'bg-white/95');
          nav.classList.add('bg-white/80');
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="font-body selection:bg-primary-fixed-dim selection:text-on-primary-fixed">
      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-900/80 glass-nav shadow-sm">
        <div className="max-w-7xl mx-auto px-8 h-16 flex justify-between items-center">
          <div className="text-xl font-bold tracking-tighter text-teal-800 dark:text-teal-300 font-headline flex items-center gap-2">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>medical_services</span>
            FarmasiKu
          </div>
          <div className="hidden md:flex items-center space-x-8 font-manrope text-sm tracking-tight">
            <a className="text-teal-600 dark:text-teal-400 font-semibold border-b-2 border-teal-600 px-1 py-1" href="#features">Fitur</a>
            <a className="text-slate-600 dark:text-slate-400 hover:text-teal-600 transition-colors" href="#pricing">Harga</a>
            <a className="text-slate-600 dark:text-slate-400 hover:text-teal-600 transition-colors" href="#ebm-algorithm">CPPT Berbasis EBM</a>
            <a className="text-slate-600 dark:text-slate-400 hover:text-teal-600 transition-colors" href="#">Puskesmas</a>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <button 
                onClick={() => navigate('/asuhan')}
                className="bg-primary hover:bg-primary-container text-on-primary text-sm font-semibold px-6 py-2 rounded-xl transition-all hover:scale-105 hover:shadow-lg active:scale-95 shadow-md flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">dashboard</span>
                Dashboard
              </button>
            ) : (
              <>
                <button 
                  onClick={() => navigate('/auth')}
                  className="text-slate-600 dark:text-slate-400 hover:text-teal-600 text-sm font-medium px-4 py-2 transition-all hover:scale-105 active:scale-95"
                >
                  Masuk
                </button>
                <button 
                  onClick={() => navigate('/auth')}
                  className="bg-primary hover:bg-primary-container text-on-primary text-sm font-semibold px-6 py-2 rounded-xl transition-all hover:scale-105 hover:shadow-lg active:scale-95 shadow-md"
                >
                  Mulai Gratis
                </button>
              </>
            )}
          </div>

        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-32 pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 z-10">
              <span className="inline-block px-4 py-1.5 mb-6 text-xs font-bold tracking-widest uppercase bg-primary-fixed text-on-primary-fixed-variant rounded-full animate-fadeInUp" style={{ animationDelay: '100ms' }}>
                Pharmacy Intelligence for Clinical Excellence
              </span>
              <h1 className="text-3xl lg:text-4xl font-bold font-headline leading-snug tracking-tight text-on-surface mb-6 animate-fadeInUp" style={{ animationDelay: '200ms' }}>
                Asisten AI untuk <span className="text-primary italic">Farmasi Klinik</span> Modern
              </h1>
              <p className="text-base text-on-surface-variant max-w-lg mb-10 leading-relaxed animate-fadeInUp" style={{ animationDelay: '300ms' }}>
                Skrining resep 4T 1W, Care Plan EBM, dan CPPT berbasis AI — dalam hitungan detik.
              </p>
              <div className="flex flex-wrap gap-4 animate-fadeInUp" style={{ animationDelay: '400ms' }}>
                <button 
                  onClick={() => navigate(user ? '/asuhan' : '/auth')}
                  className="px-8 py-4 bg-primary text-on-primary font-bold rounded-xl shadow-lg hover:shadow-primary/30 hover:scale-[1.02] transition-all active:scale-95 flex items-center gap-2 group"
                >
                  {user ? 'Lanjutkan ke Dashboard' : 'Mulai Analisis Gratis'}
                  <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </button>
                {!user && (
                    <button className="px-8 py-4 bg-surface-container-highest text-on-surface font-semibold rounded-xl hover:bg-surface-container-high hover:scale-[1.02] transition-all active:scale-95">
                    Pelajari Lebih Lanjut
                    </button>
                )}
              </div>

            </div>
            <div className="lg:col-span-5 relative animate-reveal" style={{ animationDelay: '500ms' }}>
              <div className="relative z-10 bg-white p-4 rounded-full shadow-2xl border border-outline-variant/10 aspect-square flex items-center justify-center overflow-hidden hover:scale-[1.01] transition-transform duration-700">
                <img 
                  alt="FarmasiKu Interface" 
                  className="w-full h-full object-cover rounded-full" 
                  src="/hero-mockup.png"
                />
              </div>
              {/* Decorative Floating Element */}
              <div className="absolute -top-10 -right-10 w-64 h-64 bg-primary-fixed-dim/30 rounded-full blur-3xl -z-10 animate-pulse"></div>
              <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-secondary-container/20 rounded-full blur-2xl -z-10 animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>
          </div>
        </div>
      </header>

      {/* App Mockup Section (Asymmetric Editorial Style) */}
      <section className="py-24 bg-surface-container-low overflow-hidden">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex flex-col lg:flex-row gap-16 items-start">
            <div className="w-full lg:w-1/3 sticky top-32 reveal-on-scroll">
              <h2 className="text-3xl font-bold font-headline mb-4">Skrining & Dokumentasi dalam Satu Genggaman</h2>
              <p className="text-on-surface-variant mb-8 leading-relaxed">
                Platform yang dirancang khusus untuk alur kerja apoteker di Puskesmas. Meminimalisir kesalahan interpretasi klinis dan mempercepat pelaporan.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-surface-container-lowest rounded-xl shadow-sm border-l-4 border-primary hover:translate-x-2 transition-transform cursor-default">
                  <span className="material-symbols-outlined text-primary">verified_user</span>
                  <div>
                    <div className="font-bold text-sm">Validasi Berbasis EBM</div>
                    <div className="text-xs text-on-surface-variant">Rekomendasi asuhan berdasarkan pedoman terbaru.</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-surface-container-lowest/50 rounded-xl hover:bg-surface-container-lowest hover:translate-x-2 transition-all cursor-default">
                  <span className="material-symbols-outlined text-secondary">history_edu</span>
                  <div>
                    <div className="font-bold text-sm">Standardisasi CPPT Berbasis EBM</div>
                    <div className="text-xs text-on-surface-variant">Format dokumentasi SOAP dengan dukungan analisis ilmiah mutakhir.</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-full lg:w-2/3 reveal-on-scroll delay-200">
              <div className="bg-surface-container-lowest p-2 rounded-2xl shadow-2xl border border-outline-variant/10 overflow-hidden transform lg:rotate-2 hover:rotate-0 transition-transform duration-700">
                <img 
                  alt="FarmasiKu Dashboard" 
                  className="rounded-xl w-full h-auto" 
                  src="/dashboard-mockup.png"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section id="features" className="py-24 bg-surface">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16 reveal-on-scroll">
            <h2 className="text-4xl font-bold font-headline mb-4 tracking-tight">Solusi Farmasi Klinik Terpadu</h2>
            <div className="h-1 w-20 bg-primary mx-auto rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group p-8 bg-surface-container-low rounded-2xl hover:bg-surface-container-lowest transition-all duration-500 border border-transparent hover:border-primary-fixed-dim hover:shadow-xl hover:-translate-y-2 reveal-on-scroll delay-100">
              <div className="w-14 h-14 bg-primary-fixed-dim flex items-center justify-center rounded-xl mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                <span className="material-symbols-outlined text-on-primary-fixed-variant text-3xl">patient_list</span>
              </div>
              <h3 className="text-xl font-bold font-headline mb-4">Analisis Asuhan Farmasi</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed mb-6">
                Rekomendasi mandiri rencana asuhan (Care Plan) berbasis EBM berdasarkan data subjektif dan objektif pasien.
              </p>
              <ul className="space-y-2 text-xs font-medium text-on-surface">
                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> Penyusunan Rencana Asuhan</li>
                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> Care Plan Berbasis EBM</li>
              </ul>
            </div>
            {/* Feature 2 */}
            <div className="group p-8 bg-primary text-on-primary rounded-2xl shadow-xl transform md:-translate-y-4 hover:-translate-y-6 transition-all duration-500 reveal-on-scroll delay-200">
              <div className="w-14 h-14 bg-primary-container flex items-center justify-center rounded-xl mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-on-primary-container text-3xl">camera_enhance</span>
              </div>
              <h3 className="text-xl font-bold font-headline mb-4">Skrining Resep Pintar</h3>
              <p className="text-on-primary-container/80 text-sm leading-relaxed mb-6">
                Deteksi otomatis Drug Related Problems (DRP) seperti interaksi obat dan kesesuaian dosis lewat AI Vision atau input teks.
              </p>
              <button className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 group/btn">
                Lihat Cara Kerja AI Vision <span className="material-symbols-outlined text-sm group-hover/btn:translate-x-2 transition-transform">trending_flat</span>
              </button>
            </div>
            {/* Feature 3 */}
            <div className="group p-8 bg-surface-container-low rounded-2xl hover:bg-surface-container-lowest transition-all duration-500 border border-transparent hover:border-primary-fixed-dim hover:shadow-xl hover:-translate-y-2 reveal-on-scroll delay-300">
              <div className="w-14 h-14 bg-secondary-container flex items-center justify-center rounded-xl mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-transform">
                <span className="material-symbols-outlined text-on-secondary-container text-3xl">history</span>
              </div>
              <h3 className="text-xl font-bold font-headline mb-4">Riwayat Terintegrasi</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed mb-6">
                Kelola data asuhan dan skrining pasien secara terpusat. Memudahkan pencarian riwayat untuk tindak lanjut pengobatan pasien.
              </p>
              <div className="mt-4 h-16 w-full bg-surface-container flex items-end gap-1 px-4 py-2 rounded-lg group-hover:bg-surface-container-low transition-colors">
                <div className="flex-1 bg-primary rounded-t h-[40%] group-hover:h-[50%] transition-all duration-500"></div>
                <div className="flex-1 bg-primary rounded-t h-[60%] group-hover:h-[80%] transition-all duration-500 delay-75"></div>
                <div className="flex-1 bg-primary rounded-t h-[90%] group-hover:h-[60%] transition-all duration-500 delay-100"></div>
                <div className="flex-1 bg-primary rounded-t h-[75%] group-hover:h-[95%] transition-all duration-500 delay-150"></div>
                <div className="flex-1 bg-primary rounded-t h-[85%] group-hover:h-[70%] transition-all duration-500 delay-200"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* EBM Algorithm Section */}
      <section id="ebm-algorithm" className="py-24 bg-surface-container-low overflow-hidden">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="reveal-on-scroll">
              <h2 className="text-4xl font-bold font-headline mb-6 tracking-tight">Algoritma AI Berbasis <span className="text-primary">EBM</span></h2>
              <p className="text-on-surface-variant text-base leading-relaxed mb-10">
                Bagaimana FarmasiKu melakukan analisis klinis yang mendalam dan akurat? Kami menggunakan pendekatan sistematis 4-tahap yang menggabungkan kecerdasan buatan dengan standar emas farmasi klinik.
              </p>
              
              <div className="space-y-8">
                <div className="flex gap-6 items-start">
                  <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                    <span className="material-symbols-outlined text-white">input</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">1. Triage Data Digital</h4>
                    <p className="text-sm text-on-surface-variant leading-relaxed">AI Vision mengekstrak data dari foto resep atau input teks, kemudian menatanya menjadi struktur SOAP (Subjective, Objective, Assessment, Plan).</p>
                  </div>
                </div>
                
                <div className="flex gap-6 items-start">
                  <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center shrink-0 border border-primary/20">
                    <span className="material-symbols-outlined text-primary">menu_book</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">2. Pemetaan Bukti Klinis (EBM)</h4>
                    <p className="text-sm text-on-surface-variant leading-relaxed">Sistem melakukan pencocokan silang secara real-time dengan PMK-73, Formularium Nasional, dan database studi klinis terkini.</p>
                  </div>
                </div>
                
                <div className="flex gap-6 items-start">
                  <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center shrink-0 border border-primary/20">
                    <span className="material-symbols-outlined text-primary">security</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">3. Skrining DRP Proaktif (4T 1W)</h4>
                    <p className="text-sm text-on-surface-variant leading-relaxed">Algoritma mendeteksi Drug Related Problems: Tepat Obat, Tepat Dosis, Tepat Pasien, Tepat Indikasi, serta Waspada Efek Samping.</p>
                  </div>
                </div>
                
                <div className="flex gap-6 items-start">
                  <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center shrink-0 border border-primary/20">
                    <span className="material-symbols-outlined text-primary">history_edu</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">4. Rekomendasi Care Plan CPPT</h4>
                    <p className="text-sm text-on-surface-variant leading-relaxed">Menghasilkan draf dokumen CPPT yang terstruktur, siap untuk divalidasi dan ditandatangani oleh Apoteker penanggung jawab.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative reveal-on-scroll delay-300">
              <div className="absolute -inset-4 bg-primary/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
              <div className="bg-white p-6 rounded-[2rem] shadow-2xl border border-outline-variant/10 overflow-hidden transform hover:scale-[1.02] transition-transform duration-500">
                <img 
                  alt="Algoritma EBM FarmasiKu" 
                  className="w-full h-auto rounded-xl" 
                  src="/ebm-algorithm.png"
                />
              </div>
              {/* Floating Stat Card */}
              <div className="absolute -top-6 -right-6 bg-white p-4 rounded-xl shadow-xl border border-outline-variant/20 animate-fadeInUp">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <span className="material-symbols-outlined text-emerald-600">bolt</span>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-teal-600 uppercase tracking-tighter">Analisis Selesai</div>
                    <div className="text-lg font-black leading-none">0.8 Detik</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-24 bg-surface-container-highest/30 overflow-hidden">
        <div className="max-w-7xl mx-auto px-8">
          <div className="bg-surface-container-lowest rounded-3xl p-12 lg:p-20 shadow-xl relative overflow-hidden reveal-on-scroll">
            <div className="absolute top-0 right-0 p-8 text-surface-container-highest opacity-20 transform translate-x-8 -translate-y-8">
              <span className="material-symbols-outlined text-9xl">format_quote</span>
            </div>
            <div className="relative z-10 max-w-3xl">
              <h2 className="text-2xl font-headline font-semibold text-secondary mb-8">Testimoni Sahabat Apoteker</h2>
              <blockquote className="text-2xl lg:text-3xl font-medium leading-tight mb-10 text-on-surface">
                "Sejak menggunakan FarmasiKu, dokumentasi CPPT di Puskesmas kami tidak lagi terbengkalai. AI-nya sangat membantu dalam memberikan perspektif rencana asuhan yang komprehensif."
              </blockquote>
              <div className="flex items-center gap-4 group">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary-fixed group-hover:scale-110 transition-transform duration-300">
                  <img 
                    alt="Apoteker Puskesmas" 
                    className="w-full h-full object-cover" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBH26SVbQxTKgFqXCAaZyscd6o0yzBIA6zDTTjt8xvztb_ekWkDrjT_CnWAIwvb0sY-tRt9MJeVDp3derbPWcIuGkDr7AZ48E90GrfEjdC0xIG2S6Vx9dRReaWEDkBlUtNBgEvf91_haKakMThJBaKtJ8X6Gz4SzzY6wmB3qDPusqnnaezb24SrzWMjrA0RYslguYK2wYfGH8QNFkb71W57f_QSfJBPCoDx1XaehTvybfWK8bv8C0fKEry6y-coXWgob2BhTt6M6_k"
                  />
                </div>
                <div>
                  <div className="font-bold text-lg font-headline">apt. Nurul Hidayah, S.Farm</div>
                  <div className="text-on-surface-variant text-sm">Apoteker Puskesmas Menteng</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-surface">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16 reveal-on-scroll">
            <h2 className="text-4xl font-bold font-headline mb-4 tracking-tight text-on-surface">Pilih Layanan <span className="text-primary">FarmasiKu</span></h2>
            <p className="text-on-surface-variant text-xl leading-relaxed">Investasi untuk profesionalisme asuhan pasien di fasilitas kesehatan Anda.</p>
          </div>
          <div className="flex flex-col md:flex-row justify-center gap-8 max-w-5xl mx-auto">
            <div className="flex-1 p-10 bg-surface-container-low rounded-3xl border border-outline-variant/10 hover:border-primary-fixed transition-colors reveal-on-scroll delay-100">
              <h3 className="text-xl font-bold font-headline mb-4">Edisi Gratis</h3>
              <div className="text-4xl font-extrabold mb-8">Rp 0<span className="text-lg text-on-surface-variant font-medium">/bulan</span></div>
              <ul className="space-y-4 mb-10">
                <li className="flex items-center gap-3 text-sm font-medium"><span className="material-symbols-outlined text-primary">check</span> 10 Analisis Asuhan/bulan</li>
                <li className="flex items-center gap-3 text-sm font-medium"><span className="material-symbols-outlined text-primary">check</span> Skrining Farmasi Dasar</li>
                <li className="flex items-center gap-3 text-sm font-medium"><span className="material-symbols-outlined text-primary">check</span> Riwayat Akses 10 Pasien</li>
              </ul>
              <button 
                onClick={() => navigate('/auth')}
                className="w-full py-4 rounded-xl border-2 border-primary text-primary font-bold hover:bg-primary/5 transition-colors"
              >
                Pilih Edisi Gratis
              </button>
            </div>
            <div className="flex-1 p-10 bg-primary text-on-primary rounded-3xl shadow-2xl shadow-primary/30 transform md:-translate-y-4 reveal-on-scroll delay-200">
              <div className="inline-block px-3 py-1 mb-6 text-[10px] font-bold tracking-widest uppercase bg-primary-container text-on-primary-container rounded-full">
                Rekomendasi Apoteker
              </div>
              <h3 className="text-xl font-bold font-headline mb-4">Edisi Pro</h3>
              <div className="text-4xl font-extrabold mb-8">Rp 10.000<span className="text-lg opacity-80 font-medium">/bulan</span></div>
              <ul className="space-y-4 mb-10">
                <li className="flex items-center gap-3 text-sm font-medium"><span className="material-symbols-outlined">check</span> Analisis Asuhan Tanpa Batas</li>
                <li className="flex items-center gap-3 text-sm font-medium"><span className="material-symbols-outlined">check</span> AI Vision (Upload Foto Resep)</li>
                <li className="flex items-center gap-3 text-sm font-medium"><span className="material-symbols-outlined">check</span> Voice Input & Chat Mode</li>
                <li className="flex items-center gap-3 text-sm font-medium"><span className="material-symbols-outlined">check</span> Riwayat Pasien Tak Terbatas</li>
              </ul>
              <button 
                onClick={() => navigate('/auth')}
                className="w-full py-4 rounded-xl bg-white text-primary font-bold hover:shadow-lg transition-transform hover:scale-[1.02] active:scale-95"
              >
                Berlangganan Pro
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 dark:bg-slate-950 w-full py-20 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-1">
            <div className="text-lg font-black text-teal-900 dark:text-teal-100 font-headline mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>medical_services</span>
              FarmasiKu
            </div>
            <p className="text-sm font-body text-slate-500 leading-relaxed mb-6">
              Mewujudkan praktik farmasi klinik yang lebih cerdas, efisien, dan terstandarisasi untuk keselamatan pasien.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-xs uppercase tracking-widest text-teal-700 dark:text-teal-400 mb-6">Produk</h4>
            <ul className="space-y-4 text-sm font-body">
              <li><a className="text-slate-500 hover:text-teal-500 transition-colors" href="#">Analisis Asuhan</a></li>
              <li><a className="text-slate-500 hover:text-teal-500 transition-colors" href="#">Skrining Resep</a></li>
              <li><a className="text-slate-500 hover:text-teal-500 transition-colors" href="#">RME Integration</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-xs uppercase tracking-widest text-teal-700 dark:text-teal-400 mb-6">Sumber Daya</h4>
            <ul className="space-y-4 text-sm font-body">
              <li><a className="text-slate-500 hover:text-teal-500 transition-colors" href="#">Tutorial Penggunaan</a></li>
              <li><a className="text-slate-500 hover:text-teal-500 transition-colors" href="#">Pedoman CPPT & EBM</a></li>
              <li><a className="text-slate-500 hover:text-teal-500 transition-colors" href="#">Puskesmas Support</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-xs uppercase tracking-widest text-teal-700 dark:text-teal-400 mb-6">Kebijakan</h4>
            <div className="flex items-center gap-4 mb-6">
              <div className="p-2 bg-white rounded shadow-sm flex items-center justify-center">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
              </div>
              <span className="text-xs text-slate-500 font-bold tracking-widest">Aman & Terenkripsi</span>
            </div>
            <p className="text-xs text-slate-400">© 2026 FarmasiKu - Asisten Farmasi Klinik Indonesia.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
