import { storage } from './client'
import {
  getDownloadURL,
  ref,
  uploadBytes,
  deleteObject,
  uploadBytesResumable,
} from 'firebase/storage'

export async function uploadFile(path: string, file: File, filename?: string) {
  const name = filename && filename.length > 0 ? filename : `${crypto.randomUUID()}-${file.name}`
  const fileRef = ref(storage, `${path}/${name}`)
  await uploadBytes(fileRef, file)
  const url = await getDownloadURL(fileRef)
  return { url, path: fileRef.fullPath, name }
}

export async function uploadFileResumable(
  path: string,
  file: File,
  filename?: string,
  onProgress?: (percent: number) => void
) {
  const name = filename && filename.length > 0 ? filename : `${crypto.randomUUID()}-${file.name}`
  const fileRef = ref(storage, `${path}/${name}`)
  const task = uploadBytesResumable(fileRef, file)
  return await new Promise<{ url: string; path: string; name: string }>((resolve, reject) => {
    task.on(
      'state_changed',
      (snap) => {
        if (onProgress && snap.totalBytes > 0) {
          const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100)
          onProgress(pct)
        }
      },
      (err) => reject(err),
      async () => {
        const url = await getDownloadURL(task.snapshot.ref)
        resolve({ url, path: task.snapshot.ref.fullPath, name })
      }
    )
  })
}

export async function removeFile(fullPath: string) {
  const fileRef = ref(storage, fullPath)
  await deleteObject(fileRef)
}
