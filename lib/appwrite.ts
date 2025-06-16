import {
  Account,
  Avatars,
  Client,
  Databases,
  Query,
  Storage
} from "react-native-appwrite";

export const config = {
  platform: "com.saqcloth.gumisaq",
  endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT,
  projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
  databaseId: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID,
  artikelCollectionId:process.env.EXPO_PUBLIC_APPWRITE_ARTIKEL_COLLECTION_ID,
  foodRecallCollectionId: process.env.EXPO_PUBLIC_APPWRITE_FOOD_RECALL_COLLECTION_ID,
  usersProfileCollectionId: process.env.EXPO_PUBLIC_APPWRITE_USERS_PROFILE_COLLECTION_ID,
  ahligiziCollectionId: process.env.EXPO_PUBLIC_APPWRITE_AHLIGIZI_COLLECTION_ID,
  chatMessagesCollectionId: process.env.EXPO_PUBLIC_APPWRITE_CHAT_MESSAGES_COLLECTION_ID,
  adminChatCollectionId: process.env.EXPO_PUBLIC_APPWRITE_ADMIN_CHAT_COLLECTION_ID,
  propertiesCollectionId:
  process.env.EXPO_PUBLIC_APPWRITE_PROPERTIES_COLLECTION_ID,
  storageBucketId: process.env.EXPO_PUBLIC_APPWRITE_STORAGE_BUCKET_ID || 'default',
};

export const client = new Client();
client
  .setEndpoint(config.endpoint!)
  .setProject(config.projectId!)
  .setPlatform(config.platform!);

export const avatar = new Avatars(client);
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

// Simpan data user yang sedang login
let currentUser: any = null;

export async function getCurrentUser() {
  try {
    if (currentUser) {
      console.log("Returning current user:", currentUser);
      return currentUser;
    }
    console.log("No current user found");
    return null;
  } catch (error) {
    console.log("Error getting current user:", error);
    return null;
  }
}

export async function loginUser(email: string, password: string) {
  try {
    console.log("Mencoba login dengan email:", email);
    
    const users = await databases.listDocuments(
      config.databaseId!,
      config.usersProfileCollectionId!,
      [Query.equal("email", email)]
    );

    console.log("Query result:", {
      totalUsers: users.documents.length,
      firstUser: users.documents[0] ? {
        email: users.documents[0].email,
        hasPassword: !!users.documents[0].password,
        currentUserType: users.documents[0].userType
      } : null
    });

    if (users.documents.length === 1) {
      const user = users.documents[0];
      
      const inputPass = String(password).trim();
      const storedPass = user.password ? String(user.password).trim() : '';
      console.log("Password comparison:", {
        inputLength: inputPass.length,
        storedLength: storedPass.length,
        isMatch: inputPass === storedPass
      });

      if (storedPass && inputPass === storedPass) {
        console.log("Login berhasil untuk user:", user.email);

        try {
          if (user.userType !== "user") {
            await databases.updateDocument(
              config.databaseId!,
              config.usersProfileCollectionId!,
              user.$id,
              {
                userType: "user",
                lastSeen: new Date().toISOString()
              }
            );
          }

          // Simpan data user yang login
          currentUser = {
            $id: user.$id,
            name: user.name || email.split('@')[0],
            email: user.email,
            avatar: avatar.getInitials(user.name || email.split('@')[0]).toString(),
            userType: "user"
          };

          console.log("Current user set to:", currentUser);
        } catch (updateError) {
          console.error("Gagal update user type:", updateError);
        }

        return true;
      } else {
        console.log("Password tidak cocok");
        throw new Error("Email atau password salah");
      }
    } else {
      console.log("User tidak ditemukan");
      throw new Error("Email atau password salah");
    }
  } catch (error) {
    console.error("Login user error:", error);
    return false;
  }
}

