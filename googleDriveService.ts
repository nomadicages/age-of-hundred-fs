
import { SyncData } from './types';

const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata';

let tokenClient: any;
let gapiInited = false;
let gisInited = false;
let initPromise: Promise<void> | null = null;

/**
 * Gets the current Client ID from environment or storage.
 */
export const getActiveClientId = () => {
  return localStorage.getItem('centurion_google_client_id') || 
         (window as any).process?.env?.GOOGLE_CLIENT_ID || 
         'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
};

/**
 * Checks if the currently set Client ID is just a placeholder.
 */
export const isClientIdConfigured = () => {
  const id = getActiveClientId();
  return id && id !== 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com' && id.trim() !== '';
};

/**
 * Resets the initialization state to allow re-init with a new Client ID.
 */
export const resetGoogleApi = () => {
  initPromise = null;
  gapiInited = false;
  gisInited = false;
};

/**
 * Initializes the Google API client and Identity Services.
 */
export const initGoogleApi = (): Promise<void> => {
  if (initPromise) return initPromise;

  const clientId = getActiveClientId();

  initPromise = new Promise((resolve, reject) => {
    const checkReady = () => {
      if (gapiInited && gisInited) resolve();
    };

    const handleGapiLoad = async () => {
      try {
        await (window as any).gapi.client.init({
          discoveryDocs: [DISCOVERY_DOC],
        });
        gapiInited = true;
        checkReady();
      } catch (error) {
        console.error('GAPI init error:', error);
        reject(error);
      }
    };

    if ((window as any).gapi) {
      (window as any).gapi.load('client', handleGapiLoad);
    }

    if ((window as any).google && (window as any).google.accounts) {
      tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES,
        callback: '', 
      });
      gisInited = true;
      checkReady();
    }
  });

  return initPromise;
};

/**
 * Triggers the login popup.
 */
export const connectDrive = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!isClientIdConfigured()) {
      reject(new Error('CONFIG_REQUIRED'));
      return;
    }

    if (!gisInited || !tokenClient) {
      reject(new Error('NOT_INITIALIZED'));
      return;
    }

    tokenClient.callback = async (resp: any) => {
      if (resp.error !== undefined) {
        reject(resp);
        return;
      }
      resolve(resp.access_token);
    };

    tokenClient.requestAccessToken({ prompt: 'consent' });
  });
};

export const findOrCreateSyncFile = async (): Promise<string> => {
  if (!gapiInited) throw new Error('NOT_INITIALIZED');

  const response = await (window as any).gapi.client.drive.files.list({
    spaces: 'appDataFolder',
    fields: 'files(id, name)',
    q: "name = 'centurion_data.json'",
  });

  const files = response.result.files;
  if (files && files.length > 0) return files[0].id;

  const createResponse = await (window as any).gapi.client.drive.files.create({
    resource: {
      name: 'centurion_data.json',
      parents: ['appDataFolder'],
    },
    fields: 'id',
  });
  return createResponse.result.id;
};

export const uploadData = async (fileId: string, data: SyncData): Promise<void> => {
  const token = (window as any).gapi.client.getToken()?.access_token;
  if (!token) throw new Error('NO_TOKEN');

  const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) throw new Error('UPLOAD_FAILED');
};

export const downloadData = async (fileId: string): Promise<SyncData | null> => {
  if (!gapiInited) throw new Error('NOT_INITIALIZED');
  try {
    const response = await (window as any).gapi.client.drive.files.get({
      fileId: fileId,
      alt: 'media',
    });
    return response.result as SyncData;
  } catch (error) {
    return null;
  }
};
