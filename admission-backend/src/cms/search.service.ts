import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { ChunkingService } from './chunking.service';

@Injectable()
export class SearchService {
    private embeddings: GoogleGenerativeAIEmbeddings;
    private readonly logger = new Logger(SearchService.name);

    constructor(
        private prisma: PrismaService,
        private chunkingService: ChunkingService
    ) {
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            this.logger.warn('GOOGLE_API_KEY is not set. Vector search will not work.');
        }

        this.embeddings = new GoogleGenerativeAIEmbeddings({
            apiKey: apiKey,
            modelName: "models/gemini-embedding-001",
        });
    }

    async indexPostWithChunks(postId: string, title: string, content: string) {
        if (!process.env.GOOGLE_API_KEY) return;

        try {
            const fullText = `${title}\n\n${content}`;
            const fullVector = await this.embeddings.embedQuery(fullText);
            const fullVectorString = `[${fullVector.join(',')}]`;

            await this.prisma.$executeRawUnsafe(
                `UPDATE posts SET embedding = $1::vector WHERE id = $2`,
                fullVectorString,
                postId
            );

            await this.prisma.$executeRaw`DELETE FROM post_chunks WHERE "postId" = ${postId}`;

            const chunks = this.chunkingService.smartChunk(content, 500, 100);

            for (const chunk of chunks) {
                const chunkText = `${title}\n\n${chunk.content}`;
                const chunkVector = await this.embeddings.embedQuery(chunkText);
                const chunkVectorString = `[${chunkVector.join(',')}]`;

                await this.prisma.$executeRawUnsafe(
                    `INSERT INTO post_chunks (id, "postId", content, "chunkIndex", embedding, "createdAt")
                     VALUES (gen_random_uuid(), $1, $2, $3, $4::vector, NOW())`,
                    postId,
                    chunk.content,
                    chunk.index,
                    chunkVectorString
                );

                await new Promise(resolve => setTimeout(resolve, 200));
            }

            this.logger.log(`Successfully indexed post ${postId} with ${chunks.length} chunks`);
        } catch (error) {
            this.logger.error(`Failed to index post ${postId} with chunks`, error);
        }
    }

    async indexPost(postId: string, title: string, content: string) {
        if (!process.env.GOOGLE_API_KEY) return;

        try {
            const textToEmbed = `${title}\n\n${content}`;
            const vector = await this.embeddings.embedQuery(textToEmbed);
            const vectorString = `[${vector.join(',')}]`;

            await this.prisma.$executeRawUnsafe(
                `UPDATE posts SET embedding = $1::vector WHERE id = $2`,
                vectorString,
                postId
            );
        } catch (error) {
            this.logger.error(`Failed to index post ${postId}`, error);
        }
    }

    async searchWithChunks(query: string, limit = 5): Promise<any[]> {
        if (!process.env.GOOGLE_API_KEY) {
            return this.keywordSearch(query, limit);
        }

        try {
            const queryVector = await this.embeddings.embedQuery(query);
            const vectorString = `[${queryVector.join(',')}]`;

            const queryLength = query.trim().length;

            // Hạ thấp threshold ban đầu trong SQL để lấy về nhiều ứng viên hơn
            let sqlThreshold = 0.25;
            if (queryLength > 50) sqlThreshold = 0.20;

            const chunkResults = await this.prisma.$queryRawUnsafe<any[]>(
                `SELECT 
                    pc.id as chunk_id,
                    pc."postId",
                    pc.content as chunk_content,
                    pc."chunkIndex",
                    p.id,
                    p.title,
                    p.slug,
                    p.excerpt,
                    p.content,
                    p."featuredImage",
                    p."publishedAt",
                    p."createdAt",
                    1 - (pc.embedding <=> $1::vector) as similarity
                FROM post_chunks pc
                JOIN posts p ON p.id = pc."postId"
                WHERE p.status = 'published'
                AND pc.embedding IS NOT NULL
                AND 1 - (pc.embedding <=> $1::vector) > $3
                ORDER BY similarity DESC
                LIMIT $2`,
                vectorString,
                limit * 4, // Lấy dư ra nhiều hơn để lọc sau
                sqlThreshold
            );

            const postMap = new Map();

            chunkResults.forEach(result => {
                const existing = postMap.get(result.postId);
                if (!existing || result.similarity > existing.similarity) {
                    postMap.set(result.postId, {
                        id: result.id,
                        title: result.title,
                        slug: result.slug,
                        excerpt: result.excerpt,
                        content: result.content,
                        featuredImage: result.featuredImage,
                        publishedAt: result.publishedAt,
                        createdAt: result.createdAt,
                        similarity: result.similarity,
                        matchedChunk: result.chunk_content,
                        chunkIndex: result.chunkIndex
                    });
                }
            });

            return Array.from(postMap.values())
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, limit)
                .map(r => ({
                    ...r,
                    similarityPercent: Math.round(r.similarity * 100),
                    matchType: 'chunk'
                }));

        } catch (error) {
            this.logger.error('Chunk search failed', error);
            return this.keywordSearch(query, limit);
        }
    }

    async search(query: string, limit = 5): Promise<any[]> {
        if (!process.env.GOOGLE_API_KEY) {
            return this.keywordSearch(query, limit);
        }

        try {
            const queryVector = await this.embeddings.embedQuery(query);
            const vectorString = `[${queryVector.join(',')}]`;

            const results = await this.prisma.$queryRawUnsafe<any[]>(
                `SELECT id, title, slug, excerpt, content, "featuredImage", "publishedAt", "createdAt",
                 1 - (embedding <=> $1::vector) as similarity
                 FROM posts
                 WHERE status = 'published'
                 AND embedding IS NOT NULL
                 AND 1 - (embedding <=> $1::vector) > 0.35
                 ORDER BY similarity DESC
                 LIMIT $2`,
                vectorString,
                limit
            );

            return results.map(r => ({
                ...r,
                similarityPercent: Math.round(r.similarity * 100),
                matchType: 'vector'
            }));
        } catch (error) {
            this.logger.error('Vector search failed', error);
            return this.keywordSearch(query, limit);
        }
    }

    async hybridSearchWithChunks(query: string, limit = 5): Promise<any[]> {
        if (!process.env.GOOGLE_API_KEY) {
            return this.keywordSearch(query, limit);
        }

        try {
            const normalizedQuery = query.trim().toLowerCase();
            if (normalizedQuery.length < 3) {
                return this.keywordSearch(query, limit);
            }

            const chunkResults = await this.searchWithChunks(query, limit * 3);
            const keywordResults = await this.keywordSearch(query, limit * 3);
            const merged = this.mergeAndRank(chunkResults, keywordResults);

            if (merged.length === 0) {
                return [];
            }

            const topScore = merged[0].finalScore || merged[0].similarity || 0;
            let threshold: number;
            let maxResults: number;

            // --- RELAXED ADAPTIVE THRESHOLDS ---
            if (topScore >= 0.80) {
                // Top score tốt (>80%) -> Lấy khá rộng (65%)
                threshold = 0.65;
                maxResults = Math.min(limit, 3);
            } else if (topScore >= 0.70) {
                // Top score khá -> Lấy trung bình (55%)
                threshold = 0.55;
                maxResults = Math.min(limit, 3);
            } else if (topScore >= 0.60) {
                // Top score trung bình -> Lấy thấp (45%)
                threshold = 0.45;
                maxResults = Math.min(limit, 3);
            } else {
                // Top score thấp -> Lấy sàn thấp nhất có thể (35%)
                threshold = 0.35;
                maxResults = Math.min(limit, 3);
            }

            // --- RELAXED RELATIVE FILTER ---
            // Chỉ loại bỏ kết quả nếu nó quá xa so với Top 1 (thấp hơn 25% so với Top 1)
            // Ví dụ: Top 1 là 0.8 -> Relative Threshold là 0.6
            const relativeThreshold = topScore * 0.75;

            const finalThreshold = Math.max(threshold, relativeThreshold);

            const filtered = merged.filter(r => {
                const score = r.finalScore || r.similarity || 0;
                return score >= finalThreshold;
            });

            return filtered.slice(0, maxResults).map(r => ({
                ...r,
                similarityPercent: Math.round((r.finalScore || r.similarity || 0) * 100),
                _searchMeta: {
                    topScore: Math.round(topScore * 100),
                    threshold: Math.round(finalThreshold * 100),
                    totalBeforeFilter: merged.length
                }
            }));
        } catch (error) {
            this.logger.error('Hybrid chunk search failed', error);
            return this.keywordSearch(query, limit);
        }
    }

    async hybridSearch(query: string, limit = 5): Promise<any[]> {
        if (!process.env.GOOGLE_API_KEY) {
            return this.keywordSearch(query, limit);
        }

        try {
            const vectorResults = await this.search(query, limit * 2);
            const keywordResults = await this.keywordSearch(query, limit * 2);
            const merged = this.mergeAndRank(vectorResults, keywordResults);

            return merged.slice(0, limit).map(r => ({
                ...r,
                similarityPercent: Math.round((r.finalScore || r.similarity || 0) * 100)
            }));
        } catch (error) {
            this.logger.error('Hybrid search failed', error);
            return this.keywordSearch(query, limit);
        }
    }

    private async keywordSearch(query: string, limit = 5): Promise<any[]> {
        const normalizedQuery = query.trim().toLowerCase();

        const results = await this.prisma.post.findMany({
            where: {
                status: 'published',
                OR: [
                    { title: { contains: query, mode: 'insensitive' } },
                    { content: { contains: query, mode: 'insensitive' } },
                    { excerpt: { contains: query, mode: 'insensitive' } }
                ]
            },
            select: {
                id: true,
                title: true,
                slug: true,
                excerpt: true,
                content: true,
                featuredImage: true,
                publishedAt: true,
                createdAt: true
            },
            take: limit * 2
        });

        const scoredResults = results.map(r => {
            let score = 0;
            const titleLower = r.title.toLowerCase();
            const excerptLower = (r.excerpt || '').toLowerCase();
            const contentLower = r.content.toLowerCase();

            if (titleLower.includes(normalizedQuery)) {
                score += 0.5;
                if (titleLower === normalizedQuery) score += 0.3;
                else if (titleLower.startsWith(normalizedQuery)) score += 0.2;
            }

            if (excerptLower.includes(normalizedQuery)) {
                score += 0.3;
            }

            if (contentLower.includes(normalizedQuery)) {
                score += 0.2;
            }

            return {
                ...r,
                similarity: Math.min(score, 1.0),
                similarityPercent: Math.round(Math.min(score, 1.0) * 100),
                matchType: 'keyword'
            };
        });

        return scoredResults
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit);
    }

    private mergeAndRank(vectorResults: any[], keywordResults: any[]) {
        const scoreMap = new Map();

        vectorResults.forEach((r, idx) => {
            const vectorScore = r.similarity || 0;
            const positionScore = (vectorResults.length - idx) / vectorResults.length;
            const finalScore = (vectorScore * 0.7) + (positionScore * 0.1);

            scoreMap.set(r.id, {
                ...r,
                finalScore,
                matchType: 'vector'
            });
        });

        keywordResults.forEach((r, idx) => {
            const existing = scoreMap.get(r.id);
            const positionScore = (keywordResults.length - idx) / keywordResults.length;

            if (existing) {
                existing.finalScore += 0.3 + (positionScore * 0.1);
                existing.matchType = 'hybrid';
            } else {
                scoreMap.set(r.id, {
                    ...r,
                    finalScore: 0.3 + (positionScore * 0.1),
                    matchType: 'keyword'
                });
            }
        });

        return Array.from(scoreMap.values())
            .sort((a, b) => b.finalScore - a.finalScore);
    }
}