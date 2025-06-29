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
  collectionId: process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_ID,

  // artikel
  artikelCollectionId: process.env.EXPO_PUBLIC_APPWRITE_ARTIKEL_COLLECTION_ID,

  //toko
  usersProfileCollectionId: process.env.EXPO_PUBLIC_APPWRITE_USERS_PROFILE_COLLECTION_ID,
  galleriesCollectionId: process.env.EXPO_PUBLIC_APPWRITE_GALLERIES_COLLECTION_ID,
  reviewsCollectionId: process.env.EXPO_PUBLIC_APPWRITE_REVIEWS_COLLECTION_ID,
  agentsCollectionId: process.env.EXPO_PUBLIC_APPWRITE_AGENTS_COLLECTION_ID,
  stokCollectionId: process.env.EXPO_PUBLIC_APPWRITE_STOK_COLLECTION_ID,
  keranjangCollectionId: process.env.EXPO_PUBLIC_APPWRITE_KERANJANG_COLLECTION_ID,
  ordersCollectionId: process.env.EXPO_PUBLIC_APPWRITE_ORDERS_COLLECTION_ID,
  orderItemsCollectionId: process.env.EXPO_PUBLIC_APPWRITE_ORDER_ITEMS_COLLECTION_ID,

  //edit
  shirtColorsCollectionId: process.env.EXPO_PUBLIC_APPWRITE_COLORS_COLLECTION_ID,
  designStickersCollectionId: process.env.EXPO_PUBLIC_APPWRITE_STICKERS_COLLECTION_ID,
  designFontsCollectionId: process.env.EXPO_PUBLIC_APPWRITE_FONTS_COLLECTION_ID,
  finishedDesignsCollectionId: "68616d2f002cb7063304",

  adminCollectionId: process.env.EXPO_PUBLIC_APPWRITE_ADMIN_COLLECTION_ID,
};

// Inisialisasi Klien Appwrite
const client = new Client();
if (config.endpoint && config.projectId && config.platform) {
    client
      .setEndpoint(config.endpoint)
      .setProject(config.projectId)
      .setPlatform(config.platform);
} else {
    console.error("Konfigurasi Appwrite tidak lengkap. Silakan periksa variabel lingkungan Anda.");
}

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

    // Saat membuat user, inisialisasi 'addresses' dengan array kosong
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
        addresses: [], // Inisialisasi 'addresses' sebagai array kosong
      }
    );

    return newAccount;
  } catch (error: any) {
    console.error("Error saat membuat pengguna:", error);
    throw new Error(error.message || "Gagal membuat akun.");
  }
}

/**
 * Login pengguna dengan membuat sesi baru.
 */
export async function loginUser(email: string, password: string) {
  try {
    // Menghapus sesi lama untuk memastikan login yang bersih
    await account.deleteSession("current").catch(() => {});
    return await account.createEmailPasswordSession(email, password);
  } catch (error: any) {
    console.error("Error saat proses login:", error);
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

    const userDoc = await databases.getDocument(
      config.databaseId!,
      config.usersProfileCollectionId!,
      currentAccount.$id
    );

    return {
      $id: userDoc.$id,
      name: userDoc.name,
      email: userDoc.email,
      avatar: userDoc.avatar,
      userType: userDoc.userType as 'user' | 'admin' | 'agent',
      alamat: userDoc.alamat,
      noHp: userDoc.noHp || '',
    };
  } catch (error) {
    console.log("Tidak ada sesi aktif atau profil pengguna tidak ditemukan.");
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
    console.error("Error saat logout:", error.message);
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
    console.error('Error saat mengambil artikel:', error);
    return [];
  }
}

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
    console.error("Error saat mengambil produk terbaru:", error);
    return [];
  }
}

