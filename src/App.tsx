/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { collection, addDoc, query, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { 
  Shield, 
  LogOut, 
  User as UserIcon, 
  X, 
  Upload, 
  Image as ImageIcon, 
  Copy, 
  Check, 
  Sparkles, 
  AlertCircle,
  Eye,
  Trash2,
  Mail,
  Send,
  ArrowRight,
  Compass,
  Sun,
  Layers,
  Maximize2,
  Phone,
  Instagram,
  MapPin,
  ChevronRight,
  Menu
} from 'lucide-react';

interface StoredFile {
  id: string;
  url: string;
  name: string;
  uploadedBy: string;
  createdAt: string;
}

const HEADER_IMAGE_PATH = '/assets/aistudio/7c368a51-ec83-4cb0-86f5-d9072b379598_6017b8d4.jpeg';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Navigation tab state: 'home' | 'filosofia' | 'competenze' | 'ispirazioni' | 'contatti' | 'gallery'
  const [activeTab, setActiveTab] = useState<'home' | 'filosofia' | 'competenze' | 'ispirazioni' | 'contatti' | 'gallery'>('home');

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSent, setContactSent] = useState(false);

  // Architectural Image preview modal state
  const [activeImagePreview, setActiveImagePreview] = useState<{
    url: string;
    title: string;
    subtitle: string;
    details?: string;
  } | null>(null);

  // CMS State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [lastUploadedUrl, setLastUploadedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filesList, setFilesList] = useState<StoredFile[]>([]);
  const [detailFile, setDetailFile] = useState<StoredFile | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'files'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: StoredFile[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          items.push({
            id: docSnap.id,
            url: data.url,
            name: data.name,
            uploadedBy: data.uploadedBy,
            createdAt: data.createdAt,
          });
        });
        setFilesList(items);
      },
      (error) => {
        // Silent handling of offline/permission state for public users
      }
    );
    return () => unsubscribe();
  }, [user]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage("Errore durante il login con Google. Assicurati che i pop-up siano abilitati.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const compressAndConvertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const handleImageUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !user) return;

    setUploading(true);
    setErrorMessage(null);
    setLastUploadedUrl(null);

    try {
      const fileId = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const fileName = selectedFile.name;
      const dataUrl = await compressAndConvertToBase64(selectedFile);

      const fileData = {
        id: fileId,
        url: dataUrl,
        name: fileName,
        uploadedBy: user.uid,
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'files'), fileData);
      setLastUploadedUrl(dataUrl);
      setSelectedFile(null);
    } catch (error: any) {
      console.error('Upload process error:', error);
      setErrorMessage(`Impossibile salvare la foto: ${error?.message || 'Errore sconosciuto'}`);
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = async (text: string, id?: string) => {
    let success = false;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        success = true;
      }
    } catch (err) {
      console.warn('navigator.clipboard failed', err);
    }

    if (!success) {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        success = document.execCommand('copy');
        document.body.removeChild(textArea);
      } catch (fallbackErr) {
        console.error('execCommand copy failed', fallbackErr);
      }
    }

    if (id) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!window.confirm('Sei sicuro di voler eliminare questa immagine?')) return;
    try {
      await deleteDoc(doc(db, 'files', docId));
      if (detailFile?.id === docId) {
        setDetailFile(null);
      }
    } catch (err) {
      console.error('Error deleting image:', err);
      alert('Errore durante l\'eliminazione.');
    }
  };

  const handleSendContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) return;
    setContactSent(true);
    setTimeout(() => {
      setContactName('');
      setContactEmail('');
      setContactMessage('');
      setContactSent(false);
    }, 4000);
  };

  return (
    <div className="bg-[#FAF8F5] min-h-screen w-full relative flex flex-col font-sans text-slate-800">
      {/* Tasto Area Riservata: Piccolo, uniforme con l'immagine/sfondo, posizionato in alto a destra */}
      <div className="absolute top-3 right-4 z-50 flex items-center gap-2">
        {user && (
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 bg-[#F4EFE6]/80 backdrop-blur-md border border-[#E6E0D4] rounded-full text-[10px] font-medium text-slate-700 shadow-2xs">
            {user.photoURL && (
              <img src={user.photoURL} alt="" className="w-3 h-3 rounded-full object-cover" />
            )}
            <span className="truncate max-w-[100px]">{user.displayName || user.email}</span>
          </div>
        )}
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EFECE6]/70 hover:bg-[#E8E3DA] backdrop-blur-md border border-[#DFD8CC] text-slate-700 text-[11px] font-medium shadow-2xs transition-all cursor-pointer whitespace-nowrap"
          title="Area Riservata & CMS"
        >
          <Shield className="w-3 h-3 text-slate-600" />
          <span>{user ? 'CMS' : 'Area Riservata'}</span>
          {user && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
          )}
        </button>
      </div>

      {/* Immagine di Testata originale Denisa */}
      <section className="w-full bg-[#FAF8F5] p-0 m-0 border-b border-[#E8E3DA]">
        <img
          src={HEADER_IMAGE_PATH}
          alt="DENISA – Architettura e arredamento di interni"
          className="w-full h-auto block object-cover rounded-none max-h-[240px] sm:max-h-[460px]"
        />
      </section>

      {/* Menu Orizzontale con voci equidistanti e Menu Mobile compatto */}
      <header className="w-full bg-[#FAF8F5] border-b border-[#E8E3DA] sticky top-0 z-40">
        <div className="w-full px-4 sm:px-8 py-3.5 flex items-center justify-between sm:justify-center">
          {/* Mobile menu button and name */}
          <div className="flex sm:hidden items-center justify-between w-full">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg border border-[#E2DAD0] bg-white text-slate-700 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider shrink-0"
              aria-label="Menu"
            >
              <Menu className="w-4 h-4" />
              <span>Menu</span>
            </button>
            <span className="text-xs font-serif font-medium text-slate-800 tracking-wide truncate pl-3">
              Denisa Purpura
            </span>
          </div>

          <nav className="hidden sm:flex items-center justify-center gap-6 sm:gap-10 md:gap-14 overflow-x-auto py-1">
            <button
              onClick={() => setActiveTab('home')}
              className={`text-xs sm:text-sm font-medium tracking-wider uppercase transition-colors cursor-pointer whitespace-nowrap pb-1 border-b-2 ${
                activeTab === 'home'
                  ? 'text-slate-900 border-slate-900 font-semibold'
                  : 'text-slate-500 border-transparent hover:text-slate-800'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => setActiveTab('filosofia')}
              className={`text-xs sm:text-sm font-medium tracking-wider uppercase transition-colors cursor-pointer whitespace-nowrap pb-1 border-b-2 ${
                activeTab === 'filosofia'
                  ? 'text-slate-900 border-slate-900 font-semibold'
                  : 'text-slate-500 border-transparent hover:text-slate-800'
              }`}
            >
              Chi sono
            </button>
            <button
              onClick={() => setActiveTab('competenze')}
              className={`text-xs sm:text-sm font-medium tracking-wider uppercase transition-colors cursor-pointer whitespace-nowrap pb-1 border-b-2 ${
                activeTab === 'competenze'
                  ? 'text-slate-900 border-slate-900 font-semibold'
                  : 'text-slate-500 border-transparent hover:text-slate-800'
              }`}
            >
              Competenze
            </button>
            <button
              onClick={() => setActiveTab('ispirazioni')}
              className={`text-xs sm:text-sm font-medium tracking-wider uppercase transition-colors cursor-pointer whitespace-nowrap pb-1 border-b-2 ${
                activeTab === 'ispirazioni'
                  ? 'text-slate-900 border-slate-900 font-semibold'
                  : 'text-slate-500 border-transparent hover:text-slate-800'
              }`}
            >
              Ispirazioni
            </button>
            {user && (
              <button
                onClick={() => setActiveTab('gallery')}
                className={`text-xs sm:text-sm font-medium tracking-wider uppercase transition-colors cursor-pointer whitespace-nowrap pb-1 border-b-2 ${
                  activeTab === 'gallery'
                    ? 'text-slate-900 border-slate-900 font-semibold'
                    : 'text-slate-500 border-transparent hover:text-slate-800'
                }`}
              >
                Gallery DB ({filesList.length})
              </button>
            )}
            <button
              onClick={() => setActiveTab('contatti')}
              className={`text-xs sm:text-sm font-medium tracking-wider uppercase transition-colors cursor-pointer whitespace-nowrap pb-1 border-b-2 ${
                activeTab === 'contatti'
                  ? 'text-slate-900 border-slate-900 font-semibold'
                  : 'text-slate-500 border-transparent hover:text-slate-800'
              }`}
            >
              Contatti
            </button>
          </nav>
        </div>

        {/* Mobile dropdown navigation */}
        {mobileMenuOpen && (
          <div className="sm:hidden bg-white border-b border-[#E8E3DA] px-4 py-3 space-y-2 animate-in slide-in-from-top-2 duration-200">
            <button
              onClick={() => { setActiveTab('home'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium uppercase tracking-wider ${
                activeTab === 'home' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-600'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => { setActiveTab('filosofia'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium uppercase tracking-wider ${
                activeTab === 'filosofia' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-600'
              }`}
            >
              Chi sono
            </button>
            <button
              onClick={() => { setActiveTab('competenze'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium uppercase tracking-wider ${
                activeTab === 'competenze' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-600'
              }`}
            >
              Competenze
            </button>
            <button
              onClick={() => { setActiveTab('ispirazioni'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium uppercase tracking-wider ${
                activeTab === 'ispirazioni' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-600'
              }`}
            >
              Ispirazioni
            </button>
            {user && (
              <button
                onClick={() => { setActiveTab('gallery'); setMobileMenuOpen(false); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium uppercase tracking-wider ${
                  activeTab === 'gallery' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-600'
                }`}
              >
                Gallery DB ({filesList.length})
              </button>
            )}
            <button
              onClick={() => { setActiveTab('contatti'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium uppercase tracking-wider ${
                activeTab === 'contatti' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-600'
              }`}
            >
              Contatti
            </button>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col w-full max-w-5xl mx-auto px-4 sm:px-8 py-10 sm:py-14 bg-[#FAF8F5]">
            {/* SEZIONE 1: HOME (LANDING PAGE COMPLETA) */}
            {activeTab === 'home' && (
              <div className="w-full flex flex-col space-y-16 sm:space-y-24 animate-in fade-in duration-300">
                {/* 1. SEZIONE INIZIALE (TESTATA HERO) */}
                <section className="text-center max-w-3xl mx-auto pt-4 sm:pt-8 space-y-6">
                  <div className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.25em] text-slate-500 uppercase">
                    <MapPin className="w-3 h-3 text-amber-700" />
                    <span>Terrasini (PA) • Architettura & Interior Design</span>
                  </div>

                  <h1 className="text-3xl sm:text-5xl font-light text-slate-900 tracking-tight leading-[1.15] font-serif">
                    Progettare spazi che raccontano <span className="italic font-normal">chi li abita</span>.
                  </h1>

                  <p className="text-xs sm:text-sm font-medium tracking-wider text-amber-900 uppercase">
                    Denisa Purpura | Architettura e interior design a Terrasini.
                  </p>

                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto font-normal">
                    L'architettura dà forma al nostro modo di vivere gli spazi. La luce, i materiali e la distribuzione degli ambienti influenzano i gesti di ogni giorno e il benessere di chi li abita. Il mio approccio parte dall'ascolto: comprendere abitudini, desideri ed esigenze per trovare un equilibrio tra bellezza e funzionalità.
                  </p>

                  <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs font-medium tracking-wider">
                    <a
                      href="#contatta-lo-studio"
                      onClick={(e) => {
                        e.preventDefault();
                        const el = document.getElementById('contatta-lo-studio');
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-none transition-all cursor-pointer shadow-xs uppercase tracking-widest text-[11px] relative z-10 pointer-events-auto"
                    >
                      <span>Parliamo del tuo spazio</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => setActiveTab('filosofia')}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-transparent hover:bg-slate-100/60 text-slate-900 border border-slate-300 rounded-none transition-all cursor-pointer uppercase tracking-widest text-[11px]"
                    >
                      <span>Scopri il mio approccio</span>
                    </button>
                  </div>
                </section>

                {/* 2. GRANDE IMMAGINE DI APERTURA: SOGGIORNO */}
                <section className="w-full">
                  <div 
                    className="relative group overflow-hidden border border-[#E2DAD0] bg-white cursor-pointer shadow-sm"
                    onClick={() => setActiveImagePreview({
                      url: '/assets/aistudio/7c368a51-ec83-4cb0-86f5-d9072b379598_6017b8d4.jpeg',
                      title: 'Ispirazioni d\'interni',
                      subtitle: 'Atmosfere e complementi d\'arredo',
                      details: 'Spazio giorno caratterizzato da camino in pietra naturale, grandi aperture sul paesaggio e arredi caldi e materici.'
                    })}
                  >
                    <div className="relative aspect-[16/10] sm:aspect-[21/10] w-full overflow-hidden">
                      <img
                        src="/assets/aistudio/7c368a51-ec83-4cb0-86f5-d9072b379598_6017b8d4.jpeg"
                        alt="Ispirazioni d'interni"
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent opacity-90 group-hover:opacity-95 transition-opacity" />
                      
                      <div className="absolute top-4 right-4 bg-white/50 hover:bg-white/80 backdrop-blur-md p-2 text-slate-900 transition-colors z-10">
                        <Maximize2 className="w-4 h-4" />
                      </div>

                      <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 text-white bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-transparent pt-16">
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                          <div className="space-y-1.5 max-w-xl">
                            <span className="text-[10px] sm:text-xs font-semibold tracking-[0.2em] text-slate-200 uppercase">
                              Atmosfere e complementi d'arredo
                            </span>
                            <h2 className="text-xl sm:text-2xl md:text-3xl font-light tracking-tight font-serif italic">
                              Ispirazioni d'interni
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-100 font-normal leading-relaxed line-clamp-2">
                              Equilibrio tra volumi architettonici, materiali caldi e vista sul verde.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 3. BLOCCO "Spazi pensati per chi li vive" & FILOSOFIA */}
                <section className="w-full max-w-3xl mx-auto text-center space-y-6 bg-white border border-[#E8E3DA] p-8 sm:p-12 shadow-2xs">
                  <span className="text-xs font-semibold tracking-[0.2em] text-amber-800 uppercase">
                    Spazi pensati per chi li vive
                  </span>
                  <p className="text-sm sm:text-base text-slate-700 leading-relaxed max-w-xl mx-auto">
                    Ogni ambiente ha possibilità da esplorare. Progettare significa metterle in relazione con le persone: rendere gli spazi più funzionali, valorizzare la luce e scegliere materiali e arredi coerenti con l'identità di chi li abita.
                  </p>
                  <blockquote className="text-xl sm:text-2xl font-light text-slate-900 font-serif italic leading-relaxed pt-2">
                    «Non progetto semplicemente ambienti. Progetto il modo in cui vengono vissuti.»
                  </blockquote>
                  <div className="pt-2">
                    <button
                      onClick={() => setActiveTab('filosofia')}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-900 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      <span>Approfondisci chi sono</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </section>

                {/* 4. COMPETENZE E SERVIZI */}
                <section className="w-full space-y-10">
                  <div className="text-center max-w-xl mx-auto space-y-2">
                    <span className="text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase">
                      Campi di Intervento
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-light text-slate-900 tracking-tight font-serif">
                      Competenze e Servizi
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    <div className="bg-white border border-[#E8E3DA] p-6 space-y-3 shadow-2xs">
                      <div className="w-8 h-8 rounded-full bg-[#FAF8F5] flex items-center justify-center text-slate-800 font-serif text-sm font-bold border border-[#E2DAD0]">01</div>
                      <h3 className="text-base font-semibold text-slate-900">Progettazione architettonica</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Studi preliminari, consulenza e supporto per interventi edilizi residenziali e commerciali.
                      </p>
                    </div>

                    <div className="bg-white border border-[#E8E3DA] p-6 space-y-3 shadow-2xs">
                      <div className="w-8 h-8 rounded-full bg-[#FAF8F5] flex items-center justify-center text-slate-800 font-serif text-sm font-bold border border-[#E2DAD0]">02</div>
                      <h3 className="text-base font-semibold text-slate-900">Interior design e distribuzione degli spazi</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Studio della distribuzione interna e ottimizzazione degli ambienti per valorizzare la vivibilità quotidiana.
                      </p>
                    </div>

                    <div className="bg-white border border-[#E8E3DA] p-6 space-y-3 shadow-2xs">
                      <div className="w-8 h-8 rounded-full bg-[#FAF8F5] flex items-center justify-center text-slate-800 font-serif text-sm font-bold border border-[#E2DAD0]">03</div>
                      <h3 className="text-base font-semibold text-slate-900">Scelta di materiali e finiture</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Consulenza nella scelta degli abbinamenti cromatici e materici per definire l'identità visiva degli spazi.
                      </p>
                    </div>

                    <div className="bg-white border border-[#E8E3DA] p-6 space-y-3 shadow-2xs">
                      <div className="w-8 h-8 rounded-full bg-[#FAF8F5] flex items-center justify-center text-slate-800 font-serif text-sm font-bold border border-[#E2DAD0]">04</div>
                      <h3 className="text-base font-semibold text-slate-900">Arredi e illuminazione</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Supporto nella selezione degli arredi e dell'illuminazione per creare atmosfere accoglienti.
                      </p>
                    </div>

                    <div className="bg-white border border-[#E8E3DA] p-6 space-y-3 shadow-2xs sm:col-span-2 md:col-span-2">
                      <div className="w-8 h-8 rounded-full bg-[#FAF8F5] flex items-center justify-center text-slate-800 font-serif text-sm font-bold border border-[#E2DAD0]">05</div>
                      <h3 className="text-base font-semibold text-slate-900">Coordinamento estetico complessivo</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Accompagnamento nelle scelte estetiche e nella coerenza d'insieme del progetto d'interni.
                      </p>
                    </div>
                  </div>
                </section>

                {/* 5. GALLERIA "Ispirazioni d'interni" CON LE FOTO ALLEGATE */}
                <section className="w-full space-y-8">
                  <div className="text-center max-w-xl mx-auto space-y-2">
                    <span className="text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase">
                      Galleria
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-light text-slate-900 tracking-tight font-serif">
                      Ispirazioni d'interni
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
                      Immagini generate con IA a scopo illustrativo e di ispirazione. Non rappresentano progetti realizzati.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {/* Cucina */}
                    <div 
                      className="group bg-white border border-[#E8E3DA] overflow-hidden cursor-pointer shadow-2xs hover:shadow-md transition-all"
                      onClick={() => setActiveImagePreview({
                        url: '/assets/aistudio/cc64414d-fb20-49b7-907b-30fc29784afb_c9f535aa.jpeg',
                        title: 'Spazio conviviale',
                        subtitle: 'Materiali naturali e superfici lineari per la zona giorno.',
                        details: 'Isola in pietra, penisola e legni caldi.'
                      })}
                    >
                      <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100 relative">
                        <img
                          src="/assets/aistudio/cc64414d-fb20-49b7-907b-30fc29784afb_c9f535aa.jpeg"
                          alt="Spazio conviviale"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-4 space-y-1">
                        <h3 className="font-medium text-slate-900 text-sm">Spazio conviviale</h3>
                        <p className="text-[11px] text-slate-500">Materiali naturali e superfici lineari per la zona giorno.</p>
                      </div>
                    </div>

                    {/* Libreria */}
                    <div 
                      className="group bg-white border border-[#E8E3DA] overflow-hidden cursor-pointer shadow-2xs hover:shadow-md transition-all"
                      onClick={() => setActiveImagePreview({
                        url: '/assets/aistudio/0851771c-6df8-447c-97f8-6505841e10e1_26ee291e.jpeg',
                        title: 'Geometrie d\'arredo',
                        subtitle: 'Volumi essenziali e ordine visivo nello spazio living.',
                        details: 'Libreria con oggetti scultorei e volumi.'
                      })}
                    >
                      <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100 relative">
                        <img
                          src="/assets/aistudio/0851771c-6df8-447c-97f8-6505841e10e1_26ee291e.jpeg"
                          alt="Geometrie d'arredo"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-4 space-y-1">
                        <h3 className="font-medium text-slate-900 text-sm">Geometrie d'arredo</h3>
                        <p className="text-[11px] text-slate-500">Volumi essenziali e ordine visivo nello spazio living.</p>
                      </div>
                    </div>

                    {/* Poltrone 1 */}
                    <div 
                      className="group bg-white border border-[#E8E3DA] overflow-hidden cursor-pointer shadow-2xs hover:shadow-md transition-all"
                      onClick={() => setActiveImagePreview({
                        url: '/assets/aistudio/5ea18a79-ec20-424d-ba8d-0b0168b8f5b2_f7e88543.jpeg',
                        title: 'Angolo di lettura',
                        subtitle: 'Atmosfere soffuse e comfort quotidiano.',
                        details: 'Sedute confortevoli e illuminazione soffusa.'
                      })}
                    >
                      <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100 relative">
                        <img
                          src="/assets/aistudio/5ea18a79-ec20-424d-ba8d-0b0168b8f5b2_f7e88543.jpeg"
                          alt="Angolo di lettura"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-4 space-y-1">
                        <h3 className="font-medium text-slate-900 text-sm">Angolo di lettura</h3>
                        <p className="text-[11px] text-slate-500">Atmosfere soffuse e comfort quotidiano.</p>
                      </div>
                    </div>

                    {/* Poltrone 2 */}
                    <div 
                      className="group bg-white border border-[#E8E3DA] overflow-hidden cursor-pointer shadow-2xs hover:shadow-md transition-all"
                      onClick={() => setActiveImagePreview({
                        url: '/assets/aistudio/42e6a126-5dc0-4751-bb73-da31528c910a_9d524163.jpeg',
                        title: 'Luce e materia',
                        subtitle: 'Accostamenti cromatici caldi e punti luce calibrati.',
                        details: 'Poltrona e lampada d\'atmosfera.'
                      })}
                    >
                      <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100 relative">
                        <img
                          src="/assets/aistudio/42e6a126-5dc0-4751-bb73-da31528c910a_9d524163.jpeg"
                          alt="Luce e materia"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-4 space-y-1">
                        <h3 className="font-medium text-slate-900 text-sm">Luce e materia</h3>
                        <p className="text-[11px] text-slate-500">Accostamenti cromatici caldi e punti luce calibrati.</p>
                      </div>
                    </div>

                    {/* Ingresso */}
                    <div 
                      className="group bg-white border border-[#E8E3DA] overflow-hidden cursor-pointer shadow-2xs hover:shadow-md transition-all sm:col-span-2 md:col-span-2"
                      onClick={() => setActiveImagePreview({
                        url: '/assets/aistudio/3d6ec04a-3bfc-4772-aad1-8e193c851dc6_4d9f8f5d.jpeg',
                        title: 'Prospettive continue',
                        subtitle: 'Varcare gli spazi con fluidità e continuità materica.',
                        details: 'Varcare gli spazi con continuità visiva e materiali naturali.'
                      })}
                    >
                      <div className="aspect-[16/9] w-full overflow-hidden bg-slate-100 relative">
                        <img
                          src="/assets/aistudio/3d6ec04a-3bfc-4772-aad1-8e193c851dc6_4d9f8f5d.jpeg"
                          alt="Prospettive continue"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-4 space-y-1">
                        <h3 className="font-medium text-slate-900 text-sm">Prospettive continue</h3>
                        <p className="text-[11px] text-slate-500">Varcare gli spazi con fluidità e continuità materica.</p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 6. CONTATTI SULLA HOME */}
                <section id="contatta-lo-studio" className="bg-white border border-[#E8E3DA] p-8 sm:p-12 text-center space-y-6 scroll-mt-24">
                  <span className="text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase">
                    Contatta lo Studio
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-light text-slate-900 font-serif">
                    Denisa Purpura • Architetto a Terrasini (PA)
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
                    Disponibile per consulenze, progettazione e interior design. Contattami direttamente per discutere del tuo prossimo spazio.
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-6 pt-2 text-xs sm:text-sm">
                    <a 
                      href="tel:+393294922664" 
                      className="flex items-center gap-2 px-4 py-2.5 bg-[#FAF8F5] border border-[#E2DAD0] hover:bg-slate-50 text-slate-800 font-medium transition-colors"
                    >
                      <Phone className="w-4 h-4 text-slate-700" />
                      <span>+39 329 492 2664</span>
                    </a>
                    <a 
                      href="mailto:denieangi@hotmail.it" 
                      className="flex items-center gap-2 px-4 py-2.5 bg-[#FAF8F5] border border-[#E2DAD0] hover:bg-slate-50 text-slate-800 font-medium transition-colors"
                    >
                      <Mail className="w-4 h-4 text-slate-700" />
                      <span>denieangi@hotmail.it</span>
                    </a>
                    <a 
                      href="https://instagram.com/denisa_purpura" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center gap-2 px-4 py-2.5 bg-[#FAF8F5] border border-[#E2DAD0] hover:bg-slate-50 text-slate-800 font-medium transition-colors"
                    >
                      <Instagram className="w-4 h-4 text-slate-700" />
                      <span>@denisa_purpura</span>
                    </a>
                  </div>
                </section>
              </div>
            )}

            {/* SEZIONE 2: FILOSOFIA & CHI SONO */}
            {activeTab === 'filosofia' && (
              <div className="w-full bg-white border border-[#E8E3DA] p-8 sm:p-12 space-y-8 animate-in fade-in duration-200">
                <div className="border-b border-slate-100 pb-6 space-y-1">
                  <span className="text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase">
                    Denisa Purpura • Terrasini (PA)
                  </span>
                  <h1 className="text-3xl sm:text-4xl font-light text-slate-900 font-serif">
                    Chi sono
                  </h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                  <div className="md:col-span-5">
                    <div className="rounded-xl overflow-hidden border border-[#E2DAD0] bg-[#FAF8F5] p-2 shadow-2xs">
                      <img
                        src="/assets/aistudio/9a4fe42f-8b31-45d6-b678-67aa021189d7_b577db3b.jpeg"
                        alt="Denisa Purpura Architetto"
                        className="w-full h-auto object-cover rounded-lg shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-7 space-y-6 text-slate-700 text-sm sm:text-base leading-relaxed">
                    <div className="space-y-3">
                      <p className="font-medium text-slate-900 text-base sm:text-lg">
                        Mi chiamo Denisa e credo che il progetto più bello non sia quello che lascia tutti a bocca aperta.
                      </p>
                      <p className="italic font-serif text-slate-900 text-base sm:text-lg">
                        È quello in cui qualcuno entra e pensa: <span className="font-semibold not-italic">«Ecco, questo posto parla di me»</span>.
                      </p>
                    </div>

                    <p className="text-slate-600">
                      Il mio approccio all’architettura e all’interior design nasce da qui: dall’ascolto delle persone, dalla ricerca dell’equilibrio tra estetica e funzionalità, dalla cura di quei dettagli che sembrano piccoli ma cambiano il modo di vivere uno spazio.
                    </p>

                    <div className="py-3 px-4 bg-[#FAF8F5] border-l-2 border-slate-900 space-y-2 text-slate-800">
                      <p className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-900"></span>
                        <span>La luce che accompagna un risveglio.</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-900"></span>
                        <span>Un materiale che invita a essere toccato.</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-900"></span>
                        <span>Un ambiente che finalmente trova il suo equilibrio.</span>
                      </p>
                    </div>

                    <p className="text-slate-600">
                      Per me, progettare significa trasformare idee in luoghi da abitare, emozioni in atmosfere, esigenze in soluzioni concrete.
                    </p>

                    <div className="pt-2 border-t border-slate-100">
                      <p className="font-semibold text-slate-900 font-serif tracking-wide">
                        È questa la visione che voglio portare avanti con DENISA – Architettura e arredamento di interni.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SEZIONE 3: COMPETENZE */}
            {activeTab === 'competenze' && (
              <div className="w-full space-y-8 animate-in fade-in duration-200">
                <div className="border-b border-slate-200 pb-6 space-y-1">
                  <span className="text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase">
                    Servizi & Metodo
                  </span>
                  <h1 className="text-3xl font-light text-slate-900 font-serif">
                    Competenze e Approccio Progettuale
                  </h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white border border-[#E8E3DA] p-6 sm:p-8 space-y-3">
                    <span className="text-xs font-mono font-semibold text-slate-400">01</span>
                    <h3 className="text-lg font-medium text-slate-900">Progettazione Architettonica</h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      Studi preliminari, consulenza e supporto per interventi edilizi residenziali e commerciali.
                    </p>
                  </div>

                  <div className="bg-white border border-[#E8E3DA] p-6 sm:p-8 space-y-3">
                    <span className="text-xs font-mono font-semibold text-slate-400">02</span>
                    <h3 className="text-lg font-medium text-slate-900">Interior Design & Distribuzione</h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      Studio della distribuzione interna e ottimizzazione degli ambienti per valorizzare la vivibilità quotidiana.
                    </p>
                  </div>

                  <div className="bg-white border border-[#E8E3DA] p-6 sm:p-8 space-y-3">
                    <span className="text-xs font-mono font-semibold text-slate-400">03</span>
                    <h3 className="text-lg font-medium text-slate-900">Scelta di Materiali e Finiture</h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      Consulenza nella scelta degli abbinamenti cromatici e materici per definire l'identità visiva degli spazi.
                    </p>
                  </div>

                  <div className="bg-white border border-[#E8E3DA] p-6 sm:p-8 space-y-3">
                    <span className="text-xs font-mono font-semibold text-slate-400">04</span>
                    <h3 className="text-lg font-medium text-slate-900">Arredi e Illuminazione</h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      Supporto nella selezione degli arredi e dell'illuminazione per creare atmosfere accoglienti.
                    </p>
                  </div>

                  <div className="bg-white border border-[#E8E3DA] p-6 sm:p-8 space-y-3 md:col-span-2">
                    <span className="text-xs font-mono font-semibold text-slate-400">05</span>
                    <h3 className="text-lg font-medium text-slate-900">Coordinamento Estetico Complessivo</h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      Accompagnamento nelle scelte estetiche e nella coerenza d'insieme del progetto d'interni.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* SEZIONE 4: ISPIRAZIONI (Galleria Illustrativa) */}
            {activeTab === 'ispirazioni' && (
              <div className="w-full space-y-8 animate-in fade-in duration-200">
                <div className="border-b border-slate-200 pb-6 space-y-2">
                  <span className="text-xs font-semibold tracking-[0.2em] text-amber-800 uppercase">
                    Galleria di Ricerca & Atmosfere
                  </span>
                  <h1 className="text-3xl font-light text-slate-900 font-serif">
                    Ispirazioni d'interni
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
                    Immagini generate con IA a scopo illustrativo e di ispirazione. Non rappresentano progetti realizzati.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Soggiorno con divano chiaro e aperture ad arco */}
                  <div 
                    className="group bg-white border border-[#E8E3DA] overflow-hidden cursor-pointer shadow-2xs hover:shadow-md transition-all"
                    onClick={() => setActiveImagePreview({
                      url: '/assets/aistudio/architecture_living_minimalist_1793025374553.jpg',
                      title: 'Luce mediterranea',
                      subtitle: 'Archi e toni caldi incorniciano uno spazio dedicato al relax.',
                      details: 'Aperture ad arco e intonaci per una zona giorno calda e luminosa.'
                    })}
                  >
                    <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100 relative">
                      <img
                        src="/assets/aistudio/architecture_living_minimalist_1793025374553.jpg"
                        alt="Luce mediterranea"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-4 space-y-1">
                      <h3 className="font-medium text-slate-900 text-sm">Luce mediterranea</h3>
                      <p className="text-[11px] text-slate-500">Archi e toni caldi incorniciano uno spazio dedicato al relax.</p>
                    </div>
                  </div>

                  {/* Cucina con isola scanalata e tavolo tondo */}
                  <div 
                    className="group bg-white border border-[#E8E3DA] overflow-hidden cursor-pointer shadow-2xs hover:shadow-md transition-all"
                    onClick={() => setActiveImagePreview({
                      url: '/assets/aistudio/architecture_kitchen_arch_1793025374686.jpg',
                      title: 'Armonia quotidiana',
                      subtitle: 'Cucina e zona pranzo dialogano in un ambiente luminoso e accogliente.',
                      details: 'Isola e armadiature in essenza di legno.'
                    })}
                  >
                    <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100 relative">
                      <img
                        src="/assets/aistudio/architecture_kitchen_arch_1793025374686.jpg"
                        alt="Armonia quotidiana"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-4 space-y-1">
                      <h3 className="font-medium text-slate-900 text-sm">Armonia quotidiana</h3>
                      <p className="text-[11px] text-slate-500">Cucina e zona pranzo dialogano in un ambiente luminoso e accogliente.</p>
                    </div>
                  </div>

                  {/* Camera da letto con grande finestra ad arco */}
                  <div 
                    className="group bg-white border border-[#E8E3DA] overflow-hidden cursor-pointer shadow-2xs hover:shadow-md transition-all"
                    onClick={() => setActiveImagePreview({
                      url: '/assets/aistudio/architecture_bedroom_sanctuary_1793025375632.jpg',
                      title: 'Quiete e luce',
                      subtitle: 'Colori tenui e luce naturale accompagnano l\'atmosfera del riposo.',
                      details: 'Santuario notturno con pareti e illuminazione diffusa.'
                    })}
                  >
                    <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100 relative">
                      <img
                        src="/assets/aistudio/architecture_bedroom_sanctuary_1793025375632.jpg"
                        alt="Quiete e luce"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-4 space-y-1">
                      <h3 className="font-medium text-slate-900 text-sm">Quiete e luce</h3>
                      <p className="text-[11px] text-slate-500">Colori tenui e luce naturale accompagnano l'atmosfera del riposo.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SEZIONE GALLERY DB (Firebase Stored Files - Solo Area Riservata) */}
            {activeTab === 'gallery' && user && (
              <div className="w-full space-y-8 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
                  <div>
                    <h1 className="text-3xl font-light text-slate-900 font-serif flex items-center gap-2">
                      <ImageIcon className="w-7 h-7 text-slate-700" />
                      <span>Gallery Database Firebase</span>
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                      Immagini archiviate ({filesList.length}). Clicca "Copia URL" per riutilizzarle.
                    </p>
                  </div>
                </div>

                {filesList.length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-slate-300 rounded-2xl bg-white">
                    <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-700 font-medium text-sm">Nessuna immagine nel database Firebase.</p>
                    <p className="text-slate-400 text-xs mt-1 mb-4">Utilizza il pannello CMS per caricare i tuoi scatti.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {filesList.map((file) => {
                      const isItemCopied = copiedId === file.id;
                      return (
                        <div key={file.id} className="bg-white border border-[#E8E3DA] rounded-2xl overflow-hidden shadow-xs flex flex-col">
                          <div 
                            className="h-44 bg-slate-100 relative cursor-pointer group overflow-hidden"
                            onClick={() => setDetailFile(file)}
                          >
                            <img src={file.url} alt={file.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-white text-xs font-medium px-3 py-1.5 bg-black/60 rounded-full flex items-center gap-1.5">
                                <Eye className="w-3.5 h-3.5" />
                                Visualizza
                              </span>
                            </div>
                          </div>
                          <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <p className="font-semibold text-sm text-slate-900 truncate" title={file.name}>{file.name}</p>
                                {user && file.uploadedBy === user.uid && (
                                  <button onClick={() => handleDelete(file.id)} className="text-slate-400 hover:text-red-600 cursor-pointer">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5">{new Date(file.createdAt).toLocaleString()}</p>
                            </div>
                            <input
                              type="text"
                              readOnly
                              value={file.url}
                              onClick={(e) => (e.target as HTMLInputElement).select()}
                              className="w-full bg-[#FAF8F5] border border-[#E2DAD0] rounded-lg px-2 py-1 text-[11px] text-slate-600 font-mono select-all"
                            />
                            <button
                              onClick={() => copyToClipboard(file.url, file.id)}
                              className={`w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                                isItemCopied ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'
                              }`}
                            >
                              {isItemCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{isItemCopied ? '✓ Copiato!' : 'Copia URL'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* SEZIONE 5: CONTATTI */}
            {activeTab === 'contatti' && (
              <div className="w-full space-y-8 animate-in fade-in duration-200">
                <div className="border-b border-slate-200 pb-6 space-y-1">
                  <span className="text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase">
                    Studio di Architettura
                  </span>
                  <h1 className="text-3xl font-light text-slate-900 font-serif">
                    Contatti & Riferimenti
                  </h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Informazioni ufficiali */}
                  <div className="space-y-6">
                    <div className="bg-white border border-[#E8E3DA] p-8 space-y-6 shadow-2xs">
                      <h3 className="font-serif text-xl font-light text-slate-900">Denisa Purpura</h3>
                      
                      <div className="space-y-4 text-sm text-slate-700">
                        <div className="flex items-start gap-3">
                          <div className="p-2.5 bg-[#FAF8F5] border border-[#E2DAD0] text-slate-800 shrink-0">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs text-slate-400 block">Sede dello Studio</span>
                            <span className="font-medium text-slate-900">Terrasini (PA), Sicilia</span>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="p-2.5 bg-[#FAF8F5] border border-[#E2DAD0] text-slate-800 shrink-0">
                            <Phone className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs text-slate-400 block">Telefono diretto</span>
                            <a href="tel:+393294922664" className="font-medium text-slate-900 hover:underline">
                              +39 329 492 2664
                            </a>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="p-2.5 bg-[#FAF8F5] border border-[#E2DAD0] text-slate-800 shrink-0">
                            <Mail className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs text-slate-400 block">Posta Elettronica</span>
                            <a href="mailto:denieangi@hotmail.it" className="font-medium text-slate-900 hover:underline">
                              denieangi@hotmail.it
                            </a>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="p-2.5 bg-[#FAF8F5] border border-[#E2DAD0] text-slate-800 shrink-0">
                            <Instagram className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs text-slate-400 block">Instagram Ufficiale</span>
                            <a href="https://instagram.com/denisa_purpura" target="_blank" rel="noopener noreferrer" className="font-medium text-slate-900 hover:underline">
                              @denisa_purpura
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Form di Contatto */}
                  <div className="bg-white border border-[#E8E3DA] p-8 space-y-6 shadow-2xs">
                    <h3 className="font-serif text-xl font-light text-slate-900">Scrivi un messaggio</h3>

                    {contactSent ? (
                      <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-center gap-2">
                        <Check className="w-5 h-5 text-emerald-600" />
                        <span>Grazie! Il tuo messaggio è stato ricevuto con successo.</span>
                      </div>
                    ) : (
                      <form onSubmit={handleSendContact} className="space-y-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Nome e Cognome</label>
                          <input
                            type="text"
                            required
                            value={contactName}
                            onChange={(e) => setContactName(e.target.value)}
                            placeholder="Il tuo nome"
                            className="w-full bg-[#FAF8F5] border border-[#E2DAD0] rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-slate-900"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Indirizzo Email</label>
                          <input
                            type="email"
                            required
                            value={contactEmail}
                            onChange={(e) => setContactEmail(e.target.value)}
                            placeholder="nome@esempio.it"
                            className="w-full bg-[#FAF8F5] border border-[#E2DAD0] rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-slate-900"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Il tuo messaggio / Progetto</label>
                          <textarea
                            required
                            rows={4}
                            value={contactMessage}
                            onChange={(e) => setContactMessage(e.target.value)}
                            placeholder="Raccontami dello spazio che desideri realizzare..."
                            className="w-full bg-[#FAF8F5] border border-[#E2DAD0] rounded-xl p-3.5 text-sm text-slate-800 focus:outline-slate-900 resize-none"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 text-white rounded-xl text-xs font-medium uppercase tracking-widest hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
                        >
                          <Send className="w-4 h-4" />
                          <span>Invia Richiesta</span>
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            )}
      </main>

      {/* FOOTER */}
      <footer className="w-full bg-[#FAF8F5] border-t border-[#E8E3DA] py-8 px-6 text-center text-xs text-slate-500 space-y-2">
        <p className="font-serif italic text-slate-700">«Spazi che raccontano chi li abita.»</p>
        <p>© {new Date().getFullYear()} Denisa Purpura • Architettura e arredamento di interni • Terrasini (PA)</p>
      </footer>

      {/* Modal / Login Page / CMS */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md p-8 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-800">
                <Shield className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-serif font-light text-slate-900">Area Riservata & CMS</h2>
              <p className="text-slate-500 text-sm mt-1">
                {user ? 'Gestisci il tuo profilo e le immagini' : 'Accesso riservato a Denisa Purpura'}
              </p>
            </div>

            {errorMessage && !user && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
                {errorMessage}
              </div>
            )}

            {user ? (
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-[#FAF8F5] rounded-xl border border-[#E2DAD0]">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 bg-white border border-[#E2DAD0] rounded-full flex items-center justify-center text-slate-700">
                      <UserIcon className="w-6 h-6" />
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <p className="font-semibold text-slate-900 truncate">{user.displayName || 'Denisa Purpura'}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  </div>
                </div>

                {/* CMS Upload Form in modal */}
                <div className="border-t border-slate-200 pt-4 space-y-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">Carica Nuova Immagine</h3>
                  <form onSubmit={handleImageUpload} className="space-y-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
                    />
                    <button
                      type="submit"
                      disabled={!selectedFile || uploading}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-medium uppercase tracking-wider disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploading ? 'Caricamento...' : 'Carica su Firebase'}</span>
                    </button>
                  </form>
                  <button
                    onClick={() => {
                      setIsModalOpen(false);
                      setActiveTab('gallery');
                    }}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-medium cursor-pointer"
                  >
                    Visualizza Gallery DB ({filesList.length})
                  </button>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-medium transition-colors text-sm cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Esci dall'account</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-medium shadow-xs transition-all text-sm disabled:opacity-50 cursor-pointer"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>{loading ? 'Accesso in corso...' : 'Accedi con Gmail (Area Riservata)'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lightbox Preview Modal */}
      {activeImagePreview && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setActiveImagePreview(null)}
        >
          <div 
            className="relative max-w-4xl w-full bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full bg-slate-900 overflow-hidden">
              <img src={activeImagePreview.url} alt={activeImagePreview.title} className="w-full h-full object-cover" />
              <button
                onClick={() => setActiveImagePreview(null)}
                className="absolute top-3 right-3 p-2 bg-white/80 hover:bg-white text-slate-900 backdrop-blur-md transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 sm:p-6 bg-white space-y-2">
              <span className="text-[10px] font-semibold tracking-[0.2em] text-slate-400 uppercase">{activeImagePreview.subtitle}</span>
              <h3 className="text-xl sm:text-2xl font-light text-slate-900 font-serif italic">{activeImagePreview.title}</h3>
              {activeImagePreview.details && (
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">{activeImagePreview.details}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Detail File Modal */}
      {detailFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg p-6 relative">
            <button onClick={() => setDetailFile(null)} className="absolute top-5 right-5 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-serif text-lg font-medium text-slate-900 mb-4">{detailFile.name}</h3>
            <div className="h-56 bg-slate-100 rounded-xl overflow-hidden mb-4 flex items-center justify-center">
              <img src={detailFile.url} alt="" className="max-h-full max-w-full object-contain" />
            </div>
            <textarea
              readOnly
              rows={3}
              value={detailFile.url}
              onClick={(e) => (e.target as HTMLTextAreaElement).select()}
              className="w-full bg-[#FAF8F5] border border-[#E2DAD0] rounded-xl p-3 text-xs text-slate-700 font-mono select-all mb-4 resize-none"
            />
            <button
              onClick={() => copyToClipboard(detailFile.url, detailFile.id)}
              className="w-full py-3 bg-slate-900 text-white rounded-xl text-xs uppercase tracking-widest font-medium cursor-pointer"
            >
              Copia URL Negli Appunti
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
