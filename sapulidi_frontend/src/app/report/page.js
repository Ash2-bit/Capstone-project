'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { publicApi } from '../../lib/api';
import ReportMap from '../../components/ReportMap';
import { ShieldAlert, AlertTriangle, ArrowLeft, Camera, CheckCircle2, Info, MapPin } from 'lucide-react';

export default function ReportPage() {
  const router = useRouter();
  const [provinces, setProvinces] = useState([]);
  const [loadingProvinces, setLoadingProvinces] = useState(true);

  // Form States
  const [provinceId, setProvinceId] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  const [reporterAddress, setReporterAddress] = useState('');
  const [category, setCategory] = useState('building_damage');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [description, setDescription] = useState('');
  const [fatalities, setFatalities] = useState(0);
  const [injured, setInjured] = useState(0);
  const [missing, setMissing] = useState(0);
  const [evacuees, setEvacuees] = useState(0);
  const [photos, setPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);

  // UI Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Load provinces list for dropdown
  useEffect(() => {
    async function loadProvinces() {
      try {
        const res = await publicApi.getHomeStats();
        if (res.success) {
          setProvinces(res.data.provinces || []);
        }
      } catch (err) {
        console.error('Gagal memuat provinsi:', err);
      } finally {
        setLoadingProvinces(false);
      }
    }
    loadProvinces();
  }, []);

  const handleLocationSelect = (lat, lng) => {
    setLatitude(lat.toFixed(8));
    setLongitude(lng.toFixed(8));
  };

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    if (photos.length + files.length > 10) {
      setAlert({ type: 'error', message: 'Maksimal unggah 10 foto.' });
      return;
    }

    setPhotos(prev => [...prev, ...files]);

    // Create file object URL previews
    const previews = files.map(file => URL.createObjectURL(file));
    setPhotoPreviews(prev => [...prev, ...previews]);
    setAlert({ type: '', message: '' });
  };

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    // Clean up memory
    URL.revokeObjectURL(photoPreviews[index]);
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert({ type: '', message: '' });

    // Validate inputs
    if (!provinceId) return setAlert({ type: 'error', message: 'Harap pilih provinsi.' });
    if (!reporterName) return setAlert({ type: 'error', message: 'Nama pelapor wajib diisi.' });
    if (!latitude || !longitude) return setAlert({ type: 'error', message: 'Koordinat lokasi bencana (latitude & longitude) wajib diisi.' });
    if (photos.length === 0) return setAlert({ type: 'error', message: 'Minimal satu foto harus diunggah untuk inferensi kerusakan.' });

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('province_id', provinceId);
      formData.append('reporter_name', reporterName);
      formData.append('reporter_phone', reporterPhone);
      formData.append('reporter_address', reporterAddress);
      formData.append('category', category);
      formData.append('latitude', latitude);
      formData.append('longitude', longitude);
      formData.append('description', description);
      formData.append('fatalities', fatalities.toString());
      formData.append('injured', injured.toString());
      formData.append('missing', missing.toString());
      formData.append('evacuees', evacuees.toString());

      photos.forEach(photo => {
        formData.append('photos', photo);
      });

      const res = await publicApi.submitReport(formData);

      if (res.success) {
        setAlert({
          type: 'success',
          message: res.message,
        });

        // Reset form
        setProvinceId('');
        setReporterName('');
        setReporterPhone('');
        setReporterAddress('');
        setCategory('building_damage');
        setLatitude('');
        setLongitude('');
        setDescription('');
        setFatalities(0);
        setInjured(0);
        setMissing(0);
        setEvacuees(0);
        setPhotos([]);
        setPhotoPreviews([]);

        // Scroll to top to see success alert
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error) {
      setAlert({ type: 'error', message: error.message || 'Terjadi kesalahan sistem saat mengirim laporan.' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#0b1329]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="bg-slate-800/80 hover:bg-slate-700/80 p-2 rounded-lg text-slate-300 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-blue-500" />
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white to-blue-400 bg-clip-text text-transparent">
                FORM PELAPORAN BENCANA
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-5xl mx-auto px-4 py-8 flex-grow w-full">
        {/* Alerts */}
        {alert.message && (
          <div className={`p-4 rounded-xl mb-6 border flex gap-3 items-start ${
            alert.type === 'success' 
              ? 'bg-green-950/40 border-green-800 text-green-300' 
              : 'bg-red-950/40 border-red-800 text-red-300'
          }`}>
            {alert.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
            <span className="text-sm font-semibold">{alert.message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Columns (Form Inputs) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Section 1: Pelapor */}
            <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl space-y-4">
              <h3 className="text-sm font-extrabold text-blue-400 uppercase tracking-widest border-b border-slate-850 pb-2 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Informasi Pelapor
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="reporter_name" className="text-xs font-bold text-slate-400 block mb-1">Nama Pelapor *</label>
                  <input
                    type="text"
                    id="reporter_name"
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                    placeholder="Contoh: Budi Santoso"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="reporter_phone" className="text-xs font-bold text-slate-400 block mb-1">Nomor Telepon / WhatsApp</label>
                  <input
                    type="text"
                    id="reporter_phone"
                    value={reporterPhone}
                    onChange={(e) => setReporterPhone(e.target.value)}
                    className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                    placeholder="Contoh: 08123456789"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reporter_address" className="text-xs font-bold text-slate-400 block mb-1">Alamat Domisili Pelapor</label>
                <textarea
                  id="reporter_address"
                  rows={2}
                  value={reporterAddress}
                  onChange={(e) => setReporterAddress(e.target.value)}
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                  placeholder="Masukkan alamat lengkap Anda..."
                />
              </div>
            </div>

            {/* Section 2: Kebencanaan */}
            <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl space-y-4">
              <h3 className="text-sm font-extrabold text-blue-400 uppercase tracking-widest border-b border-slate-850 pb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Informasi Kejadian Bencana
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="province" className="text-xs font-bold text-slate-400 block mb-1">Pilih Wilayah Provinsi *</label>
                  <select
                    id="province"
                    value={provinceId}
                    onChange={(e) => setProvinceId(e.target.value)}
                    className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                    required
                  >
                    <option value="" disabled>{loadingProvinces ? 'Memuat...' : 'Pilih Provinsi'}</option>
                    {provinces.map((p) => (
                      <option key={p.id} value={p.id.toString()}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="category" className="text-xs font-bold text-slate-400 block mb-1">Kategori Kerusakan Bencana *</label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                    required
                  >
                    <option value="building_damage">Kerusakan Bangunan / Hunian</option>
                    <option value="infrastructure_damage">Kerusakan Infrastruktur Jalan / Jembatan</option>
                  </select>
                </div>
              </div>

              {/* Coordinates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="latitude" className="text-xs font-bold text-slate-400 block mb-1">Latitude *</label>
                  <input
                    type="number"
                    step="any"
                    id="latitude"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-semibold"
                    placeholder="-6.200000"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="longitude" className="text-xs font-bold text-slate-400 block mb-1">Longitude *</label>
                  <input
                    type="number"
                    step="any"
                    id="longitude"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-semibold"
                    placeholder="106.800000"
                    required
                  />
                </div>
              </div>

              {/* Dynamic Leaflet Selector Map */}
              <div className="h-[300px] w-full rounded-xl overflow-hidden border border-slate-800">
                <div className="bg-slate-950 p-2 text-[10px] text-slate-400 font-semibold flex items-center gap-1.5 border-b border-slate-850">
                  <MapPin className="w-3.5 h-3.5 text-red-500" />
                  Klik pada peta untuk mendeteksi koordinat otomatis
                </div>
                <ReportMap 
                  latitude={latitude ? parseFloat(latitude) : null} 
                  longitude={longitude ? parseFloat(longitude) : null} 
                  onLocationSelect={handleLocationSelect} 
                />
              </div>

              <div>
                <label htmlFor="description" className="text-xs font-bold text-slate-400 block mb-1">Kronologi / Deskripsi Dampak Kejadian</label>
                <textarea
                  id="description"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                  placeholder="Ceritakan kronologi kejadian dan dampak kerusakan secara terperinci..."
                />
              </div>
            </div>
          </div>

          {/* Right Column (Impact statistics & File Upload) */}
          <div className="space-y-6">
            {/* Impact Count Stats */}
            <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl space-y-4">
              <h3 className="text-sm font-extrabold text-blue-400 uppercase tracking-widest border-b border-slate-850 pb-2 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Jumlah Dampak Korban
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="fatalities" className="text-xs font-bold text-slate-400 block mb-1">Korban Meninggal</label>
                  <input
                    type="number"
                    min="0"
                    id="fatalities"
                    value={fatalities}
                    onChange={(e) => setFatalities(parseInt(e.target.value || '0', 10))}
                    className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2 text-xs text-slate-100 font-semibold"
                  />
                </div>
                <div>
                  <label htmlFor="injured" className="text-xs font-bold text-slate-400 block mb-1">Korban Luka-Luka</label>
                  <input
                    type="number"
                    min="0"
                    id="injured"
                    value={injured}
                    onChange={(e) => setInjured(parseInt(e.target.value || '0', 10))}
                    className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2 text-xs text-slate-100 font-semibold"
                  />
                </div>
                <div>
                  <label htmlFor="missing" className="text-xs font-bold text-slate-400 block mb-1">Orang Hilang</label>
                  <input
                    type="number"
                    min="0"
                    id="missing"
                    value={missing}
                    onChange={(e) => setMissing(parseInt(e.target.value || '0', 10))}
                    className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2 text-xs text-slate-100 font-semibold"
                  />
                </div>
                <div>
                  <label htmlFor="evacuees" className="text-xs font-bold text-slate-400 block mb-1">Jumlah Pengungsi</label>
                  <input
                    type="number"
                    min="0"
                    id="evacuees"
                    value={evacuees}
                    onChange={(e) => setEvacuees(parseInt(e.target.value || '0', 10))}
                    className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2 text-xs text-slate-100 font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Photo Uploader with ML trigger notes */}
            <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl space-y-4">
              <h3 className="text-sm font-extrabold text-blue-400 uppercase tracking-widest border-b border-slate-850 pb-2 flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Dokumentasi Foto Kerusakan
              </h3>

              <p className="text-[10px] text-slate-400 leading-relaxed">
                Foto akan otomatis dipindai oleh Kecerdasan Buatan (Deep Learning) untuk mendeteksi tingkat keparahan dampak bencana secara instan.
              </p>

              {/* Input trigger */}
              <div className="relative border-2 border-dashed border-slate-700 rounded-xl p-6 flex flex-col items-center justify-center hover:border-blue-500 transition-colors cursor-pointer bg-slate-800/20">
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handlePhotoChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Camera className="w-8 h-8 text-slate-500 mb-2" />
                <span className="text-xs font-bold text-slate-300">Pilih & Upload Foto</span>
                <span className="text-[9px] text-slate-500 mt-1">Maksimal 10 file (JPG, PNG, WebP)</span>
              </div>

              {/* Previews */}
              {photoPreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {photoPreviews.map((url, index) => (
                    <div key={index} className="relative aspect-square border border-slate-700 rounded-lg overflow-hidden group">
                      <img src={url} alt="preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 bg-red-600 hover:bg-red-500 text-white rounded-full p-1 text-[9px] font-bold shadow-md hover:scale-110 transition-all"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3.5 px-6 rounded-2xl font-black text-sm text-white shadow-xl flex items-center justify-center gap-2 transition-all duration-200 uppercase tracking-wider ${
                isSubmitting 
                  ? 'bg-slate-700 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 hover:shadow-blue-500/20 active:scale-[0.98]'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Mengirim Laporan...
                </>
              ) : (
                'Kirim Laporan Bencana'
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
