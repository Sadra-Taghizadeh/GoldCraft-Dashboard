const DEFAULT_MAX_DIMENSION = 1080
const MAX_IMAGE_FILE_SIZE = 100 * 1024 * 1024 // 100MB

const SUPPORTED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/bmp',
  'image/gif',
  'image/svg+xml',
  'image/heic',
  'image/heif',
  'image/x-heic',
  'image/x-heif',
]

const SUPPORTED_FILE_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.bmp',
  '.gif',
  '.svg',
  '.heic',
  '.heif',
]

const HEIC_MIME_TYPES = ['image/heic', 'image/heif', 'image/x-heic', 'image/x-heif']
const HEIC_FILE_EXTENSIONS = ['.heic', '.heif']

const DIRECT_UPLOAD_MIME_TYPES = [
  'image/gif',
  'image/svg+xml',
]

const DIRECT_UPLOAD_EXTENSIONS = ['.gif', '.svg']

const SUPPORTED_FORMATS = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  bmp: 'image/bmp',
}

function getFileExtension(fileName) {
  const dotIndex = fileName.lastIndexOf('.')
  if (dotIndex === -1)
    return ''

  return fileName.slice(dotIndex).toLowerCase()
}

export function shouldBypassImageProcessing(file) {
  const normalizedType = file.type.toLowerCase()
  if (DIRECT_UPLOAD_MIME_TYPES.includes(normalizedType)) {
    return true
  }

  const extension = getFileExtension(file.name)

  return DIRECT_UPLOAD_EXTENSIONS.includes(extension)
}

function isHeicLikeFile(file) {
  const normalizedType = file.type.toLowerCase()
  if (HEIC_MIME_TYPES.includes(normalizedType)) {
    return true
  }

  const extension = getFileExtension(file.name)

  return HEIC_FILE_EXTENSIONS.includes(extension)
}

async function convertHeicToJpegFile(file, quality) {
  const heic2anyModule = await import('heic2any')
  const heic2any = (heic2anyModule.default || heic2anyModule)

  const converted = await heic2any({
    blob: file,
    toType: 'image/jpeg',
    quality: Math.max(0.1, Math.min(1, quality / 100)),
  })

  const outputBlob = Array.isArray(converted) ? converted[0] : converted
  if (!(outputBlob instanceof Blob)) {
    throw new TypeError('Could not convert HEIC file')
  }

  const outputName = file.name.replace(/\.(heic|heif)$/i, '.jpg')

  return new File([outputBlob], outputName, {
    type: 'image/jpeg',
    lastModified: Date.now(),
  })
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()

      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('Could not load image'))
      img.src = e.target?.result
    }
    reader.onerror = () => reject(new Error('Error reading file'))
    reader.readAsDataURL(file)
  })
}

function canvasToBlob(canvas, mimeType = 'image/jpeg', quality = 0.9) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        }
        else {
          reject(new Error('Could not convert image'))
        }
      },
      mimeType,
      quality,
    )
  })
}

export function validateImageFile(file) {
  if (!file) {
    return { isValid: false, error: 'No file selected' }
  }

  const normalizedType = file.type.toLowerCase()
  const extension = getFileExtension(file.name)
  const hasSupportedMime = SUPPORTED_MIME_TYPES.includes(normalizedType)
  const hasSupportedExtension = SUPPORTED_FILE_EXTENSIONS.includes(extension)

  if (!hasSupportedMime && !hasSupportedExtension) {
    return {
      isValid: false,
      error: `Unsupported format. Valid formats: ${SUPPORTED_FILE_EXTENSIONS.map(ext => ext.slice(1)).join(', ')}`,
    }
  }

  if (file.size > MAX_IMAGE_FILE_SIZE) {
    return {
      isValid: false,
      error: 'File size exceeds 100MB',
    }
  }

  return { isValid: true, error: null }
}

export async function convertImageFormat(file, targetFormat, quality = 80, maxWidth = null, maxHeight = null) {
  try {
    const validation = validateImageFile(file)
    if (!validation.isValid) {
      throw new Error(validation.error)
    }

    const img = await loadImageFromFile(file)
    const mimeType = SUPPORTED_FORMATS[targetFormat.toLowerCase()]

    if (!mimeType) {
      throw new Error(`Invalid format: ${targetFormat}`)
    }

    const canvas = document.createElement('canvas')
    const sourceWidth = img.naturalWidth
    const sourceHeight = img.naturalHeight
    const widthScale = maxWidth ? maxWidth / sourceWidth : 1
    const heightScale = maxHeight ? maxHeight / sourceHeight : 1
    const scale = Math.min(1, widthScale, heightScale)
    const targetWidth = Math.max(1, Math.round(sourceWidth * scale))
    const targetHeight = Math.max(1, Math.round(sourceHeight * scale))

    canvas.width = targetWidth
    canvas.height = targetHeight

    const ctx = canvas.getContext('2d')

    if (ctx) {
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight)
    }

    const qualityValue = Math.max(0.1, Math.min(1, quality / 100))
    const blob = await canvasToBlob(canvas, mimeType, qualityValue)

    return blob
  }
  catch (error) {
    throw new Error(`Error converting image: ${error.message}`)
  }
}

export async function processImageForUpload(file, quality = 80, maxDimension = DEFAULT_MAX_DIMENSION) {
  try {
    const validation = validateImageFile(file)
    if (!validation.isValid) {
      throw new Error(validation.error)
    }

    let sourceFile = file

    if (isHeicLikeFile(sourceFile)) {
      try {
        sourceFile = await convertHeicToJpegFile(sourceFile, quality)
      }
      catch {
        return { blob: file, file }
      }
    }

    if (shouldBypassImageProcessing(sourceFile)) {
      return { blob: sourceFile, file: sourceFile }
    }

    const webpBlob = await convertImageFormat(
      sourceFile,
      'webp',
      quality,
      maxDimension,
      maxDimension,
    )

    const processedFile = new File([webpBlob], file.name.replace(/\.[^/.]+$/, '.webp'), {
      type: 'image/webp',
      lastModified: Date.now(),
    })

    return { blob: webpBlob, file: processedFile }
  }
  catch (error) {
    throw new Error(`Error processing image: ${error.message}`)
  }
}

export function formatFileSize(bytes) {
  if (bytes === 0)
    return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${Math.round((bytes / k ** i) * 100) / 100} ${sizes[i]}`
}

export async function getImageDimensions(file) {
  try {
    const validation = validateImageFile(file)
    if (!validation.isValid) {
      throw new Error(validation.error)
    }

    const img = await loadImageFromFile(file)

    return {
      width: img.naturalWidth,
      height: img.naturalHeight,
    }
  }
  catch (error) {
    throw new Error(`Error getting image dimensions: ${error.message}`)
  }
}
