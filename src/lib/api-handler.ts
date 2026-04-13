const BACKEND = 'https://smartgumastha-backend-production.up.railway.app';

// Parse auth cookie safely
export function getAuth(cookieValue: string | undefined): any {
  if (!cookieValue) return null;
  try {
    return JSON.parse(decodeURIComponent(cookieValue));
  } catch {
    try {
      return JSON.parse(cookieValue);
    } catch {
      return null;
    }
  }
}

// Fetch with auto token refresh on 401
async function hmsFetch(url: string, options: any, auth: any): Promise<{ok: boolean, status: number, data: any}> {
  var token = auth.hmsToken || auth.token;
  if (!token) return { ok: false, status: 401, data: { success: false, error: 'No token available' } };

  var headers = { ...options.headers, 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' };

  try {
    var res = await fetch(url, { ...options, headers });
    var text = await res.text();
    var data: any;
    try { data = JSON.parse(text); } catch { data = { success: false, error: text.substring(0, 200) }; }

    // If 401, try refreshing token
    if (res.status === 401 && auth.token) {
      try {
        var refreshRes = await fetch(BACKEND + '/api/presence/partner-auth/hms-token', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + auth.token, 'Content-Type': 'application/json' }
        });
        var refreshText = await refreshRes.text();
        var refreshData: any;
        try { refreshData = JSON.parse(refreshText); } catch { refreshData = null; }

        if (refreshData?.hmsToken) {
          // Retry with new token
          headers['Authorization'] = 'Bearer ' + refreshData.hmsToken;
          var retryRes = await fetch(url, { ...options, headers });
          var retryText = await retryRes.text();
          try { data = JSON.parse(retryText); } catch { data = { success: false, error: retryText.substring(0, 200) }; }
          return { ok: retryRes.ok, status: retryRes.status, data };
        }
      } catch {}
    }

    return { ok: res.ok, status: res.status, data };
  } catch (error: any) {
    return { ok: false, status: 500, data: { success: false, error: error.message } };
  }
}

// Route handler factory — ONE function for all API routes
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

type PathBuilder = (auth: any, req: NextRequest) => string;

export function createGET(pathBuilder: PathBuilder) {
  return async function(req: NextRequest) {
    try {
      var cookieStore = await cookies();
      var raw = cookieStore.get('medihost_auth')?.value;
      var auth = getAuth(raw);
      if (!auth) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

      var backendPath = pathBuilder(auth, req);
      var result = await hmsFetch(BACKEND + backendPath, { method: 'GET' }, auth);
      return NextResponse.json(result.data, { status: result.ok ? 200 : result.status });
    } catch (error: any) {
      console.error('[GET] Error:', error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  };
}

export function createPOST(pathBuilder: PathBuilder) {
  return async function(req: NextRequest) {
    try {
      var cookieStore = await cookies();
      var raw = cookieStore.get('medihost_auth')?.value;
      var auth = getAuth(raw);
      if (!auth) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

      var body = await req.text();
      var backendPath = pathBuilder(auth, req);
      var result = await hmsFetch(BACKEND + backendPath, { method: 'POST', body }, auth);
      return NextResponse.json(result.data, { status: result.ok ? 200 : result.status });
    } catch (error: any) {
      console.error('[POST] Error:', error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  };
}

export function createPUT(pathBuilder: PathBuilder) {
  return async function(req: NextRequest) {
    try {
      var cookieStore = await cookies();
      var raw = cookieStore.get('medihost_auth')?.value;
      var auth = getAuth(raw);
      if (!auth) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

      var body = await req.text();
      var backendPath = pathBuilder(auth, req);
      var result = await hmsFetch(BACKEND + backendPath, { method: 'PUT', body }, auth);
      return NextResponse.json(result.data, { status: result.ok ? 200 : result.status });
    } catch (error: any) {
      console.error('[PUT] Error:', error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  };
}

export function createDELETE(pathBuilder: PathBuilder) {
  return async function(req: NextRequest) {
    try {
      var cookieStore = await cookies();
      var raw = cookieStore.get('medihost_auth')?.value;
      var auth = getAuth(raw);
      if (!auth) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

      var backendPath = pathBuilder(auth, req);
      var result = await hmsFetch(BACKEND + backendPath, { method: 'DELETE' }, auth);
      return NextResponse.json(result.data, { status: result.ok ? 200 : result.status });
    } catch (error: any) {
      console.error('[DELETE] Error:', error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  };
}

// Public endpoint handler (no auth needed — for pricing, plans, signup)
export function createPublicGET(path: string) {
  return async function(req: NextRequest) {
    try {
      var params = req.nextUrl.searchParams.toString();
      var url = BACKEND + path + (params ? '?' + params : '');
      var res = await fetch(url);
      var text = await res.text();
      var data: any;
      try { data = JSON.parse(text); } catch { data = { success: false, error: text.substring(0, 200) }; }
      return NextResponse.json(data, { status: res.ok ? 200 : res.status });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  };
}

export function createPublicPOST(path: string) {
  return async function(req: NextRequest) {
    try {
      var body = await req.text();
      var res = await fetch(BACKEND + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
      var text = await res.text();
      var data: any;
      try { data = JSON.parse(text); } catch { data = { success: false, error: text.substring(0, 200) }; }
      return NextResponse.json(data, { status: res.ok ? 200 : res.status });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  };
}
