
import { PrismaClient } from '@prisma/client';
import { SearchService } from './src/cms/search.service';
import { ChunkingService } from './src/cms/chunking.service';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const chunkingService = new ChunkingService();
const searchService = new SearchService(prisma as any, chunkingService);

async function main() {
    console.log('🔍 Testing "xe hơi" with filtered logic...');

    // Simulate frontend query: limit=20
    const results = await searchService.hybridSearchWithChunks("xe hơi", 20);

    console.log(`\nFound ${results.length} results.`);
    if (results.length > 0) {
        console.log(`Top Score: ${results[0]?._searchMeta?.topScore}%`);
        console.log(`Threshold Applied: ${results[0]?._searchMeta?.threshold}%`);

        console.log('\nResults:');
        results.forEach((r: any) => {
            console.log(`- [${r.similarityPercent}%] ${r.title}`);
        });
    }

    if (results.length > 8) {
        console.error('❌ Still returning too many results!');
    } else {
        console.log('✅ Result count is reasonable.');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
