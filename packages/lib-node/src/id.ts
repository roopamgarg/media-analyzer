const { nanoid } = require('nanoid');

export function newId(prefix: string): string {
  return `${prefix}_${nanoid(12)}`;
}

export function generateAnalysisId(): string {
  return newId('an');
}

export function generateProjectId(): string {
  return newId('prj');
}

export function generateBrandKitId(): string {
  return newId('bk');
}
