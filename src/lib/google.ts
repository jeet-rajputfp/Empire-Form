import { google } from 'googleapis'

export function getGoogleAuth() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = process.env.GOOGLE_REDIRECT_URI

  if (!clientId || !clientSecret) {
    return null
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri)
}

export async function createOrAppendGoogleDoc(
  docId: string | null,
  title: string,
  content: string,
  auth: any
): Promise<string> {
  const docs = google.docs({ version: 'v1', auth })

  if (!docId) {
    const doc = await docs.documents.create({
      requestBody: { title },
    })
    docId = doc.data.documentId!

    await docs.documents.batchUpdate({
      documentId: docId,
      requestBody: {
        requests: [
          {
            insertText: {
              location: { index: 1 },
              text: content,
            },
          },
        ],
      },
    })
  } else {
    const doc = await docs.documents.get({ documentId: docId })
    const endIndex = doc.data.body?.content?.slice(-1)?.[0]?.endIndex || 1

    await docs.documents.batchUpdate({
      documentId: docId,
      requestBody: {
        requests: [
          {
            insertText: {
              location: { index: Math.max(endIndex - 1, 1) },
              text: '\n\n---\n\n' + content,
            },
          },
        ],
      },
    })
  }

  return docId
}

export async function uploadFileToDrive(
  folderId: string | null,
  fileName: string,
  filePath: string,
  mimeType: string,
  auth: any
): Promise<{ fileId: string; folderId: string }> {
  const drive = google.drive({ version: 'v3', auth })
  const fs = require('fs')

  if (!folderId) {
    const folder = await drive.files.create({
      requestBody: {
        name: 'Form Uploads',
        mimeType: 'application/vnd.google-apps.folder',
      },
      fields: 'id',
    })
    folderId = folder.data.id!
  }

  const file = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId],
    },
    media: {
      mimeType,
      body: fs.createReadStream(filePath),
    },
    fields: 'id',
  })

  return { fileId: file.data.id!, folderId }
}
