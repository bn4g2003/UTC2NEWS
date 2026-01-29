
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import * as dotenv from 'dotenv';

dotenv.config();

async function test() {
    const apiKey = process.env.GOOGLE_API_KEY;
    console.log('Testing Gemini API with Key:', apiKey?.substring(0, 10) + '...');

    const embeddings = new GoogleGenerativeAIEmbeddings({
        apiKey: apiKey,
        modelName: "text-embedding-004", // This model supports 3072
    } as any);

    try {
        console.log('📡 Calling Google API...');
        const vector = await embeddings.embedQuery("Hello world");
        console.log('✅ Success! Vector dimension:', vector.length);

        if (vector.length !== 3072) {
            console.log('⚠️ Warning: Dimension is not 3072. Trying to force it...');
            const forcedEmbeddings = new GoogleGenerativeAIEmbeddings({
                apiKey: apiKey,
                modelName: "text-embedding-004",
                outputDimensionality: 3072
            } as any);
            const vector2 = await forcedEmbeddings.embedQuery("Hello world");
            console.log('✅ Forced Success! Vector dimension:', vector2.length);
        }
    } catch (e) {
        console.error('❌ API Error:', e.message);
    }
}

test();
