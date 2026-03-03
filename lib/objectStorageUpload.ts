export type PresignedFields = Record<string, string> | undefined;

function hasPostFields(fields: PresignedFields): fields is Record<string, string> {
  return !!fields && Object.keys(fields).length > 0;
}

/**
 * Upload using either presigned POST (S3) or signed PUT (R2).
 * - When fields are present, performs multipart POST.
 * - When fields are empty/missing, performs direct PUT.
 */
export async function uploadToObjectStorage(
  url: string,
  fields: PresignedFields,
  file: Blob,
  options?: {
    fileName?: string;
    contentType?: string;
  }
): Promise<Response> {
  if (hasPostFields(fields)) {
    const formData = new FormData();
    Object.entries(fields).forEach(([key, value]) => {
      if (key.toLowerCase() !== 'bucket') {
        formData.append(key, value);
      }
    });
    formData.append('file', file, options?.fileName || 'upload.bin');
    return fetch(url, { method: 'POST', body: formData });
  }

  const contentType = options?.contentType || (file instanceof File ? file.type : '') || 'application/octet-stream';
  return fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: file,
  });
}
