import React from 'react';
import { ArrowLeft, Edit, Mail, Phone, MapPin, Building, Hash } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ContactProfileHeader = ({ contact }) => {
  // Extract initials for avatar
  const initials = contact?.contactName?.split(' ').map(n => n[0]).join('') || 'CO';

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-cyan-400 rounded-2xl flex items-center justify-center font-bold text-3xl text-white shadow-lg shadow-indigo-500/30">
            {initials}
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{contact?.contactName}</h1>
              <span className="px-2.5 py-1 text-xs font-bold bg-indigo-100 text-indigo-700 rounded-lg flex items-center">
                <Hash className="w-3 h-3 mr-1" /> {contact?.id}
              </span>
            </div>
            <div className="flex flex-wrap items-center mt-2 text-sm font-medium text-slate-500 gap-x-5 gap-y-2">
              <span className="flex items-center"><Building className="w-4 h-4 mr-1.5" /> {contact?.companyName}</span>
              <span className="flex items-center"><Phone className="w-4 h-4 mr-1.5" /> {contact?.phone}</span>
              <span className="flex items-center"><Mail className="w-4 h-4 mr-1.5" /> {contact?.email}</span>
              <span className="flex items-center w-full sm:w-auto"><MapPin className="w-4 h-4 mr-1.5" /> {contact?.address}</span>
            </div>
          </div>
        </div>
        <button className="mt-4 sm:mt-0 flex items-center text-sm font-medium text-slate-600 hover:text-indigo-600 bg-white border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 px-5 py-2.5 rounded-xl transition-all shadow-sm">
          <Edit className="w-4 h-4 mr-2" />
          Edit Profile
        </button>
      </div>
    </div>
  );
};
