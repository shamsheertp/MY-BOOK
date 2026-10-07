import { Link } from 'react-router-dom';

export const SidebarItem = ({ icon: Icon, label, to, isActive, isChild }) => (
  <Link
    to={to}
    className={`flex items-center px-4 py-2.5 my-1 transition-colors rounded-lg group ${
      isActive 
        ? 'bg-blue-50 text-blue-600 font-medium' 
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    } ${isChild ? 'ml-6 text-sm' : ''}`}
  >
    <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
    <span>{label}</span>
  </Link>
);

export const SidebarSection = ({ title }) => (
  <h3 className="px-4 mt-6 mb-2 text-xs font-semibold tracking-wider text-slate-400 uppercase">
    {title}
  </h3>
);
