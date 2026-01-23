import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

@Injectable()
export class SearchService {
    private embeddings: GoogleGenerativeAIEmbeddings;
    private readonly logger = new Logger(SearchService.name);

    constructor(private prisma: PrismaService) {
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            this.logger.warn('GOOGLE_API_KEY is not set. Vector search will not work.');
        }

        this.embeddings = new GoogleGenerativeAIEmbeddings({
            apiKey: apiKey,
            modelName: "models/text-embedding-004",
        });
    }

    async indexPost(postId: string, title: string, content: string) {
        if (!process.env.GOOGLE_API_KEY) return;

        try {
            const textToEmbed = `${title}\n\n${content}`;

            this.logger.log(`Generating embedding for post ${postId}...`);
            const vector = await this.embeddings.embedQuery(textToEmbed);

            // Format vector as string for SQL: '[0.1, 0.2, ...]'
            const vectorString = `[${vector.join(',')}]`;

            // Use raw SQL to update vector column
            await this.prisma.$executeRawUnsafe(
                `UPDATE posts SET embedding = $1::vector WHERE id = $2`,
                vectorString,
                postId
            );
            this.logger.log(`Embedding updated for post ${postId}`);
        } catch (error) {
            this.logger.error(`Failed to index post ${postId}`, error);
        }
    }

    async search(query: string, limit = 5) {
        if (!process.env.GOOGLE_API_KEY) return [];

        try {
            const queryVector = await this.embeddings.embedQuery(query);
            const vectorString = `[${queryVector.join(',')}]`;

            // pgvector distance operator: <=> (cosine distance)
            // Order by distance ASC (smaller distance = more similar)
            // Filter by 1 - distance > threshold (or distance < 0.55 for ~0.45 similarity)
            // Cosine distance range is [0, 2]. 0 is identical.
            // Similarity = 1 - distance (roughly for normalized vectors)

            // Let's settle on distance < 0.6 (approx > 0.4 similarity)
            const results = await this.prisma.$queryRawUnsafe(
                `SELECT id, title, slug, excerpt, content, "featuredImage", "publishedAt", "createdAt",
                 1 - (embedding <=> $1::vector) as similarity
                 FROM posts
                 WHERE status = 'published'
                 AND 1 - (embedding <=> $1::vector) > 0.45 
                 ORDER BY similarity DESC
                 LIMIT $2`,
                vectorString,
                limit
            );

            return results;
        } catch (error) {
            this.logger.error('Vector search failed', error);
            // Fallback: return empty or try basic search if needed
            return [];
        }
    }
}
