import { initials, formatDate } from '../../utils/formatters';

export default function IDCardPreview({ member, organization, template = 'classic', expiresAt }) {
  const expiry = expiresAt || new Date(new Date().setFullYear(new Date().getFullYear() + 2));

  const cardBaseClass = "w-full max-w-[400px] aspect-[1.588] rounded-2xl overflow-hidden shadow-2xl relative font-sans transition-all duration-300 hover:scale-[1.02] hover:shadow-3xl bg-white";

  const renderClassic = () => (
    <div className={`${cardBaseClass} border border-slate-200`}>
      {/* Header */}
      <div className="bg-slate-900 px-5 py-4 flex items-center justify-between border-b-4 border-amber-500">
        <div className="flex items-center gap-3 truncate">
          {organization?.logoUrl ? (
            <img src={organization.logoUrl} alt="logo" className="w-8 h-8 bg-white rounded shadow-sm object-contain p-1 flex-shrink-0" />
          ) : (
            <div className="w-8 h-8 bg-white/20 rounded flex-shrink-0" />
          )}
          <div className="text-white font-bold text-sm tracking-wide uppercase truncate">
            {organization?.name || 'Organization Name'}
          </div>
        </div>
        {organization?.cacNumber && (
          <div className="text-[8px] text-slate-400 font-mono text-right flex-shrink-0 ml-2">
            RC: {organization.cacNumber}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="px-6 py-4 flex gap-5 items-start">
        {member?.photoUrl ? (
          <img src={member.photoUrl} alt="member" className="w-[85px] h-[105px] object-cover rounded-lg border-[3px] border-amber-500 shadow-sm flex-shrink-0" />
        ) : (
          <div className="w-[85px] h-[105px] rounded-lg bg-slate-100 border-[3px] border-amber-500 flex items-center justify-center text-2xl font-bold text-slate-400 flex-shrink-0">
            {initials(member?.firstName, member?.lastName)}
          </div>
        )}
        <div className="flex flex-col pt-1 w-full overflow-hidden">
          <div className="text-xl font-bold text-slate-900 leading-tight truncate">
            {member?.firstName} <br /> {member?.lastName}
          </div>
          
          {/* 👇 Member Type & Position */}
          <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide mt-1 truncate">
            {member?.memberType || 'MEMBER'}
          </div>
          <div className="text-[10px] text-slate-500 font-medium italic truncate">
            {member?.position || 'Position'}
          </div>
          
          <div className="mt-2">
            <div className="text-[8px] text-slate-400 uppercase tracking-widest font-bold mb-0.5">ID Number</div>
            <div className="text-sm font-bold text-slate-900 font-mono tracking-tight">{member?.memberNumber}</div>
          </div>

          {/* Address & TIN/NIN */}
          <div className="mt-1.5 space-y-0.5">
            {member?.address && (
              <div className="text-[8px] text-slate-500 truncate">
                Addr: {member.address}
              </div>
            )}
            {(member?.tin || member?.nin) && (
              <div className="text-[8px] text-slate-500 truncate">
                {member.tin && `TIN: ${member.tin}`} {member.tin && member.nin && '|'} {member.nin && `NIN: ${member.nin}`}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 bg-slate-900 px-6 py-2 flex justify-between items-center text-[9px] uppercase tracking-widest text-slate-300">
        <span>Valid Until: {formatDate(expiry)}</span>
        <span className="text-amber-500 font-bold">Official ID</span>
      </div>
    </div>
  );

  const renderModern = () => (
    <div className={`${cardBaseClass} bg-white`}>
      {/* Header with Gradient */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-3 text-white flex justify-between items-center relative overflow-hidden">
        <div className="absolute -right-4 -top-8 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
        <div className="font-extrabold text-lg tracking-tight truncate relative z-10 max-w-[220px]">
          {organization?.name || 'Organization Name'}
        </div>
        {organization?.cacNumber && (
           <div className="text-[8px] font-mono relative z-10 opacity-70">RC: {organization.cacNumber}</div>
        )}
      </div>

      {/* Body */}
      <div className="px-5 pt-4 pb-1 flex gap-4 items-start">
        {member?.photoUrl ? (
          <div className="p-[2px] bg-gradient-to-br from-indigo-500 to-cyan-400 rounded-xl flex-shrink-0">
            <img src={member.photoUrl} alt="member" className="w-[75px] h-[90px] object-cover rounded-[10px] bg-white" />
          </div>
        ) : (
          <div className="w-[75px] h-[90px] rounded-xl bg-slate-100 flex items-center justify-center text-xl font-bold text-slate-400 flex-shrink-0">
            {initials(member?.firstName, member?.lastName)}
          </div>
        )}
        <div className="overflow-hidden">
          <div className="text-2xl font-extrabold text-slate-900 leading-none tracking-tight truncate">
            {member?.firstName} <br /> {member?.lastName}
          </div>
          
          {/* 👇 Member Type & Position */}
          <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide mt-1 truncate max-w-[150px]">
            {member?.memberType || 'MEMBER'}
          </div>
          <div className="text-[9px] text-slate-500 font-semibold truncate max-w-[150px]">
            {member?.position || 'Position'}
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="px-5 grid grid-cols-2 gap-2 mt-1">
        <div className="bg-slate-50 p-1.5 rounded-lg border-l-4 border-indigo-500">
          <div className="text-[7px] text-slate-400 uppercase font-bold tracking-wider">ID No.</div>
          <div className="text-[10px] font-bold text-slate-900 font-mono truncate">{member?.memberNumber}</div>
        </div>
        <div className="bg-slate-50 p-1.5 rounded-lg border-l-4 border-indigo-500">
          <div className="text-[7px] text-slate-400 uppercase font-bold tracking-wider">Dept.</div>
          <div className="text-[10px] font-bold text-slate-900 truncate">{member?.department || 'Department'}</div>
        </div>
      </div>

      {/* Address & TIN/NIN row */}
      <div className="px-5 mt-1.5 flex flex-col gap-0.5">
        {member?.address && (
          <div className="text-[8px] text-slate-500 truncate flex items-start gap-1">
            <span className="font-bold text-slate-400 uppercase tracking-widest text-[7px] mt-[1px]">Addr:</span> {member.address}
          </div>
        )}
        {(member?.tin || member?.nin) && (
          <div className="text-[8px] text-slate-500 truncate flex items-start gap-1">
            <span className="font-bold text-slate-400 uppercase tracking-widest text-[7px] mt-[1px]">IDs:</span> 
            {member.tin && `TIN: ${member.tin}`} {member.tin && member.nin && ' | '} {member.nin && `NIN: ${member.nin}`}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-indigo-500 to-purple-600 py-1.5 text-center text-white text-[9px] font-bold uppercase tracking-widest">
        Valid Until {formatDate(expiry)}
      </div>
    </div>
  );

  const renderMinimal = () => (
    <div className={`${cardBaseClass} bg-zinc-50 border border-zinc-200`}>
      <div className="px-6 pt-5 pb-2 flex justify-between items-start">
        <div className="text-[11px] font-light tracking-[0.2em] uppercase text-zinc-800 truncate max-w-[200px]">
          {organization?.name || 'Org Name'}
        </div>
        {organization?.cacNumber && (
          <div className="text-[7px] font-mono text-zinc-400">RC: {organization.cacNumber}</div>
        )}
      </div>

      <div className="px-6 py-2 flex gap-5 items-start">
        {member?.photoUrl ? (
          <img src={member.photoUrl} alt="member" className="w-[70px] h-[85px] object-cover grayscale flex-shrink-0" />
        ) : (
          <div className="w-[70px] h-[85px] bg-zinc-200 flex items-center justify-center text-xl font-light text-zinc-500 flex-shrink-0">
            {initials(member?.firstName, member?.lastName)}
          </div>
        )}
        <div className="overflow-hidden">
          <div className="text-[22px] font-light text-black leading-[1.1] tracking-tight truncate">
            {member?.firstName} <br /> {member?.lastName}
          </div>
          
          {/* 👇 Member Type & Position */}
          <div className="text-[9px] font-bold uppercase tracking-[0.15em] text-black mt-1 truncate max-w-[150px]">
            {member?.memberType || 'MEMBER'}
          </div>
          <div className="text-[8px] uppercase tracking-[0.15em] text-zinc-500 truncate max-w-[150px]">
            {member?.position || 'Position'}
          </div>
        </div>
      </div>

      <div className="px-6 mt-1">
        <div className="border-t border-black py-1 flex text-[8px]">
          <span className="uppercase tracking-[0.2em] w-12 text-zinc-500">ID No.</span>
          <span className="font-mono font-medium text-black">{member?.memberNumber}</span>
        </div>
        {member?.address && (
          <div className="border-t border-black py-1 flex text-[8px]">
            <span className="uppercase tracking-[0.2em] w-12 text-zinc-500">Addr.</span>
            <span className="font-mono font-medium text-black truncate">{member.address}</span>
          </div>
        )}
        {(member?.tin || member?.nin) && (
          <div className="border-t border-black py-1 flex text-[8px]">
            <span className="uppercase tracking-[0.2em] w-12 text-zinc-500">IDs</span>
            <span className="font-mono font-medium text-black truncate">
               {member.tin && `TIN: ${member.tin}`} {member.tin && member.nin && ' | '} {member.nin && `NIN: ${member.nin}`}
            </span>
          </div>
        )}
      </div>

      <div className="absolute bottom-3 left-6 right-6 border-t border-black pt-1.5 flex justify-between text-[7px] uppercase tracking-[0.15em] text-zinc-600">
        <span>Valid Until {formatDate(expiry)}</span>
      </div>
    </div>
  );

  return (
    <div className="flex items-center justify-center p-4">
      {template === 'classic' && renderClassic()}
      {template === 'modern' && renderModern()}
      {template === 'minimal' && renderMinimal()}
    </div>
  );
}
