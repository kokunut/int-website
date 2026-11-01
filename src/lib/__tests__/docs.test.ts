import { describe, expect, it } from 'vitest';
import { driveDownloadUrl, drivePreviewUrl, isDocCategory, isDriveUrl, parseGoogleFile } from '../docs';

describe('drivePreviewUrl', () => {
  it('converts /view to /preview', () => {
    expect(drivePreviewUrl('https://drive.google.com/file/d/ABC_123-x/view?usp=sharing')).toBe(
      'https://drive.google.com/file/d/ABC_123-x/preview',
    );
    expect(drivePreviewUrl('https://drive.google.com/file/d/ABC/preview')).toBe('https://drive.google.com/file/d/ABC/preview');
    expect(drivePreviewUrl('https://drive.google.com/file/d/ABC')).toBe('https://drive.google.com/file/d/ABC/preview');
  });
  it('handles open?id= links', () => {
    expect(drivePreviewUrl('https://drive.google.com/open?id=XYZ')).toBe('https://drive.google.com/file/d/XYZ/preview');
  });
  it('rejects non-drive, non-https and empty values', () => {
    expect(drivePreviewUrl(undefined)).toBeNull();
    expect(drivePreviewUrl('')).toBeNull();
    expect(drivePreviewUrl('#')).toBeNull();
    expect(drivePreviewUrl('https://evil.com/file/d/ABC/view')).toBeNull();
    expect(drivePreviewUrl('http://drive.google.com/file/d/ABC/view')).toBeNull();
    expect(drivePreviewUrl('https://drive.google.com/drive/folders/ABC')).toBeNull();
  });
  it('isDriveUrl', () => {
    expect(isDriveUrl('https://drive.google.com/drive/folders/ABC')).toBe(true);
    expect(isDriveUrl('https://example.com/a.pdf')).toBe(false);
  });
});

describe('isDocCategory', () => {
  it('accepts only known categories', () => {
    expect(isDocCategory('rules')).toBe(true);
    expect(isDocCategory('nope')).toBe(false);
    expect(isDocCategory('toString')).toBe(false);
  });
});

describe('Google Docs links', () => {
  it('parses documents, sheets and slides', () => {
    expect(parseGoogleFile('https://docs.google.com/document/d/DOC1/edit?usp=sharing')).toEqual({ kind: 'document', id: 'DOC1' });
    expect(parseGoogleFile('https://docs.google.com/document/u/0/d/DOC1/edit')).toEqual({ kind: 'document', id: 'DOC1' });
    expect(parseGoogleFile('https://docs.google.com/spreadsheets/d/S1/edit#gid=0')).toEqual({ kind: 'spreadsheets', id: 'S1' });
    expect(parseGoogleFile('https://docs.google.com/presentation/d/P1/edit')).toEqual({ kind: 'presentation', id: 'P1' });
    expect(parseGoogleFile('https://drive.google.com/file/d/F1/view')).toEqual({ kind: 'file', id: 'F1' });
  });
  it('builds preview and pdf export urls', () => {
    expect(drivePreviewUrl('https://docs.google.com/document/d/DOC1/edit')).toBe('https://docs.google.com/document/d/DOC1/preview');
    expect(driveDownloadUrl('https://docs.google.com/document/d/DOC1/edit')).toBe('https://docs.google.com/document/d/DOC1/export?format=pdf');
    expect(driveDownloadUrl('https://docs.google.com/spreadsheets/d/S1/edit')).toBe('https://docs.google.com/spreadsheets/d/S1/export?format=pdf');
    expect(drivePreviewUrl('https://docs.google.com/presentation/d/P1/edit')).toBe('https://docs.google.com/presentation/d/P1/preview');
  });
  it('returns null for unparseable google urls', () => {
    expect(parseGoogleFile('https://docs.google.com/forms/d/F/edit')).toBeNull();
    expect(parseGoogleFile('https://docs.google.com/')).toBeNull();
    expect(drivePreviewUrl('https://docs.google.com/forms/d/F/edit')).toBeNull();
    expect(driveDownloadUrl('https://docs.google.com/forms/d/F/edit')).toBeNull();
  });
});

describe('driveDownloadUrl', () => {
  it('builds direct download urls', () => {
    expect(driveDownloadUrl('https://drive.google.com/file/d/ABC_1-x/view?usp=sharing')).toBe(
      'https://drive.google.com/uc?export=download&id=ABC_1-x',
    );
    expect(driveDownloadUrl('https://drive.google.com/open?id=XYZ')).toBe('https://drive.google.com/uc?export=download&id=XYZ');
  });
  it('returns null for non-drive files', () => {
    expect(driveDownloadUrl(undefined)).toBeNull();
    expect(driveDownloadUrl('https://example.com/a.pdf')).toBeNull();
    expect(driveDownloadUrl('https://drive.google.com/drive/folders/ABC')).toBeNull();
  });
});
