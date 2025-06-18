import {
  Account,
  Avatars,
  Client,
  Databases,
  ID,
  Query,
  Storage,
} from "react-native-appwrite";

// KONFIGURASI DIpertahankan SESUAI ASLINYA
export const config = {
  platform: "com.saqcloth.gumisaq",
  endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT,
  projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
  databaseId: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID,

  //artikel
  artikelCollectionId: process.env.EXPO_PUBLIC_APPWRITE_ARTIKEL_COLLECTION_ID,

  //users
  usersProfileCollectionId: process.env.EXPO_PUBLIC_APPWRITE_USERS_PROFILE_COLLECTION_ID,

  //marketplace
  galleriesCollectionId: process.env.EXPO_PUBLIC_APPWRITE_GALLERIES_COLLECTION_ID,
  reviewsCollectionId: process.env.EXPO_PUBLIC_APPWRITE_REVIEWS_COLLECTION_ID,
  agentsCollectionId: process.env.EXPO_PUBLIC_APPWRITE_AGENTS_COLLECTION_ID,
  stokCollectionId: process.env.EXPO_PUBLIC_APPWRITE_STOK_COLLECTION_ID,
  storageBucketId: process.env.EXPO_PUBLIC_APPWRITE_STORAGE_BUCKET_ID || 'default',
};

// Inisialisasi Klien Appwrite
const client = new Client();
client
  .setEndpoint(config.endpoint!)
  .setProject(config.projectId!)
  .setPlatform(config.platform!);

export const avatars = new Avatars(client);
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

// =================================================================
// FUNGSI OTENTIKASI & PENGGUNA (Authentication & User)
// =================================================================

/**
 * Membuat pengguna baru menggunakan sistem otentikasi aman Appwrite
 * dan menyimpan profilnya di Database.
 */
export async function createUser(email: string, password: string, name: string) {
  try {
    // 1. Buat akun di sistem otentikasi Appwrite
    const newAccount = await account.create(ID.unique(), email, password, name);
    if (!newAccount) throw new Error("Gagal membuat akun.");

    // 2. Buat avatar default dari inisial nama
    const avatarUrl = avatars.getInitials(name);

    // 3. Simpan data profil user ke koleksi 'users'
    //    dengan menyertakan userType
    await databases.createDocument(
      config.databaseId!,
      config.usersProfileCollectionId!,
      newAccount.$id,
      {
        accountId: newAccount.$id,
        email,
        name,
        avatar: avatarUrl.toString(),
        userType: 'user', // <-- userType DITAMBAHKAN DI SINI
      }
    );

    return newAccount;
  } catch (error: any) {
    console.error("Error creating user:", error);
    throw new Error(error.message || "Gagal membuat akun.");
  }
}

/**
 * Login pengguna menggunakan sesi aman Appwrite.
 * Dibuat defensif dengan mencoba menghapus sesi lama terlebih dahulu.
 */
export async function loginUser(email: string, password: string) {
  try {
    // Coba hapus sesi yang mungkin tertinggal terlebih dahulu.
    await account.deleteSession("current").catch(() => {});

    // Setelah memastikan tidak ada sesi aktif, buat sesi baru.
    const newSession = await account.createEmailPasswordSession(email, password);
    return newSession;

  } catch (error: any) {
    console.error("Error during login process:", error);
    throw new Error(error.message || "Email atau password salah.");
  }
}

/**
 * Mengambil data pengguna yang sedang login berdasarkan sesi aktif.
 */
export async function getCurrentUser() {
  try {
    const currentAccount = await account.get();
    if (!currentAccount) return null;

    const userProfile = await databases.getDocument(
      config.databaseId!,
      config.usersProfileCollectionId!,
      currentAccount.$id
    );
    if (!userProfile) return null;

    return userProfile;
  } catch (error) {
    console.log("No active session or user profile found:", error);
    return null;
  }
}

/**
 * Logout pengguna dengan menghapus sesi saat ini.
 */
export async function logout() {
  try {
    return await account.deleteSession("current");
  } catch (error: any) {
    console.error("Error logging out:", error.message);
    throw new Error("Gagal untuk logout.");
  }
}

// =================================================================
// FUNGSI ARTIKEL
// =================================================================

export async function getArticles() {
  try {
    const result = await databases.listDocuments(
      config.databaseId!,
      config.artikelCollectionId!,
      [Query.equal("isPublished", true), Query.orderDesc("$createdAt")]
    );
    return result.documents;
  } catch (error) {
    console.error('Error fetching articles:', error);
    return [];
  }
}

export async function getArticleById(id: string) {
    try {
        const doc = await databases.getDocument(
          config.databaseId!,
          config.artikelCollectionId!,
          id
        );
    
        if (doc.isPublished) {
          // Fire and forget, tidak perlu menunggu update selesai
          databases.updateDocument(
            config.databaseId!,
            config.artikelCollectionId!,
            id,
            { viewCount: (doc.viewCount || 0) + 1 }
          );
        }
    
        return doc;
      } catch (error) {
        console.error('Error fetching article:', error);
        return null;
      }
}

// =================================================================
// FUNGSI STOK BARANG (PRODUK)
// =================================================================

/**
 * Mengambil stok/produk terbaru.
 */
export async function getLatestProperties() {
  try {
    const result = await databases.listDocuments(
      config.databaseId!,
      config.stokCollectionId!,
      [Query.orderDesc("$createdAt"), Query.limit(5)]
    );
    return result.documents;
  } catch (error) {
    console.error("Error fetching latest properties:", error);
    return [];
  }
}

/**
 * Mengambil semua stok/produk dengan filter dan query.
 */
export async function getProperties({ filter, query, limit }: { filter?: string; query?: string; limit?: number; }) {
  try {
    const queries: any[] = [Query.orderDesc("$createdAt")];

    if (filter && filter !== "All") queries.push(Query.equal("type", filter));
    if (query) queries.push(Query.search("name", query));
    if (limit) queries.push(Query.limit(limit));

    const result = await databases.listDocuments(
      config.databaseId!,
      config.stokCollectionId!,
      queries
    );
    return result.documents;
  } catch (error) {
    console.error("Error fetching properties:", error);
    return [];
  }
}

/**
 * Mengambil detail stok/produk berdasarkan ID, beserta data relasinya.
 */
export async function getPropertyById({ id }: { id: string }) {
  try {
    const propertyDoc = await databases.getDocument(
      config.databaseId!,
      config.stokCollectionId!,
      id
    );
    if (!propertyDoc) throw new Error("Produk tidak ditemukan.");

    // Mengambil data lengkap 'agent' (penjual)
    if (propertyDoc.agent?.$id) {
      propertyDoc.agent = await databases.getDocument(
        config.databaseId!,
        config.agentsCollectionId!,
        propertyDoc.agent.$id
      );
    }
    
    // Mengambil data lengkap 'reviews'
    if (propertyDoc.reviews?.length > 0) {
      const reviewPromises = propertyDoc.reviews.map((review: any) =>
        databases.getDocument(config.databaseId!, config.reviewsCollectionId!, review.$id)
      );
      propertyDoc.reviews = await Promise.all(reviewPromises);
    }

    // Mengambil data lengkap 'gallery'
    if (propertyDoc.gallery?.length > 0) {
        const galleryPromises = propertyDoc.gallery.map((image: any) =>
          databases.getDocument(config.databaseId!, config.galleriesCollectionId!, image.$id)
        );
        propertyDoc.gallery = await Promise.all(galleryPromises);
    }

    return propertyDoc;
  } catch (error) {
    console.error("Error getting property by ID:", error);
    return null;
  }
}