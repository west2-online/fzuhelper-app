export enum FileType {
  EXCEL = 'excel',
  IMAGE = 'image',
  PDF = 'pdf',
  PPT = 'ppt',
  WORD = 'word',
  ZIP = 'zip',
  UNKNOWN = 'unknown',
}

export function guessFileType(filename: string): FileType {
  const lowerName = filename.toLowerCase();
  const parts = lowerName.split('.');
  if (parts.length < 2) {
    return FileType.UNKNOWN;
  }
  const ext = parts[parts.length - 1];
  switch (ext) {
    case 'xls':
    case 'xlsx':
      return FileType.EXCEL;
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'bmp':
    case 'svg':
      return FileType.IMAGE;
    case 'pdf':
      return FileType.PDF;
    case 'ppt':
    case 'pptx':
      return FileType.PPT;
    case 'doc':
    case 'docx':
      return FileType.WORD;
    case 'zip':
      return FileType.ZIP;
    default:
      return FileType.UNKNOWN;
  }
}