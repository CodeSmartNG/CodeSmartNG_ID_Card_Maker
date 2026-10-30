import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

export default function VerifyCard() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    
    axios.get(`${API_URL}/verify/${id}`)
      .then(({ data }) => setData(data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to verify ID card.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><p>Verifying ID Card...</p></div>;

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 p-6 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-red-700 mb-2">Verification Failed</h1>
        <p className="text-red-500 mb-6 max-w-md">{error}</p>
        <Link to="/" className="px-6 py-2 bg-red-600 text-white rounded-lg">Return Home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border-t-8 border-emerald-500">
        
        {/* Header */}
        <div className="bg-emerald-50 p-6 text-center border-b border-emerald-100">
          <div className="text-5xl mb-2">✅</div>
          <h1 className="text-2xl font-extrabold text-emerald-700">Valid ID Card</h1>
          <p className="text-emerald-600 text-sm mt-1">This card is officially recognized.</p>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            {data.member.photoUrl ? (
              <img src={data.member.photoUrl} alt="Member" className="w-20 h-24 object-cover rounded-lg border-2 border-slate-200" />
            ) : (
              <div className="w-20 h-24 bg-slate-200 rounded-lg flex items-center justify-center text-slate-400 font-bold text-2xl">
                {data.member.firstName[0]}{data.member.lastName[0]}
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-slate-900">{data.member.firstName} {data.member.lastName}</h2>
              <p className="text-slate-500 text-sm">{data.member.position || 'Member'}</p>
              <p className="text-slate-500 text-sm font-mono mt-1">{data.member.memberNumber}</p>
            </div>
          </div>

          <div className="space-y-3 text-sm bg-slate-50 p-4 rounded-xl">
            <div className="flex justify-between">
              <span className="text-slate-500">Organization</span>
              <span className="font-semibold text-slate-900">{data.organization.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Card Number</span>
              <span className="font-mono text-slate-900">{data.card.cardNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status</span>
              <span className="font-bold text-emerald-600">{data.card.status}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