export async function loginadmin(email: string, password: string) {
  try {
    console.log("Mencoba login admin gizi dengan email:", email);

    const admins = await databases.listDocuments(
      config.databaseId!,
      config.ahligiziCollectionId!,
      [Query.equal("email", email)]
    );

    console.log("Query result ahli gizi:", {
      totalFound: admins.documents.length,
      firstadmin: admins.documents[0] ? {
        email: admins.documents[0].email,
        hasPassword: !!admins.documents[0].password,
        currentUserType: admins.documents[0].userType
      } : null
    });

    if (admins.documents.length === 1) {
      const admin = admins.documents[0];
      
      const inputPass = String(password).trim();
      const storedPass = admin.password ? String(admin.password).trim() : '';
      console.log("Password comparison admin:", {
        inputLength: inputPass.length,
        storedLength: storedPass.length,
        isMatch: inputPass === storedPass
      });

      if (storedPass && inputPass === storedPass) {
        console.log("Login berhasil untuk ahli gizi:", admin.email);
        
        const updateData: any = {
          status: "online",
          lastSeen: new Date().toISOString()
        };

        if (admin.userType !== "admin") {
          updateData.userType = "admin";
        }

        try {
          await databases.updateDocument(
            config.databaseId!,
            config.ahligiziCollectionId!,
            admin.$id,
            updateData
          );

          // Simpan data admin yang login
          currentUser = {
            $id: admin.$id,
            name: admin.name || email.split('@')[0],
            email: admin.email,
            avatar: avatar.getInitials(admin.name || email.split('@')[0]).toString(),
            userType: "admin",
            specialization: admin.specialization,
            status: "online"
          };

          console.log("Current user (admin) set to:", currentUser);
        } catch (updateError) {
          console.error("Gagal update status:", updateError);
        }

        return {
          admin: {
            ...admin,
            userType: "admin",
            status: "online",
            lastSeen: new Date().toISOString()
          }
        };
      } else {
        console.log("Password tidak cocok untuk ahli gizi");
        throw new Error("Email atau password salah");
      }
    } else {
      console.log("Ahli gizi tidak ditemukan dengan email:", email);
      throw new Error("Email atau password salah");
    }
  } catch (error) {
    console.error("Login ahli gizi error:", error);
    return false;
  }
}

export async function logout() {
  try {
    currentUser = null;
    console.log("User logged out, currentUser cleared");
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

export async function logoutadmin(adminId: string) {
  try {
    await databases.updateDocument(
      config.databaseId!,
      config.ahligiziCollectionId!,
      adminId,
      {
        status: 'offline',
        lastSeen: new Date().toISOString()
      }
    );
    currentUser = null;
    console.log("admin logged out, currentUser cleared");
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
}

//artikel
export async function getArticles() {
  try {
    const result = await databases.listDocuments(
      config.databaseId!,
      config.artikelCollectionId!,
      [
        Query.equal("isPublished", true),
        Query.orderDesc("$createdAt")
      ]
    );
    
    // Transform the response to match our Article interface
    const articles = result.documents.map(doc => ({
      $id: doc.$id,
      $createdAt: doc.$createdAt,
      $updatedAt: doc.$updatedAt,
      title: doc.title,
      description: doc.description,
      content: doc.content,
      image: doc.image,
      category: doc.category,
      author: doc.author,
      tags: doc.tags || [],
      isPublished: doc.isPublished,
      viewCount: doc.viewCount || 0
    }));

    return articles;
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

    // Transform the response to match our Article interface
    const article = {
      $id: doc.$id,
      $createdAt: doc.$createdAt,
      $updatedAt: doc.$updatedAt,
      title: doc.title,
      description: doc.description,
      content: doc.content,
      image: doc.image,
      category: doc.category,
      author: doc.author,
      tags: doc.tags || [],
      isPublished: doc.isPublished,
      viewCount: doc.viewCount || 0
    };

    // Update view count
    if (doc.isPublished) {
      await databases.updateDocument(
        config.databaseId!,
        config.artikelCollectionId!,
        id,
        {
          viewCount: (doc.viewCount || 0) + 1
        }
      );
    }

    return article;
  } catch (error) {
    console.error('Error fetching article:', error);
    return null;
  }
}
//artikel last

//get properti atau stok barang 
export async function getLatestProperties() {
  try {
    const result = await databases.listDocuments(
      config.databaseId!,
      config.propertiesCollectionId!,
      [Query.orderAsc("$createdAt"), Query.limit(5)]
    );

    return result.documents;
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function getProperties({
  filter,
  query,
  limit,
}: {
  filter: string;
  query: string;
  limit?: number;
}) {
  try {
    const buildQuery = [Query.orderDesc("$createdAt")];

    if (filter && filter !== "All")
      buildQuery.push(Query.equal("type", filter));

    if (query)
      buildQuery.push(
        Query.or([
          Query.search("name", query),
          Query.search("address", query),
          Query.search("type", query),
        ])
      );

    if (limit) buildQuery.push(Query.limit(limit));

    const result = await databases.listDocuments(
      config.databaseId!,
      config.propertiesCollectionId!,
      buildQuery
    );

    return result.documents;
  } catch (error) {
    console.error(error);
    return [];
  }
}

// write function to get property by id
export async function getPropertyById({ id }: { id: string }) {
  try {
    const result = await databases.getDocument(
      config.databaseId!,
      config.propertiesCollectionId!,
      id
    );
    return result;
  } catch (error) {
    console.error(error);
    return null;
  }
}