export async function getProperties({ filter, query, limit }: { filter?: string; query?: string; limit?: number; }) {
  try {
    const queries: any[] = [Query.orderDesc("$createdAt")];
    if (filter && filter !== "All") queries.push(Query.equal("type", filter));
    if (query) queries.push(Query.search("name", query));
    if (limit) queries.push(Query.limit(limit));
    return (await databases.listDocuments(config.databaseId!, config.stokCollectionId!, queries)).documents;
  } catch (error) {
    console.error("Error saat mengambil produk:", error);
    return [];
  }
}

export async function getPropertyById({ id }: { id: string }) {
  try {
    const propertyDoc = await databases.getDocument(config.databaseId!, config.stokCollectionId!, id);
    if (!propertyDoc) return null;

    if (propertyDoc.agent?.$id) {
      propertyDoc.agent = await databases.getDocument(config.databaseId!, config.agentsCollectionId!, propertyDoc.agent.$id);
    }
    if (Array.isArray(propertyDoc.reviews) && propertyDoc.reviews.length > 0) {
      propertyDoc.reviews = await Promise.all(propertyDoc.reviews.map((review: any) =>
        databases.getDocument(config.databaseId!, config.reviewsCollectionId!, review.$id)
      ));
    }
    if (Array.isArray(propertyDoc.gallery) && propertyDoc.gallery.length > 0) {
      propertyDoc.gallery = await Promise.all(propertyDoc.gallery.map((image: any) =>
        databases.getDocument(config.databaseId!, config.galleriesCollectionId!, image.$id)
      ));
    }
    return propertyDoc;
  } catch (error) {
    console.error(`Error saat mengambil produk berdasarkan ID (${id}):`, error);
    return null;
  }
}

// =================================================================
// FUNGSI KERANJANG BELANJA (CART)
// =================================================================

export async function addToCart(userId: string, productId: string) {
  try {
    const existingItems = await databases.listDocuments(
      config.databaseId!,
      config.keranjangCollectionId!,
      [Query.equal("userId", userId), Query.equal("productId", productId), Query.limit(1)]
    );

    if (existingItems.documents.length > 0) {
      const item = existingItems.documents[0];
      return await databases.updateDocument(
        config.databaseId!,
        config.keranjangCollectionId!,
        item.$id,
        { quantity: item.quantity + 1 }
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
    console.error("Error saat menambah ke keranjang:", error);
    throw new Error(error.message || "Gagal menambahkan ke keranjang.");
  }
}

export async function getCartItems(userId: string) {
  try {
    const result = await databases.listDocuments(
      config.databaseId!,
      config.keranjangCollectionId!,
      [Query.equal("userId", userId), Query.orderDesc("$createdAt")]
    );
    return result.documents;
  } catch (error) {
    console.error('Error saat mengambil item keranjang:', error);
    return [];
  }
}

// =================================================================
// FUNGSI ALAMAT PENGGUNA (USER ADDRESS)
// =================================================================

/**
 * Mengambil daftar alamat pengguna dan mengubahnya dari string JSON menjadi objek.
 */
export async function getUserAddresses(userId: string): Promise<Array<{ label: string, detail: string }>> {
    try {
        const userDoc = await databases.getDocument(config.databaseId!, config.usersProfileCollectionId!, userId);
        if (userDoc.addresses && Array.isArray(userDoc.addresses)) {
          // Parse setiap string JSON di dalam array menjadi objek
          return userDoc.addresses.map((addrStr: string) => JSON.parse(addrStr));
        }
        return [];
    } catch (error) {
        console.error("Gagal mengambil alamat:", error);
        return [];
    }
}

/**
 * Menambahkan alamat baru untuk pengguna dengan mengubah objek menjadi string JSON.
 */
export async function addUserAddress(userId: string, newAddress: { label: string, detail: string }) {
    try {
        const userDoc = await databases.getDocument(config.databaseId!, config.usersProfileCollectionId!, userId);
        const currentAddresses = userDoc.addresses || [];
        
        // Ubah objek alamat baru menjadi string sebelum menambahkannya ke array
        const updatedAddresses = [...currentAddresses, JSON.stringify(newAddress)];
        
        await databases.updateDocument(config.databaseId!, config.usersProfileCollectionId!, userId, { addresses: updatedAddresses });
        return updatedAddresses.map((addr: string) => JSON.parse(addr));
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
        const userDoc = await databases.getDocument(config.databaseId!, config.usersProfileCollectionId!, userId);
        const currentAddresses = userDoc.addresses || [];

        // Ubah objek yang akan dihapus menjadi string untuk perbandingan
        const addressToDeleteString = JSON.stringify(addressToDelete);
        const updatedAddresses = currentAddresses.filter(
            (addrStr: string) => addrStr !== addressToDeleteString
        );

        await databases.updateDocument(config.databaseId!, config.usersProfileCollectionId!, userId, { addresses: updatedAddresses });
        return updatedAddresses.map((addr: string) => JSON.parse(addr));
    } catch (error: any) {
        console.error("Gagal menghapus alamat:", error);
        throw new Error(error.message);
    }
}

// =================================================================
// FUNGSI PESANAN (ORDERS)
// =================================================================

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
        const newOrder = await databases.createDocument(
            config.databaseId!,
            config.ordersCollectionId!,
            ID.unique(),
            { userId, shippingAddress, totalAmount, status: 'pending' }
        );
        if (!newOrder) throw new Error("Gagal membuat data pesanan.");

        const itemPromises = cartItems.map(item => 
            Promise.all([
                databases.createDocument(
                    config.databaseId!,
                    config.orderItemsCollectionId!,
                    ID.unique(),
                    {
                        orderId: newOrder.$id,
                        productId: item.productId,
                        quantity: item.quantity,
                        priceAtPurchase: item.product?.price || 0
                    }
                ),
                databases.deleteDocument(config.databaseId!, config.keranjangCollectionId!, item.$id)
            ])
        );

        await Promise.all(itemPromises);
        return newOrder.$id;

    } catch (error: any) {
        console.error("Error saat membuat pesanan:", error);
        throw new Error(error.message || "Gagal membuat pesanan.");
    }
}

