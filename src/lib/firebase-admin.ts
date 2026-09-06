let app: any = null;
let adminDb: any = null;
let adminAuth: any = null;
let adminStorage: any = null;

const createMockDb = () => {
  const memoryStore = new Map<string, any>();

  const getDocObj = (path: string) => {
    return {
      get: async () => {
        const data = memoryStore.get(path);
        return { exists: !!data, id: path.split("/").pop() || "mock-id", data: () => data || {} };
      },
      set: async (newData: any, options?: any) => {
        const existing = options?.merge ? (memoryStore.get(path) || {}) : {};
        memoryStore.set(path, { ...existing, ...newData });
        return {};
      },
      update: async (newData: any) => {
        const existing = memoryStore.get(path) || {};
        memoryStore.set(path, { ...existing, ...newData });
        return {};
      },
      delete: async () => {
        memoryStore.delete(path);
        return {};
      },
      collection: (colName: string) => getColObj(`${path}/${colName}`),
    };
  };

  const getColObj = (path: string) => {
    return {
      doc: (docId?: string) => getDocObj(`${path}/${docId || "default"}`),
      add: async (data: any) => {
        const id = "mock_" + Date.now();
        memoryStore.set(`${path}/${id}`, data);
        return { id };
      },
      where: () => getColObj(path),
      orderBy: () => getColObj(path),
      limit: () => getColObj(path),
      get: async () => ({ docs: [], size: 0, empty: true, forEach: () => {} }),
      collection: (colName: string) => getColObj(`${path}/${colName}`),
      count: () => ({ get: async () => ({ data: () => ({ count: 0 }) }) }),
    };
  };

  return {
    collection: (colName: string) => getColObj(colName),
    doc: (docPath: string) => getDocObj(docPath),
  };
};

function initFirebaseAdmin() {
  if (adminDb && adminAuth && adminStorage) {
    return { app, adminDb, adminAuth, adminStorage };
  }

  try {
    const admin = require("firebase-admin");
    const { getApps, getApp, initializeApp, cert } = require("firebase-admin/app");
    const { getFirestore } = require("firebase-admin/firestore");
    const { getAuth } = require("firebase-admin/auth");
    const { getStorage } = require("firebase-admin/storage");

    if (getApps().length > 0) {
      app = getApp();
    } else {
      const privateKeyB64 = process.env.FIREBASE_ADMIN_PRIVATE_KEY_B64;
      let privateKey = "";
      
      if (privateKeyB64) {
        privateKey = Buffer.from(privateKeyB64, 'base64').toString('utf8');
      } else if (process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
        privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n');
      }

      const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "c-g-ltd";
      const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
      const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "c-g-ltd.firebasestorage.app";

      if (projectId && clientEmail && privateKey) {
        app = initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey,
          }),
          projectId,
          storageBucket,
        });
      } else if (process.env.NODE_ENV === "production" || process.env.K_SERVICE || process.env.GCP_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || process.env.FIREBASE_CONFIG) {
        app = initializeApp({
          projectId,
          storageBucket
        });
      } else {
        throw new Error("Missing Firebase Admin credentials in local environment.");
      }
    }

    adminDb = getFirestore(app);
    adminAuth = getAuth(app);
    adminStorage = getStorage(app);
  } catch (error: any) {
    console.warn("Notice: Firebase Admin initialized with mock fallback:", error?.message || error);
    adminDb = createMockDb();
    adminAuth = {
      getUser: async () => ({ uid: "mock-user" }),
      verifyIdToken: async () => ({ uid: "mock-user" }),
    };
    adminStorage = {
      bucket: () => ({
        file: () => ({
          save: async () => {},
          getSignedUrl: async () => [""],
          delete: async () => {},
        }),
      }),
    };
  }

  return { app, adminDb, adminAuth, adminStorage };
}

export const getAdminDb = () => {
  if (!adminDb) initFirebaseAdmin();
  return adminDb;
};

export const getAdminAuth = () => {
  if (!adminAuth) initFirebaseAdmin();
  return adminAuth;
};

export const getAdminStorage = () => {
  if (!adminStorage) initFirebaseAdmin();
  return adminStorage;
};

export const adminDbProxy: any = new Proxy({}, {
  get: (_, prop) => {
    const db = getAdminDb();
    const val = db[prop];
    return typeof val === "function" ? val.bind(db) : val;
  }
});

export const adminAuthProxy: any = new Proxy({}, {
  get: (_, prop) => {
    const auth = getAdminAuth();
    const val = auth[prop];
    return typeof val === "function" ? val.bind(auth) : val;
  }
});

export const adminStorageProxy: any = new Proxy({}, {
  get: (_, prop) => {
    const storage = getAdminStorage();
    const val = storage[prop];
    return typeof val === "function" ? val.bind(storage) : val;
  }
});

export const getUserDb = (userId: string) => {
  if (!userId) throw new Error("getUserDb requires a valid userId");
  const db = getAdminDb();
  return {
    collection: (colPath: string) => db.collection("users").doc(userId).collection(colPath),
    doc: (docPath: string) => {
       const parts = docPath.split('/');
       if (parts.length === 1) throw new Error("doc() with one segment not supported at root in getUserDb");
       const col = parts.shift() as string;
       return db.collection("users").doc(userId).collection(col).doc(parts.join('/'));
    }
  };
};

export { adminDbProxy as adminDb, adminAuthProxy as adminAuth, adminStorageProxy as adminStorage };
