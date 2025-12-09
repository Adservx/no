import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.VITE_R2_PUBLIC_URL;

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID!,
        secretAccessKey: R2_SECRET_ACCESS_KEY!,
    },
});

interface UploadRequest {
    fileName: string;
    filePath: string; // The R2 key (e.g., "first-semester/Mathematics/file.pdf")
    fileData: string; // Base64 encoded file data
    fileSize: number;
    contentType: string;
    semester: string;
    subject: string;
    description?: string;
    tags?: string[];
}

// Normalize semester names to consistent format
function normalizeSemester(rawSemester: string): string {
    const lower = rawSemester.toLowerCase().trim();

    const semesterMap: Record<string, string> = {
        'first-semester': 'First Semester',
        '1st-semester': 'First Semester',
        '1st_semester': 'First Semester',
        'first': 'First Semester',
        '1': 'First Semester',

        'second-semester': 'Second Semester',
        '2nd-semester': 'Second Semester',
        '2nd_semester': 'Second Semester',
        'second': 'Second Semester',
        '2': 'Second Semester',

        'third-semester': 'Third Semester',
        '3rd-semester': 'Third Semester',
        '3rd_semester': 'Third Semester',
        'third': 'Third Semester',
        '3': 'Third Semester',

        'fourth-semester': 'Fourth Semester',
        '4th-semester': 'Fourth Semester',
        '4th_semester': 'Fourth Semester',
        'fourth': 'Fourth Semester',
        '4': 'Fourth Semester',

        'fifth-semester': 'Fifth Semester',
        '5th-semester': 'Fifth Semester',
        '5th_semester': 'Fifth Semester',
        'fifth': 'Fifth Semester',
        '5': 'Fifth Semester',

        'sixth-semester': 'Sixth Semester',
        '6th-semester': 'Sixth Semester',
        '6th_semester': 'Sixth Semester',
        'sixth': 'Sixth Semester',
        '6': 'Sixth Semester',
    };

    return semesterMap[lower] || rawSemester;
}

export default async function handler(req: any, res: any) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Validate environment variables
    const missingVars: string[] = [];
    if (!R2_ACCOUNT_ID) missingVars.push('R2_ACCOUNT_ID');
    if (!R2_ACCESS_KEY_ID) missingVars.push('R2_ACCESS_KEY_ID');
    if (!R2_SECRET_ACCESS_KEY) missingVars.push('R2_SECRET_ACCESS_KEY');
    if (!R2_BUCKET_NAME) missingVars.push('R2_BUCKET_NAME');
    if (!SUPABASE_URL) missingVars.push('VITE_SUPABASE_URL');
    if (!SUPABASE_SERVICE_KEY) missingVars.push('SUPABASE_SERVICE_ROLE_KEY');

    if (missingVars.length > 0) {
        return res.status(500).json({
            success: false,
            error: `Missing environment variables: ${missingVars.join(', ')}`
        });
    }

    // Verify admin auth
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const token = authHeader.replace('Bearer ', '');
        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        // Check if user is admin
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        if (userError || userData?.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const body: UploadRequest = req.body;
        const { fileName, filePath, fileData, fileSize, contentType, semester, subject, description, tags } = body;

        if (!fileName || !filePath || !fileData || !semester || !subject) {
            return res.status(400).json({ error: 'Missing required fields: fileName, filePath, fileData, semester, subject' });
        }

        // Decode base64 file data
        const fileBuffer = Buffer.from(fileData, 'base64');

        // Upload to R2
        const command = new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: filePath,
            Body: fileBuffer,
            ContentType: contentType || 'application/pdf',
        });

        await s3Client.send(command);

        // Generate public URL
        const fileUrl = R2_PUBLIC_URL
            ? `${R2_PUBLIC_URL}/${filePath}`
            : `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${filePath}`;

        // Normalize semester name
        const normalizedSemester = normalizeSemester(semester);

        // Insert metadata into Supabase
        const { data: metadataInsert, error: metadataError } = await supabase
            .from('file_metadata')
            .insert({
                file_name: fileName,
                file_path: filePath,
                file_size: fileSize || fileBuffer.length,
                file_url: fileUrl,
                semester: normalizedSemester,
                subject: subject,
                content_type: contentType || 'application/pdf',
                description: description || null,
                tags: tags || null,
                uploaded_by: user.id,
            })
            .select()
            .single();

        if (metadataError) {
            console.error('Error inserting metadata:', metadataError);
            // File was uploaded to R2 but metadata failed - try to continue
            return res.status(200).json({
                success: true,
                warning: 'File uploaded to R2 but metadata insert failed: ' + metadataError.message,
                url: fileUrl,
                filePath: filePath,
            });
        }

        return res.status(200).json({
            success: true,
            data: metadataInsert,
            url: fileUrl,
            filePath: filePath,
            error: null,
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Upload failed',
        });
    }
}
