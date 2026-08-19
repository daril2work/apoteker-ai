import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { Trash2, Upload, FileText, Loader2, Plus, FileUp, Edit2, X, Check } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

// Setup PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface KnowledgeGroup {
  source: string;
  chunkCount: number;
  created_at: string;
}

export default function AdminRAGPage() {
  const [documents, setDocuments] = useState<KnowledgeGroup[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [inputText, setInputText] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');
  const [progress, setProgress] = useState({ visible: false, value: 0, text: '' });
  
  // Edit State
  const [editingSource, setEditingSource] = useState<string | null>(null);
  const [newSourceName, setNewSourceName] = useState('');

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-rag-document`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      const result = await res.json();
      if (result.data) {
        // Group by source
        const grouped: Record<string, KnowledgeGroup> = {};
        result.data.forEach((doc: any) => {
          const src = doc.metadata?.source || 'Manual Input';
          if (!grouped[src]) {
            grouped[src] = {
              source: src,
              chunkCount: 0,
              created_at: doc.created_at
            };
          }
          grouped[src].chunkCount += 1;
        });
        setDocuments(Object.values(grouped));
      }
    } catch (error) {
      console.error("Failed to load RAG docs", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!inputText.trim()) {
      alert('Teks tidak boleh kosong!');
      return;
    }
    
    setIsUploading(true);
    setUploadStatus('Sedang memproses dan chunking dokumen...');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-rag-document`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: inputText,
          metadata: { source: sourceName || 'Manual Input' }
        })
      });

      const result = await res.json();
      if (result.error) throw new Error(result.error);

      setUploadStatus(`Sukses! ${result.chunks_processed} chunks diproses. (-${result.tokens_used} tokens)`);
      setInputText('');
      setSourceName('');
      
      // Reload documents
      loadDocuments();
      
      setTimeout(() => setUploadStatus(''), 5000);
    } catch (error: any) {
      alert(`Gagal memproses dokumen: ${error.message}`);
      setUploadStatus('');
    } finally {
      setIsUploading(false);
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      alert('Tolong unggah file PDF!');
      return;
    }

    setUploadStatus('');
    setIsUploading(true);
    setProgress({ visible: true, value: 0, text: 'Membaca file PDF...' });

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        setProgress({ visible: true, value: Math.round((i / pdf.numPages) * 100), text: `Mengekstrak halaman ${i} dari ${pdf.numPages}...` });
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n\n';
      }

      setInputText(fullText);
      if (!sourceName) setSourceName(file.name);
      setUploadStatus('Teks PDF berhasil diekstrak! Silakan periksa, edit jika perlu, lalu klik Proses & Masukkan ke Vector DB.');
    } catch (error: any) {
      alert(`Gagal membaca PDF: ${error.message}`);
      setUploadStatus('');
    } finally {
      setIsUploading(false);
      setProgress({ visible: false, value: 0, text: '' });
      // Reset input file
      if (e.target) e.target.value = '';
    }
  };

  const handleDelete = async (source: string) => {
    if (!confirm(`Anda yakin ingin menghapus seluruh dokumen "${source}"?`)) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const encodedSource = encodeURIComponent(source);
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-rag-document?source=${encodedSource}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });

      const result = await res.json();
      if (result.error) throw new Error(result.error);

      setDocuments(docs => docs.filter(d => d.source !== source));
    } catch (error: any) {
      alert(`Gagal menghapus: ${error.message}`);
    }
  };

  const handleEdit = async (oldSource: string) => {
    if (!newSourceName.trim() || newSourceName === oldSource) {
      setEditingSource(null);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-rag-document`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ oldSource, newSource: newSourceName.trim() })
      });

      const result = await res.json();
      if (result.error) throw new Error(result.error);

      // Update local state
      setDocuments(docs => docs.map(d => {
        if (d.source === oldSource) {
          return { ...d, source: newSourceName.trim() };
        }
        return d;
      }));
      setEditingSource(null);
    } catch (error: any) {
      alert(`Gagal merubah judul: ${error.message}`);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '2rem' }}>Knowledge Base Management (RAG)</h1>

      {/* Upload Section */}
      <div style={{ 
        backgroundColor: 'var(--card-bg)', 
        padding: '1.5rem', 
        borderRadius: '16px', 
        border: '1px solid var(--border-color)',
        marginBottom: '2rem'
      }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={20} /> Tambah Data Knowledge Baru
        </h2>
        
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Sumber Referensi (Opsional)</label>
          <input 
            type="text" 
            placeholder="Misal: Jurnal Medis Vol 2, Panduan Kemenkes 2024"
            value={sourceName}
            onChange={e => setSourceName(e.target.value)}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ fontWeight: '500' }}>Teks Dokumen</label>
            <div>
              <input 
                type="file" 
                accept="application/pdf"
                id="pdf-upload"
                style={{ display: 'none' }}
                onChange={handlePdfUpload}
                disabled={isUploading}
              />
              <label 
                htmlFor="pdf-upload"
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '6px', 
                  fontSize: '0.9rem', color: 'var(--primary)', cursor: isUploading ? 'not-allowed' : 'pointer',
                  padding: '4px 8px', backgroundColor: 'var(--primary-light, #e0e7ff)', borderRadius: '6px'
                }}
              >
                {isUploading && progress.visible ? <Loader2 size={16} className="animate-spin" /> : <FileUp size={16} />} 
                Ekstrak dari PDF
              </label>
            </div>
          </div>
          
          {/* Progress Bar UI */}
          {progress.visible && (
            <div style={{ marginBottom: '12px', backgroundColor: 'var(--bg-color)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-light)' }}>
                <span>{progress.text}</span>
                <span>{progress.value}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${progress.value}%`, height: '100%', backgroundColor: 'var(--primary)', transition: 'width 0.2s ease-in-out' }}></div>
              </div>
            </div>
          )}

          <textarea 
            placeholder="Masukkan teks dari buku panduan, jurnal, atau referensi obat... Atau klik tombol Ekstrak dari PDF di atas."
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            rows={8}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', resize: 'vertical' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            onClick={handleUpload}
            disabled={isUploading}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: isUploading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: isUploading ? 0.7 : 1
            }}
          >
            {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
            {isUploading ? 'Memproses...' : 'Proses & Masukkan ke Vector DB'}
          </button>
          {uploadStatus && <span style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>{uploadStatus}</span>}
        </div>
      </div>

      {/* Documents List */}
      <div style={{ 
        backgroundColor: 'var(--card-bg)', 
        borderRadius: '16px', 
        border: '1px solid var(--border-color)',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Daftar Dokumen di Database</h2>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-light)', backgroundColor: 'var(--bg-color)', padding: '4px 12px', borderRadius: '20px' }}>
            Total: {documents.length} Chunks
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-light)' }}>
            <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 1rem' }} />
            <p>Memuat dokumen...</p>
          </div>
        ) : documents.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-light)' }}>
            <FileText size={48} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
            <p>Belum ada data knowledge base.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-color)' }}>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>Sumber Dokumen</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>Total Chunk</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>Tgl Dibuat</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.source} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem', color: 'var(--text-color)', fontWeight: '500' }}>
                      {editingSource === doc.source ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input 
                            type="text" 
                            value={newSourceName} 
                            onChange={e => setNewSourceName(e.target.value)}
                            style={{ padding: '6px', borderRadius: '4px', border: '1px solid var(--primary)', width: '100%' }}
                            autoFocus
                          />
                          <button onClick={() => handleEdit(doc.source)} style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer' }}><Check size={18} /></button>
                          <button onClick={() => setEditingSource(null)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><X size={18} /></button>
                        </div>
                      ) : (
                        doc.source
                      )}
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-light)' }}>
                      {doc.chunkCount} potongan teks
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-light)', fontSize: '0.9rem' }}>
                      {new Date(doc.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => { setEditingSource(doc.source); setNewSourceName(doc.source); }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#3b82f6',
                            cursor: 'pointer',
                            padding: '8px',
                            borderRadius: '8px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#3b82f610'
                          }}
                          title="Edit Judul"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(doc.source)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            padding: '8px',
                            borderRadius: '8px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#ef444410'
                          }}
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
