import { extname } from 'path';
import type { BuildContext, RouteSourceFile } from '../types';
import { addError } from '../utils/format';
import {
  is404FileName,
  is500FileName,
  isEndpointFileName,
  isEntryFileName,
  isLayoutFileName,
  isMarkdownExt,
  isMenuFileName,
  isPageExt,
  isTestDirName,
  isTestFileName,
} from '../utils/fs';

export function getSourceFile(
  dirPath: string,
  dirName: string,
  filePath: string,
  fileName: string
) {
  const ext = extname(fileName).toLowerCase();

  const type = isLayoutFileName(dirName, fileName, ext)
    ? 'layout'
    : isMenuFileName(fileName)
    ? 'menu'
    : is404FileName(fileName, ext)
    ? '404'
    : is500FileName(fileName, ext)
    ? '500'
    : isEntryFileName(fileName, ext)
    ? 'entry'
    : isEndpointFileName(fileName, ext)
    ? 'endpoint'
    : isMarkdownExt(ext) || isPageExt(ext)
    ? 'page'
    : null;

  if (type !== null) {
    const sourceFile: RouteSourceFile = {
      type,
      dirPath,
      dirName,
      filePath,
      fileName,
      ext,
    };
    return sourceFile;
  }

  return null;
}

export function validateSourceFiles(ctx: BuildContext, sourceFiles: RouteSourceFile[]) {
  for (const sourceFile of sourceFiles) {
    const err = validateSourceFile(sourceFile);
    if (err) {
      addError(ctx, err);
    }
  }
}

function validateSourceFile(sourceFile: RouteSourceFile) {
  if (isTestDirName(sourceFile.dirName)) {
    return `Test directory "${sourceFile.filePath}" should not be included within the routes directory. Please move test directories to a different location.`;
  }

  if (isTestFileName(sourceFile.fileName)) {
    return `Test file "${sourceFile.filePath}" should not be included within the routes directory. Please move test files to a different location.`;
  }

  if (sourceFile.dirName.includes('@')) {
    return `Route directories cannot have a named layout. Please change the named layout from the directory "${sourceFile.dirPath}" to a file.`;
  }

  return null;
}