// =================================================================
// FUNGSI AGEN
// =================================================================

/**
 * Mendaftarkan user sebagai agen baru.
 */
export async function registerAsAgent(userId: string, agentData: { storeName: string; phoneNumber: string; }) {
  try {
    // 1. Buat dokumen baru di collection 'agents'
    await databases.createDocument(
      config.databaseId!,
      config.agentsCollectionId!,
      userId, // Gunakan ID user sebagai ID dokumen agen untuk relasi 1-to-1
      {
        name: agentData.storeName,
        phone: agentData.phoneNumber,
        owner: userId, // Relasi ke dokumen user
      }
    );

    // 2. Update userType di collection 'users' menjadi 'agent'
    await databases.updateDocument(
      config.databaseId!,
      config.usersProfileCollectionId!,
      userId,
      {
        userType: 'agent'
      }
    );

  } catch (error: any) {
    console.error("Error saat mendaftar sebagai agen:", error);
    // Cek jika error karena agen sudah ada
    if (error.code === 409) { // 409 Conflict (Document already exists)
      throw new Error("Anda sudah terdaftar sebagai agen.");
    }
    throw new Error(error.message || "Gagal mendaftar sebagai agen.");
  }
}

// =================================================================
// FUNGSI DESAIN BAJU (SHIRT DESIGNS)
// =================================================================

// =================================================================
// FUNGSI ASET DESAIN
// =================================================================

/**
 * Mengambil daftar warna baju dari database.
 */
export async function getShirtColors() {
  try {
    const colors = await databases.listDocuments(
      config.databaseId!,
      config.shirtColorsCollectionId!,
      [Query.orderAsc('order')]
    );
    return colors.documents;
  } catch (error) {
    console.error("Error fetching shirt colors:", error);
    throw new Error("Gagal memuat warna.");
  }
}

/**
 * Mengambil daftar stiker dari database.
 */
