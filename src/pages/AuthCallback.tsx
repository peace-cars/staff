import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_URL } from '../lib/api';

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const hash = location.hash;
      if (!hash) {
        navigate('/login', { replace: true });
        return;
      }

      const params = new URLSearchParams(hash.replace('#', '?'));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (!accessToken || !refreshToken) {
        navigate('/login', { replace: true });
        return;
      }

      try {
        const res = await fetch(`${API_URL}/auth/oauth-sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            access_token: accessToken,
            refresh_token: refreshToken,
            default_role: 'STAFF',
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'OAuth sync failed');

        const payload = data.success && data.data ? data.data : data;

        const role = payload.profile?.role;
        const staffRoles = ['STAFF', 'DISTRICT_MANAGER', 'GENERAL_MANAGER', 'FINANCE_AUDITOR'];
        if (!role || !staffRoles.includes(role)) {
          localStorage.setItem('staff_auth_error', 'ACCESS DENIED: This portal is for Staff only.');
          navigate('/login', { replace: true });
          return;
        }

        const sessionData = {
          access_token: payload.session?.access_token || accessToken,
          refresh_token: payload.session?.refresh_token || refreshToken,
          expires_at: payload.session?.expires_at || Math.floor(Date.now() / 1000) + 3600,
          user: payload.user,
          profile: payload.profile,
        };

        localStorage.setItem('staff_session', JSON.stringify(sessionData));
        localStorage.setItem('staffId', payload.user.id);
        window.location.href = '/';
      } catch (err) {
        console.error('OAuth Callback Error:', err);
        navigate('/login', { replace: true });
      }
    };

    handleAuthCallback();
  }, [location.hash, navigate]);

  return null;
}
