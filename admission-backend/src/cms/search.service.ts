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

        // Sử dụng model text-embedding-004 (768 dimensions)
        this.embeddings = new GoogleGenerativeAIEmbeddings({
            apiKey: apiKey,
            modelName: "text-embedding-004",
        } as any);
    }

    /**
     * Index bài viết với chunking
     * Chia bài viết thành các chunks nhỏ để tìm kiếm chính xác hơn
     */
    async indexPostWithChunks(postId: string, title: string, content: string) {
        if (!process.env.GOOGLE_API_KEY) return;

        try {
            this.logger.log(`Indexing post ${postId} with chunks...`);

            // 1. Tạo embedding cho toàn bộ bài viết (để backward compatibility)
            const fullText = `${title}\n\n${content}`;
            const fullVector = await this.embeddings.embedQuery(fullText);
            const fullVectorString = `[${fullVector.join(',')}]`;

            await this.prisma.$executeRawUnsafe(
                `UPDATE posts SET embedding = $1::vector WHERE id = $2`,
                fullVectorString,
                postId
            );

            // 2. Xóa chunks cũ
            await this.prisma.$executeRaw`
                DELETE FROM post_chunks WHERE "postId" = ${postId}
            `;

            // 3. Chia content thành chunks
            const chunks = this.chunkingService.smartChunk(content, 500, 100);

            this.logger.log(`Created ${chunks.length} chunks for post ${postId}`);

            // 4. Tạo embedding cho từng chunk
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

                // Delay nhỏ để tránh rate limit
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

    /**
     * Tìm kiếm sử dụng chunks (chính xác hơn với bài viết dài)
     * Threshold động dựa trên độ dài query
     */
    async searchWithChunks(query: string, limit = 5): Promise<any[]> {
        if (!process.env.GOOGLE_API_KEY) {
            return this.keywordSearch(query, limit);
        }

        try {
            const queryVector = await this.embeddings.embedQuery(query);
            const vectorString = `[${queryVector.join(',')}]`;

            // Threshold động (Đã hạ thấp để bắt kết quả tốt hơn):
            // - Query ngắn (< 20 chars): 0.35 (35%)
            // - Query trung bình (20-50 chars): 0.30 (30%)
            // - Query dài (> 50 chars): 0.25 (25%)
            const queryLength = query.trim().length;
            let threshold = 0.35;
            if (queryLength > 50) {
                threshold = 0.25;
            } else if (queryLength > 20) {
                threshold = 0.30;
            }

            this.logger.log(`Chunk search: query length=${queryLength}, threshold=${threshold}`);

            // Tìm kiếm trong chunks với threshold động
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
                limit * 3, // Lấy nhiều hơn để group by post
                threshold
            );

            this.logger.log(`Found ${chunkResults.length} chunk matches`);

            // Group by post và lấy chunk có similarity cao nhất
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

            const results = Array.from(postMap.values())
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, limit);

            // Format kết quả để FE dễ hiển thị
            return results.map(r => ({
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
            // Fallback to keyword search if no API key
            return this.keywordSearch(query, limit);
        }

        try {
            const queryVector = await this.embeddings.embedQuery(query);
            const vectorString = `[${queryVector.join(',')}]`;

            // pgvector distance operator: <=> (cosine distance)
            // Order by distance ASC (smaller distance = more similar)
            // Cosine distance range is [0, 2]. 0 is identical.
            // Similarity = 1 - distance (roughly for normalized vectors)

            // Threshold 0.50 = 50% similarity để chỉ lấy kết quả có độ chính xác cao
            // Lọc ngay từ database để hiệu quả hơn
            const results = await this.prisma.$queryRawUnsafe<any[]>(
                `SELECT id, title, slug, excerpt, content, "featuredImage", "publishedAt", "createdAt",
                 1 - (embedding <=> $1::vector) as similarity
                 FROM posts
                 WHERE status = 'published'
                 AND embedding IS NOT NULL
                 AND 1 - (embedding <=> $1::vector) > 0.45 
                 ORDER BY similarity DESC
                 LIMIT $2`,
                vectorString,
                limit
            );

            // Format kết quả
            return results.map(r => ({
                ...r,
                similarityPercent: Math.round(r.similarity * 100),
                matchType: 'vector'
            }));
        } catch (error) {
            this.logger.error('Vector search failed', error);
            // Fallback to keyword search
            return this.keywordSearch(query, limit);
        }
    }

    /**
     * Hybrid search với chunks - Tối ưu cho cả query ngắn và dài
     * Sử dụng adaptive threshold dựa trên kết quả tốt nhất
     */
    async hybridSearchWithChunks(query: string, limit = 5): Promise<any[]> {
        if (!process.env.GOOGLE_API_KEY) {
            return this.keywordSearch(query, limit);
        }

        try {
            // Normalize query: trim và lowercase
            const normalizedQuery = query.trim().toLowerCase();

            // Nếu query quá ngắn (< 3 ký tự), chỉ dùng keyword search
            if (normalizedQuery.length < 3) {
                this.logger.log(`Query too short (${normalizedQuery.length} chars), using keyword search only`);
                return this.keywordSearch(query, limit);
            }

            // 1. Chunk-based vector search với threshold động
            const chunkResults = await this.searchWithChunks(query, limit * 3);

            // 2. Keyword search
            const keywordResults = await this.keywordSearch(query, limit * 3);

            this.logger.log(`Hybrid search: ${chunkResults.length} vector + ${keywordResults.length} keyword results`);

            // 3. Merge và rank
            const merged = this.mergeAndRank(chunkResults, keywordResults);

            if (merged.length === 0) {
                this.logger.log('No results found');
                return [];
            }

            // 4. ADAPTIVE FILTERING: Lọc dựa trên kết quả tốt nhất
            const topScore = merged[0].finalScore || merged[0].similarity || 0;
            this.logger.log(`Top score: ${(topScore * 100).toFixed(1)}%`);

            let threshold: number;
            let maxResults: number;

            if (topScore >= 0.95) {
                // Kết quả xuất sắc (≥95%) → Chỉ lấy kết quả rất tốt (≥85%)
                threshold = 0.85;
                maxResults = Math.min(limit, 5); // Tối đa 5 kết quả
                this.logger.log('Excellent match found → High threshold (85%)');
            } else if (topScore >= 0.85) {
                // Kết quả tốt (≥85%) → Lấy kết quả khá (≥70%)
                threshold = 0.70;
                maxResults = Math.min(limit, 8);
                this.logger.log('Good match found → Medium-high threshold (70%)');
            } else if (topScore >= 0.70) {
                // Kết quả khá (≥70%) → Lấy kết quả trung bình (≥55%)
                threshold = 0.60;
                maxResults = Math.min(limit, 10);
                this.logger.log('Decent match found → Medium threshold (60%)');
            } else if (topScore >= 0.50) {
                // Kết quả trung bình (≥50%) → Lấy kết quả chấp nhận được (≥45%)
                // Giới hạn số lượng vì độ tin cậy không cao
                threshold = 0.45;
                maxResults = Math.min(limit, 6);
                this.logger.log('Average match found → Low threshold (45%), capped at 6 results');
            } else {
                // Kết quả yếu (<50%) → Lấy tất cả kết quả có liên quan thấp
                threshold = 0.35;
                maxResults = Math.min(limit, 5); // Giới hạn 5 để tránh spam kết quả rác
                this.logger.log('Weak match found → Very low threshold (35%)');
            }

            // Apply adaptive threshold filtering
            const filtered = merged.filter(r => {
                const score = r.finalScore || r.similarity || 0;
                return score >= threshold;
            });
            // const filtered = merged;

            this.logger.log(`After adaptive filtering: ${filtered.length} results (threshold: ${(threshold * 100).toFixed(0)}%)`);

            // Format kết quả với similarity percent và metadata
            const results = filtered.slice(0, maxResults).map(r => ({
                ...r,
                similarityPercent: Math.round((r.finalScore || r.similarity || 0) * 100),
                // Metadata để frontend hiển thị thông tin về quality
                _searchMeta: {
                    topScore: Math.round(topScore * 100),
                    threshold: Math.round(threshold * 100),
                    totalBeforeFilter: merged.length
                }
            }));

            return results;
        } catch (error) {
            this.logger.error('Hybrid chunk search failed', error);
            return this.keywordSearch(query, limit);
        }
    }

    /**
     * Hybrid search: Kết hợp vector search và keyword search
     * Cho kết quả tốt hơn bằng cách boost các bài viết match cả 2 phương pháp
     */
    async hybridSearch(query: string, limit = 5): Promise<any[]> {
        if (!process.env.GOOGLE_API_KEY) {
            return this.keywordSearch(query, limit);
        }

        try {
            // 1. Vector search (lấy nhiều hơn để merge)
            const vectorResults = await this.search(query, limit * 2);

            // 2. Keyword search
            const keywordResults = await this.keywordSearch(query, limit * 2);

            // 3. Merge và rank lại
            const merged = this.mergeAndRank(vectorResults, keywordResults);

            // Format kết quả
            return merged.slice(0, limit).map(r => ({
                ...r,
                similarityPercent: Math.round((r.finalScore || r.similarity || 0) * 100)
            }));
        } catch (error) {
            this.logger.error('Hybrid search failed', error);
            return this.keywordSearch(query, limit);
        }
    }

    /**
     * Keyword search (fallback hoặc dùng trong hybrid)
     * Tính similarity dựa trên số lần xuất hiện và vị trí của từ khóa
     */
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
            take: limit * 2 // Lấy nhiều hơn để tính score và sort lại
        });

        // Tính similarity score dựa trên:
        // - Match trong title: +0.5
        // - Match trong excerpt: +0.3
        // - Match trong content: +0.2
        const scoredResults = results.map(r => {
            let score = 0;
            const titleLower = r.title.toLowerCase();
            const excerptLower = (r.excerpt || '').toLowerCase();
            const contentLower = r.content.toLowerCase();

            // Title match (quan trọng nhất)
            if (titleLower.includes(normalizedQuery)) {
                score += 0.5;
                // Bonus nếu match exact hoặc ở đầu title
                if (titleLower === normalizedQuery) score += 0.3;
                else if (titleLower.startsWith(normalizedQuery)) score += 0.2;
            }

            // Excerpt match
            if (excerptLower.includes(normalizedQuery)) {
                score += 0.3;
            }

            // Content match
            if (contentLower.includes(normalizedQuery)) {
                score += 0.2;
            }

            return {
                ...r,
                similarity: Math.min(score, 1.0), // Cap at 1.0
                similarityPercent: Math.round(Math.min(score, 1.0) * 100),
                matchType: 'keyword'
            };
        });

        // Sort by score và lấy top results
        return scoredResults
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit);
    }

    /**
     * Merge kết quả từ vector và keyword search
     * Vector: weight 0.7, Keyword: weight 0.3
     * Boost nếu match cả 2
     */
    private mergeAndRank(vectorResults: any[], keywordResults: any[]) {
        const scoreMap = new Map();

        // Vector results: weight 0.7
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

        // Keyword results: weight 0.3 (boost nếu trùng)
        keywordResults.forEach((r, idx) => {
            const existing = scoreMap.get(r.id);
            const positionScore = (keywordResults.length - idx) / keywordResults.length;

            if (existing) {
                // Boost nếu match cả 2 phương pháp
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
