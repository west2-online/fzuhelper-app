import ExcelIcon from '@/assets/images/toolbox/paper/file_excel.png';
import ImageIcon from '@/assets/images/toolbox/paper/file_image.png';
import PDFIcon from '@/assets/images/toolbox/paper/file_pdf.png';
import PPTIcon from '@/assets/images/toolbox/paper/file_ppt.png';
import UnknownIcon from '@/assets/images/toolbox/paper/file_unknown.png';
import WordIcon from '@/assets/images/toolbox/paper/file_word.png';
import ZIPIcon from '@/assets/images/toolbox/paper/file_zip.png';
import FolderIcon from '@/assets/images/toolbox/paper/folder.png';

export { ExcelIcon, FolderIcon, ImageIcon, PDFIcon, PPTIcon, UnknownIcon, WordIcon, ZIPIcon };

export enum FileType {
  EXCEL = 'excel',
  IMAGE = 'image',
  PDF = 'pdf',
  PPT = 'ppt',
  WORD = 'word',
  ZIP = 'zip',
  UNKNOWN = 'unknown',
}

export function getFileIcon(filetype: FileType) {
  let icon = UnknownIcon;
  switch (filetype) {
    case FileType.EXCEL:
      icon = ExcelIcon;
      break;
    case FileType.IMAGE:
      icon = ImageIcon;
      break;
    case FileType.PDF:
      icon = PDFIcon;
      break;
    case FileType.PPT:
      icon = PPTIcon;
      break;
    case FileType.WORD:
      icon = WordIcon;
      break;
    case FileType.ZIP:
      icon = ZIPIcon;
      break;
  }
  return icon;
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
