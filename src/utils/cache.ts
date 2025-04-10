import { mkdirSync } from 'fs';
import { join } from 'path';

export type DirectoryStructure =
  | {
      [key: string]: string[];
    }
  | string[];

// Utility function to create directories based on the structure
export function createDirectories(
  baseDir: string,
  structure: DirectoryStructure
): void {
  if (Array.isArray(structure)) {
    // If structure is an array, create directories directly in baseDir
    structure.forEach((subDir) => {
      const dirPath = join(baseDir, subDir);
      mkdirSync(dirPath, { recursive: true });
      console.log(`Created: ${dirPath}`);
    });
  } else {
    // If structure is an object, process it as before
    Object.entries(structure).forEach(([parentDir, subDirs]) => {
      subDirs.forEach((subDir) => {
        const dirPath = join(baseDir, parentDir, subDir);
        mkdirSync(dirPath, { recursive: true });
        console.log(`Created: ${dirPath}`);
      });
    });
  }
}

// Utility function to create directory
export function createDirectory(dirPath: string) {
  mkdirSync(dirPath, { recursive: true });
  console.log(`Created: ${dirPath}`);
}
