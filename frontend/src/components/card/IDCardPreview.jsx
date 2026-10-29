import { initials, formatDate } from '../../utils/formatters';

export default function IDCardPreview({ member, organization, template = 'classic', expiresAt }) {
  const expiry = expiresAt || new Date(new Date().setFullYear(new Date().getFullYear() + 2));
  
  // Base container to scale the card visually in the browser
  const cardStyle = {
    width: '100%',
    maxWidth: '400px',
    aspectRatio: '1.588', // CR80 standard size ratio
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
    position: 'relative',
    fontFamily: template === 'minimal' ? 'Helvetica, sans-serif' : template === 'modern' ? 'Inter, sans-serif' : 'Georgia, serif',
  };

  const renderClassic = () => (
    <div style={{ ...cardStyle, background: '#fff' }}>
      <div style={{ background: '#0f172a', padding: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        {organization?.logoUrl && (
          <img src={organization.logoUrl} alt="logo" style={{ width: 30, height: 30, background: '#fff', borderRadius: 4 }} />
        )}
        <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '14px' }}>{organization?.name || 'Organization Name'}</div>
      </div>
      <div style={{ padding: '20px', display: 'flex', gap: '15px' }}>
        {member.photoUrl ? (
          <img src={member.photoUrl} alt="member" style={{ width: '80px', height: '100px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #f59e0b' }} />
        ) : (
          <div style={{ width: '80px', height: '100px', borderRadius: '8px', background: '#e2e8f0', display: 'grid', placeItems: 'center', fontSize: '24px', color: '#94a3b8' }}>
            {initials(member.firstName, member.lastName)}
          </div>
        )}
        <div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a' }}>{member.firstName} {member.lastName}</div>
          <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic', marginBottom: '10px' }}>{member.position || 'Position'}</div>
          <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>ID Number</div>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a', fontFamily: 'monospace' }}>{member.memberNumber}</div>
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: '#0f172a', padding: '8px 20px', display: 'flex', justifyContent: 'space-between', color: '#fff', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase' }}>
        <span>Valid Until: {formatDate(expiry)}</span>
        <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>Official ID</span>
      </div>
    </div>
  );

  const renderModern = () => (
    <div style={{ ...cardStyle, background: '#fff' }}>
      <div style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', padding: '20px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 800, fontSize: '16px' }}>{organization?.name || 'Organization Name'}</div>
      </div>
      <div style={{ padding: '15px', display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
        {member.photoUrl ? (
          <img src={member.photoUrl} alt="member" style={{ width: '70px', height: '85px', objectFit: 'cover', borderRadius: '12px', background: 'linear-gradient(#6366f1, #22d3ee)', padding: '2px' }} />
        ) : (
          <div style={{ width: '70px', height: '85px', borderRadius: '12px', background: '#e2e8f0', display: 'grid', placeItems: 'center', fontSize: '20px', color: '#94a3b8' }}>
            {initials(member.firstName, member.lastName)}
          </div>
        )}
        <div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>{member.firstName}<br/>{member.lastName}</div>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>{member.position || 'Position'}</div>
        </div>
      </div>
      <div style={{ padding: '0 15px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '8px', borderLeft: '3px solid #6366f1' }}>
          <div style={{ fontSize: '8px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>ID No.</div>
          <div style={{ fontSize: '11px', fontWeight: 'bold', fontFamily: 'monospace' }}>{member.memberNumber}</div>
        </div>
        <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '8px', borderLeft: '3px solid #6366f1' }}>
          <div style={{ fontSize: '8px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>Dept.</div>
          <div style={{ fontSize: '11px', fontWeight: 'bold' }}>{member.department || 'Department'}</div>
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', padding: '8px 20px', color: '#fff', fontSize: '9px', fontWeight: 'bold', letterSpacing: '2px', textTransform: 'uppercase', textAlign: 'center' }}>
        Valid Until {formatDate(expiry)}
      </div>
    </div>
  );

  const renderMinimal = () => (
    <div style={{ ...cardStyle, background: '#fafafa', border: '1px solid #e5e5e5' }}>
      <div style={{ padding: '20px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ fontSize: '12px', fontWeight: 300, letterSpacing: '4px', textTransform: 'uppercase' }}>{organization?.name || 'Org Name'}</div>
      </div>
      <div style={{ padding: '15px 20px', display: 'flex', gap: '20px' }}>
        {member.photoUrl ? (
          <img src={member.photoUrl} alt="member" style={{ width: '70px', height: '85px', objectFit: 'cover', filter: 'grayscale(1)' }} />
        ) : (
          <div style={{ width: '70px', height: '85px', background: '#e5e5e5', display: 'grid', placeItems: 'center', fontSize: '20px', color: '#a3a3a3' }}>
            {initials(member.firstName, member.lastName)}
          </div>
        )}
        <div>
          <div style={{ fontSize: '22px', fontWeight: 200, color: '#0a0a0a', lineHeight: 1 }}>{member.firstName}<br/>{member.lastName}</div>
          <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '2px', color: '#737373', marginTop: '6px' }}>{member.position || 'Position'}</div>
        </div>
      </div>
      <div style={{ padding: '0 20px' }}>
        <div style={{ borderTop: '1px solid #0a0a0a', padding: '6px 0', display: 'flex', fontSize: '9px' }}>
          <span style={{ textTransform: 'uppercase', letterSpacing: '2px', width: '80px', color: '#737373' }}>ID No.</span>
          <span style={{ fontFamily: 'monospace', fontWeight: 500 }}>{member.memberNumber}</span>
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: '15px', left: '20px', right: '20px', borderTop: '1px solid #0a0a0a', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '8px', letterSpacing: '2px', textTransform: 'uppercase' }}>
        <span>Valid Until {formatDate(expiry)}</span>
      </div>
    </div>
  );

  return (
    <div className="id-card-wrapper">
      {template === 'classic' && renderClassic()}
      {template === 'modern' && renderModern()}
      {template === 'minimal' && renderMinimal()}
    </div>
  );
}
