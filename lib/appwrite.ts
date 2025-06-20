import {
  Account,
  Avatars,
  Client,
  Databases,
  ID,
  Query,
  Storage,
} from "react-native-appwrite";

// =================================================================
// KONFIGURASI APPWRITE
// =================================================================
export const config = {
  platform: "com.saqcloth.gumisaq",
  endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT,
  projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
  databaseId: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID,
  storageBucketId: process.env.EXPO_PUBLIC_APPWRITE_STORAGE_BUCKET_ID || 'default',

  // Collections
  artikelCollectionId: process.env.EXPO_PUBLIC_APPWRITE_ARTIKEL_COLLECTION_ID,
  usersProfileCollectionId: process.env.EXPO_PUBLIC_APPWRITE_USERS_PROFILE_COLLECTION_ID,
  galleriesCollectionId: process.env.EXPO_PUBLIC_APPWRITE_GALLERIES_COLLECTION_ID,
  reviewsCollectionId: process.env.EXPO_PUBLIC_APPWRITE_REVIEWS_COLLECTION_ID,
  agentsCollectionId: process.env.EXPO_PUBLIC_APPWRITE_AGENTS_COLLECTION_ID,
  stokCollectionId: process.env.EXPO_PUBLIC_APPWRITE_STOK_COLLECTION_ID,
  keranjangCollectionId: process.env.EXPO_PUBLIC_APPWRITE_KERANJANG_COLLECTION_ID,
  ordersCollectionId: process.env.EXPO_PUBLIC_APPWRITE_ORDERS_COLLECTION_ID,
  orderItemsCollectionId: process.env.EXPO_PUBLIC_APPWRITE_ORDER_ITEMS_COLLECTION_ID,
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
 * Membuat pengguna baru dan menyimpan profilnya di Database.
 */
export async function createUser(email: string, password: string, name: string) {
  try {
    const newAccount = await account.create(ID.unique(), email, password, name);
    if (!newAccount) throw new Error("Gagal membuat akun.");

    const avatarUrl = avatars.getInitials(name);

    await databases.createDocument(
      config.databaseId!,
      config.usersProfileCollectionId!,
      newAccount.$id,
      {
        accountId: newAccount.$id,
        email,
        name,
        avatar: avatarUrl.toString(),
        userType: 'user',
        addresses: [],
      }
    );

    return newAccount;
  } catch (error: any) {
    console.error("Error creating user:", error);
    throw new Error(error.message || "Gagal membuat akun.");
  }
}

/**
 * Login pengguna dengan membuat sesi baru.
 */
export async function loginUser(email: string, password: string) {
  try {
    await account.deleteSession("current").catch(() => {});
    const newSession = await account.createEmailPasswordSession(email, password);
    return newSession;
  } catch (error: any) {
    console.error("Error during login process:", error);
    throw new Error(error.message || "Email atau password salah.");
  }
}

/**
 * Mengambil data pengguna yang sedang login.
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
    console.log("No active session or user profile found.");
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

// ... (Fungsi getArticleById bisa ditambahkan kembali jika perlu)

// =================================================================
// FUNGSI PRODUK (PROPERTIES)
// =================================================================

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

export async function getPropertyById({ id }: { id: string }) {
  try {
    const propertyDoc = await databases.getDocument(
      config.databaseId!,
      config.stokCollectionId!,
      id
    );
    if (!propertyDoc) throw new Error("Produk tidak ditemukan.");

    if (propertyDoc.agent?.$id) {
      propertyDoc.agent = await databases.getDocument(
        config.databaseId!,
        config.agentsCollectionId!,
        propertyDoc.agent.$id
      );
    }
    
    if (propertyDoc.reviews?.length > 0) {
      const reviewPromises = propertyDoc.reviews.map((review: any) =>
        databases.getDocument(config.databaseId!, config.reviewsCollectionId!, review.$id)
      );
      propertyDoc.reviews = await Promise.all(reviewPromises);
    }

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

// =================================================================
// FUNGSI KERANJANG BELANJA (CART)
// =================================================================

/**
 * Menambahkan produk ke keranjang pengguna.
 * Jika produk sudah ada, akan menambah quantity-nya.
 */
export async function addToCart(userId: string, productId: string) {
  try {
    const existingCartItem = await databases.listDocuments(
      config.databaseId!,
      config.keranjangCollectionId!,
      [Query.equal("userId", userId), Query.equal("productId", productId)]
    );

    if (existingCartItem.documents.length > 0) {
      const item = existingCartItem.documents[0];
      const newQuantity = item.quantity + 1;
      return await databases.updateDocument(
        config.databaseId!,
        config.keranjangCollectionId!,
        item.$id,
        { quantity: newQuantity }
      );
    } else {
      return await databases.createDocument(
        config.databaseId!,
        config.keranjangCollectionId!,
        ID.unique(),
        { userId, productId, quantity: 1 }
      );
    }
  } catch (error: any) {
    console.error("Error adding to cart:", error);
    throw new Error(error.message || "Gagal menambahkan ke keranjang.");
  }
}

/**
 * Mengambil semua item di keranjang milik seorang pengguna.
 */
export async function getCartItems(userId: string) {
  try {
    const result = await databases.listDocuments(
      config.databaseId!,
      config.keranjangCollectionId!,
      [Query.equal("userId", userId)]
    );
    return result.documents;
  } catch (error) {
    console.error('Error fetching cart items:', error);
    return [];
  }
}

// =================================================================
// FUNGSI PESANAN (ORDERS)
// =================================================================

/**
 * Membuat pesanan baru dan membersihkan keranjang.
 */
export async function createOrder(
    userId: string, 
    shippingAddress: string, 
    totalAmount: number,
    cartItems: any[]
) {
    if (!cartItems || cartItems.length === 0) {
        throw new Error("Keranjang kosong, tidak bisa membuat pesanan.");
    }

    try {
        // 1. Buat dokumen pesanan utama
        const newOrder = await databases.createDocument(
            config.databaseId!,
            config.ordersCollectionId!,
            ID.unique(),
            { userId, shippingAddress, totalAmount, status: 'pending' }
        );

        if (!newOrder) throw new Error("Gagal membuat data pesanan.");

        // 2. Simpan setiap item keranjang ke dalam 'order_items'
        for (const item of cartItems) {
            await databases.createDocument(
                config.databaseId!,
                config.orderItemsCollectionId!,
                ID.unique(),
                {
                    orderId: newOrder.$id,
                    productId: item.productId,
                    quantity: item.quantity,
                    priceAtPurchase: item.product?.price || 0
                }
            );
        }

        // 3. Bersihkan keranjang belanja pengguna setelah pesanan dibuat
        for (const item of cartItems) {
            await databases.deleteDocument(config.databaseId!, config.keranjangCollectionId!, item.$id);
        }

        // Kembalikan ID pesanan baru untuk halaman konfirmasi
        return newOrder.$id;

    } catch (error: any) {
        console.error("Error creating order:", error);
        throw new Error(error.message || "Gagal membuat pesanan.");
    }
}

// =================================================================
// FUNGSI ALAMAT PENGGUNA (USER ADDRESS)
// =================================================================

/**
 * Mengambil daftar alamat pengguna.
 */
export async function getUserAddresses(userId: string): Promise<any[]> {
    try {
        const userDoc = await databases.getDocument(
            config.databaseId!,
            config.usersProfileCollectionId!,
            userId
        );
        // addresses disimpan sebagai string JSON, jadi kita perlu parse
        return userDoc.addresses ? JSON.parse(userDoc.addresses) : [];
    } catch (error) {
        console.error("Gagal mengambil alamat:", error);
        return [];
    }
}

/**
 * Menambahkan alamat baru untuk pengguna.
 */
export async function addUserAddress(userId: string, newAddress: { label: string, detail: string }) {
    try {
        const currentAddresses = await getUserAddresses(userId);
        const updatedAddresses = [...currentAddresses, newAddress];
        
        await databases.updateDocument(
            config.databaseId!,
            config.usersProfileCollectionId!,
            userId,
            { addresses: JSON.stringify(updatedAddresses) } // Simpan kembali sebagai string JSON
        );
        return updatedAddresses;
    } catch (error: any) {
        console.error("Gagal menambah alamat:", error);
        throw new Error(error.message);
    }
}

/**
 * Menghapus alamat dari daftar pengguna.
 */
export async function deleteUserAddress(userId: string, addressToDelete: { label: string, detail: string }) {
    try {
        const currentAddresses = await getUserAddresses(userId);
        const updatedAddresses = currentAddresses.filter(
            addr => addr.label !== addressToDelete.label || addr.detail !== addressToDelete.detail
        );

        await databases.updateDocument(
            config.databaseId!,
            config.usersProfileCollectionId!,
            userId,
            { addresses: JSON.stringify(updatedAddresses) }
        );
        return updatedAddresses;
    } catch (error: any) {
        console.error("Gagal menghapus alamat:", error);
        throw new Error(error.message);
    }
}