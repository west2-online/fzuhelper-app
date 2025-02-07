import { Text } from 'components/ui/text';
import React from 'react';
import { FlatList, Image, TouchableOpacity, View } from 'react-native';

export enum PaperType {
  FOLDER = 'folder',
  FILE = 'file',
}

export interface Paper {
  // 当前路径下的文件/文件夹名字
  name: string;
  type: PaperType;
}

type PaperListProps = React.ComponentPropsWithRef<typeof View> & {
  papers: Paper[];
  currentPath: string;
  setCurrentPath: (path: string) => void;
};

enum FileType {
  EXCEL = 'excel',
  IMAGE = 'image',
  PDF = 'pdf',
  PPT = 'ppt',
  WORD = 'word',
  ZIP = 'zip',
  UNKNOWN = 'unknown',
}

function guessFileType(filename: string): FileType {
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

const folderIcon = require('assets/images/toolbox/paper/folder.png');
const excelIcon = require('assets/images/toolbox/paper/file_excel.png');
const imageIcon = require('assets/images/toolbox/paper/file_image.png');
const pdfIcon = require('assets/images/toolbox/paper/file_pdf.png');
const pptIcon = require('assets/images/toolbox/paper/file_ppt.png');
const unknownIcon = require('assets/images/toolbox/paper/file_unknown.png');
const wordIcon = require('assets/images/toolbox/paper/file_word.png');
const zipIcon = require('assets/images/toolbox/paper/file_zip.png');

function renderPaperItem(paper: Paper, currentPath: string, setCurrentPath: (path: string) => void) {
  const { name, type } = paper;
  let icon;
  if (type === PaperType.FOLDER) {
    icon = folderIcon;
  } else {
    const filetype = guessFileType(name);
    switch (filetype) {
      case FileType.EXCEL:
        icon = excelIcon;
        break;
      case FileType.IMAGE:
        icon = imageIcon;
        break;
      case FileType.PDF:
        icon = pdfIcon;
        break;
      case FileType.PPT:
        icon = pptIcon;
        break;
      case FileType.WORD:
        icon = wordIcon;
        break;
      case FileType.ZIP:
        icon = zipIcon;
        break;
      default:
        icon = unknownIcon;
    }
  }

  return (
    <TouchableOpacity
      onPress={() => {
        if (type === 'folder') {
          setCurrentPath(`${currentPath}/${name}`);
        } else {
          // 导航到文件预览界面
          console.log(`open file: ${currentPath}/${name}`);
        }
      }}
      className="h-16 w-full flex-row items-center px-4 py-2"
    >
      <Image source={icon} className="mr-6 h-6 w-6" resizeMode="contain" />
      <Text numberOfLines={2} ellipsizeMode="tail" className="flex-1 text-base">
        {name}
      </Text>
    </TouchableOpacity>
  );
}

export default function PaperList({ papers, currentPath, setCurrentPath, ...props }: PaperListProps) {
  return (
    <FlatList
      data={papers}
      className="h-full"
      renderItem={({ item }) => {
        return renderPaperItem(item, currentPath, setCurrentPath);
      }}
    />
  );
}
