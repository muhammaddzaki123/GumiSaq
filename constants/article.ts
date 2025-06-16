export interface Article {
	$id: string;
	$createdAt: string;
	$updatedAt: string;
	title: string;
	description: string;
	content: string;
	image: string;
	category: "Hiburan" | "Benda" | "Tradisi" | "Adat";
	author: string;
	tags: string[];
	isPublished: boolean;
	viewCount: number;
}