export async function getDesignStickers() {
  try {
    const stickers = await databases.listDocuments(
      config.databaseId!,
      config.designStickersCollectionId!, // Pastikan ID koleksi ini benar
      [Query.orderAsc('order')]
    );

    // Langsung gunakan URL dari atribut 'imageFileId'
    return stickers.documents.map(doc => ({
      ...doc,
      imageUrl: doc.imageFileId // <-- PERBAIKAN UTAMA DI SINI
    }));

  } catch (error) {
    console.error("Error fetching design stickers:", error);
    throw new Error("Gagal memuat stiker. Pastikan koleksi dan atribut sudah benar.");
  }
}

/**
 * Mengambil daftar font dari database.
 */
export async function getDesignFonts() {
  try {
    const fonts = await databases.listDocuments(
      config.databaseId!,
      config.designFontsCollectionId!,
      [Query.orderAsc('order')]
    );
    return fonts.documents;
  } catch (error) {
    console.error("Error fetching design fonts:", error);
    throw new Error("Gagal memuat font.");
  }
}

export async function saveFinishedDesign(
    userId: string, 
    name: string, 
    imageUrl: string,
    designData: string, // Tambahkan parameter ini
    shirtColor: string   // Tambahkan parameter ini
) {
  try {
    if (!config.finishedDesignsCollectionId) {
      throw new Error("ID Koleksi Desain Final belum diatur.");
    }

    await databases.createDocument(
      config.databaseId!,
      config.finishedDesignsCollectionId,
      ID.unique(),
      {
        userId,
        name,
        imageUrl,
        designData, // Simpan data JSON
        shirtColor, // Simpan warna kaos
      }
    );
  } catch (error: any) {
    console.error("Error saat menyimpan gambar desain:", error);
    throw new Error(error.message || "Gagal menyimpan gambar desain.");
  }
}

export { ID };

export async function getFinishedDesigns(userId: string) {
  try {
    if (!config.finishedDesignsCollectionId) {
      throw new Error("ID Koleksi Desain Final belum diatur.");
    }
    const designs = await databases.listDocuments(
      config.databaseId!,
      config.finishedDesignsCollectionId,
      [Query.equal("userId", userId), Query.orderDesc("$createdAt")]
    );
    return designs.documents;
  } catch (error: any) {
    console.error("Error saat mengambil desain final:", error);
    throw new Error(error.message || "Gagal mengambil desain final.");
  }
}

export async function addCustomDesignToCart(
  userId: string,
  design: {
    name: string;
    imageUrl: string;
    designData: string;
  }
) {
  try {
    // 1. Hitung harga berdasarkan jumlah stiker
    const TSHIRT_PRICE = 30000;
    const STICKER_PRICE = 15000;
    const elements = JSON.parse(design.designData);
    const stickerCount = elements.filter((el: any) => el.type === 'sticker').length;
    const finalPrice = TSHIRT_PRICE + stickerCount * STICKER_PRICE;
    
    // 2. Buat produk baru di koleksi 'stok'
    const customProduct = await databases.createDocument(
      config.databaseId!,
      config.stokCollectionId!, // Menggunakan koleksi stok yang sudah ada
      ID.unique(),
      {
        name: design.name || `Desain Kustom #${ID.unique().slice(0, 6)}`,
        price: finalPrice,
        description: `Kaos kustom dengan ${stickerCount} stiker.`,
        image: design.imageUrl,
        type: "Baju", // Kategori produk
        agentId: config.adminCollectionId, // Diatur sebagai produk dari Admin
        status: 'active',
        gallery: [], // Galeri bisa dikosongkan
        isCustom: true, // Tambahkan flag ini jika Anda ingin membedakannya
      }
    );

    if (!customProduct) {
      throw new Error("Gagal membuat produk kustom di database.");
    }
    
    // 3. Tambahkan produk yang baru dibuat ke keranjang pengguna
    await addToCart(userId, customProduct.$id);

    return customProduct;

  } catch (error: any) {
    console.error("Error menambah desain kustom ke keranjang:", error);
    throw new Error(error.message || "Gagal memproses desain kustom.");
  }
}