import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.VITE_R2_PUBLIC_URL;

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Normalize semester names to consistent format
function normalizeSemester(rawSemester: string): string {
    const lower = rawSemester.toLowerCase().trim();

    const semesterMap: Record<string, string> = {
        '1st semester': 'First Semester',
        '1st_semester': 'First Semester',
        'first semester': 'First Semester',
        'first-semester': 'First Semester',
        'first_semester': 'First Semester',
        'semester 1': 'First Semester',
        'semester-1': 'First Semester',
        'semester_1': 'First Semester',
        'sem 1': 'First Semester',
        'sem1': 'First Semester',
        '1': 'First Semester',

        '2nd semester': 'Second Semester',
        '2nd_semester': 'Second Semester',
        'second semester': 'Second Semester',
        'second-semester': 'Second Semester',
        'second_semester': 'Second Semester',
        'semester 2': 'Second Semester',
        'semester-2': 'Second Semester',
        'semester_2': 'Second Semester',
        'sem 2': 'Second Semester',
        'sem2': 'Second Semester',
        '2': 'Second Semester',

        '3rd semester': 'Third Semester',
        '3rd_semester': 'Third Semester',
        'third semester': 'Third Semester',
        'third-semester': 'Third Semester',
        'third_semester': 'Third Semester',
        'semester 3': 'Third Semester',
        'semester-3': 'Third Semester',
        'semester_3': 'Third Semester',
        'sem 3': 'Third Semester',
        'sem3': 'Third Semester',
        '3': 'Third Semester',

        '4th semester': 'Fourth Semester',
        '4th_semester': 'Fourth Semester',
        'fourth semester': 'Fourth Semester',
        'fourth-semester': 'Fourth Semester',
        'fourth_semester': 'Fourth Semester',
        'semester 4': 'Fourth Semester',
        'semester-4': 'Fourth Semester',
        'semester_4': 'Fourth Semester',
        'sem 4': 'Fourth Semester',
        'sem4': 'Fourth Semester',
        '4': 'Fourth Semester',

        '5th semester': 'Fifth Semester',
        '5th_semester': 'Fifth Semester',
        'fifth semester': 'Fifth Semester',
        'fifth-semester': 'Fifth Semester',
        'fifth_semester': 'Fifth Semester',
        'semester 5': 'Fifth Semester',
        'semester-5': 'Fifth Semester',
        'semester_5': 'Fifth Semester',
        'sem 5': 'Fifth Semester',
        'sem5': 'Fifth Semester',
        '5': 'Fifth Semester',

        '6th semester': 'Sixth Semester',
        '6th_semester': 'Sixth Semester',
        'sixth semester': 'Sixth Semester',
        'sixth-semester': 'Sixth Semester',
        'sixth_semester': 'Sixth Semester',
        'semester 6': 'Sixth Semester',
        'semester-6': 'Sixth Semester',
        'semester_6': 'Sixth Semester',
        'sem 6': 'Sixth Semester',
        'sem6': 'Sixth Semester',
        '6': 'Sixth Semester',
    };

    return semesterMap[lower] || rawSemester;
}

function parseFilePath(key: string): { semester: string; subject: string; fileName: string } | null {
    const parts = key.split('/');
    if (parts.length >= 3) {
        const rawSemester = parts[0];
        const normalized = normalizeSemester(rawSemester);
        return {
            semester: normalized,
            subject: parts[1],
            fileName: parts[parts.length - 1],
        };
    }
    if (parts.length === 2) {
        return {
            semester: normalizeSemester(parts[0]),
            subject: 'General',
            fileName: parts[1],
        };
    }
    return null;
}

function getContentType(fileName: string): string {
    const ext = fileName.toLowerCase().split('.').pop();
    const types: Record<string, string> = {
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'ppt': 'application/vnd.ms-powerpoint',
        'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'xls': 'application/vnd.ms-excel',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'txt': 'text/plain',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
    };
    return types[ext || ''] || 'application/octet-stream';
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

        // Create S3 client
        const s3Client = new S3Client({
            region: 'auto',
            endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: R2_ACCESS_KEY_ID!,
                secretAccessKey: R2_SECRET_ACCESS_KEY!,
            },
        });

        // Get existing metadata from Supabase
        const { data: existingFiles, error: fetchError } = await supabase
            .from('file_metadata')
            .select('file_path');

        if (fetchError) {
            return res.status(500).json({ error: 'Failed to fetch existing metadata: ' + fetchError.message });
        }

        const existingPaths = new Set((existingFiles || []).map((f: any) => f.file_path));

        // List all files from R2
        const excludedPrefixes = ['avatars/', 'manikant_files/'];
        const newFiles: any[] = [];
        let continuationToken: string | undefined;

        do {
            const command = new ListObjectsV2Command({
                Bucket: R2_BUCKET_NAME,
                ContinuationToken: continuationToken,
            });

            const response = await s3Client.send(command);

            if (response.Contents) {
                for (const obj of response.Contents) {
                    if (!obj.Key || obj.Size === undefined) continue;
                    if (excludedPrefixes.some(prefix => obj.Key!.startsWith(prefix))) continue;

                    // Skip if already in metadata
                    if (existingPaths.has(obj.Key)) continue;

                    const parsed = parseFilePath(obj.Key);
                    if (!parsed) continue;

                    const fileUrl = R2_PUBLIC_URL
                        ? `${R2_PUBLIC_URL}/${obj.Key}`
                        : `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${obj.Key}`;

                    newFiles.push({
                        file_name: parsed.fileName,
                        file_path: obj.Key,
                        file_size: obj.Size,
                        file_url: fileUrl,
                        semester: parsed.semester,
                        subject: parsed.subject,
                        content_type: getContentType(parsed.fileName),
                        uploaded_by: user.id,
                    });
                }
            }

            continuationToken = response.NextContinuationToken;
        } while (continuationToken);

        // Insert new files in batches
        const batchSize = 50;
        let insertedCount = 0;
        let errors: string[] = [];

        for (let i = 0; i < newFiles.length; i += batchSize) {
            const batch = newFiles.slice(i, i + batchSize);

            const { error: insertError } = await supabase
                .from('file_metadata')
                .insert(batch);

            if (insertError) {
                errors.push(`Batch ${i / batchSize + 1}: ${insertError.message}`);
            } else {
                insertedCount += batch.length;
            }
        }

        return res.status(200).json({
            success: true,
            synced: insertedCount,
            skipped: existingPaths.size,
            total_in_r2: existingPaths.size + newFiles.length,
            errors: errors.length > 0 ? errors : null,
        });
    } catch (error) {
        console.error('Error syncing files:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Sync failed',
        });
    }
}
