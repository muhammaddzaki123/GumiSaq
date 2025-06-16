import { config, databases } from "./appwrite";

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
			description2: doc.description2, // tambahkan
			description3: doc.description3, // tambahkan
			content: doc.content,
			image: doc.image,
			image2: doc.image2, // tambahkan
			image3: doc.image3, // tambahkan
			category: doc.category,
			author: doc.author,
			tags: doc.tags || [],
			isPublished: doc.isPublished,
			viewCount: doc.viewCount || 0,
			created: doc.created || doc.$createdAt, // tambahkan jika ada
		};

		if (doc.isPublished) {
			await databases.updateDocument(
				config.databaseId!,
				config.artikelCollectionId!,
				id,
				{
					viewCount: (doc.viewCount || 0) + 1,
				}
			);
		}

		return article;
	} catch (error) {
		console.error("Error fetching article:", error);
		return null;
	}
}
