/**
 * Google Drive API Client
 *
 * Client for interacting with Google Drive API v3.
 * Provides file listing, downloading, uploading, and sharing capabilities.
 *
 * @see https://developers.google.com/drive/api/v3/reference
 */

import { GoogleApiClient } from '../client';
import type { ClientConfig } from '../types';
import {
  DEFAULT_FILE_FIELDS,
  DETAILED_FILE_FIELDS,
  type AboutInfo,
  type DriveFile,
  type FileListOptions,
  type FileListResponse,
  type FileMetadata,
  type GetFileOptions,
  type Permission,
} from './types';

// Re-export types for convenience
export * from './types';

/**
 * Google Drive API client
 *
 * Provides methods for:
 * - Listing files with filtering and pagination
 * - Getting file metadata
 * - Downloading file content
 * - Creating and updating files
 * - Managing file permissions
 */
export class GoogleDriveClient extends GoogleApiClient {
  constructor(config: ClientConfig) {
    super(config, 'drive');
  }

  /**
   * List files in Drive
   *
   * @param options - List options (pagination, filtering, etc.)
   * @returns List of files with optional next page token
   *
   * @example
   * // List all spreadsheets
   * const result = await drive.listFiles({
   *   q: "mimeType='application/vnd.google-apps.spreadsheet'",
   *   orderBy: 'modifiedTime desc',
   * });
   */
  async listFiles(options: FileListOptions = {}): Promise<FileListResponse> {
    const params: Record<string, string> = {};

    if (options.pageSize) params.pageSize = String(options.pageSize);
    if (options.pageToken) params.pageToken = options.pageToken;
    if (options.q) params.q = options.q;
    if (options.orderBy) params.orderBy = options.orderBy;
    if (options.fields) {
      params.fields = `nextPageToken,files(${options.fields})`;
    } else {
      params.fields = `nextPageToken,files(${DEFAULT_FILE_FIELDS})`;
    }
    if (options.corpora) params.corpora = options.corpora;
    if (options.includeItemsFromAllDrives !== undefined) {
      params.includeItemsFromAllDrives = String(
        options.includeItemsFromAllDrives
      );
    }
    if (options.supportsAllDrives !== undefined) {
      params.supportsAllDrives = String(options.supportsAllDrives);
    }

    return this.get<FileListResponse>('/files', params);
  }

  /**
   * List all files, automatically handling pagination
   *
   * @param options - List options
   * @param maxResults - Maximum total results to fetch (default: no limit)
   * @returns All matching files
   */
  async listAllFiles(
    options: Omit<FileListOptions, 'pageToken'> = {},
    maxResults?: number
  ): Promise<DriveFile[]> {
    const allFiles: DriveFile[] = [];
    let pageToken: string | undefined;

    do {
      const response = await this.listFiles({
        ...options,
        pageToken,
        pageSize: options.pageSize ?? 100,
      });

      allFiles.push(...response.files);
      pageToken = response.nextPageToken;

      // Check if we've reached the max
      if (maxResults && allFiles.length >= maxResults) {
        return allFiles.slice(0, maxResults);
      }
    } while (pageToken);

    return allFiles;
  }

  /**
   * Get a file's metadata
   *
   * @param fileId - The file ID
   * @param options - Options for fields to include
   * @returns File metadata
   */
  async getFile(
    fileId: string,
    options: GetFileOptions = {}
  ): Promise<DriveFile> {
    const params: Record<string, string> = {};

    if (options.fields) {
      params.fields = options.fields;
    } else {
      params.fields = DETAILED_FILE_FIELDS;
    }

    return this.get<DriveFile>(`/files/${encodeURIComponent(fileId)}`, params);
  }

  /**
   * Download a file's content
   *
   * @param fileId - The file ID
   * @returns File content as Blob
   */
  async downloadFile(fileId: string): Promise<Blob> {
    // For binary content, we need to use a different approach
    await this.rateLimiter.acquire();

    const url = `${this.baseUrl}/files/${encodeURIComponent(fileId)}?alt=media`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `Failed to download file: ${String(response.status)} - ${body}`
      );
    }

    this.rateLimiter.resetBackoff();
    return response.blob();
  }

  /**
   * Create a new file with metadata (no content)
   *
   * @param metadata - File metadata
   * @returns Created file
   */
  async createFile(metadata: FileMetadata): Promise<DriveFile> {
    return this.post<DriveFile>('/files', metadata);
  }

  /**
   * Update a file's metadata
   *
   * @param fileId - The file ID
   * @param metadata - Metadata to update
   * @returns Updated file
   */
  async updateFile(fileId: string, metadata: FileMetadata): Promise<DriveFile> {
    return this.patch<DriveFile>(
      `/files/${encodeURIComponent(fileId)}`,
      metadata
    );
  }

  /**
   * Delete a file (moves to trash by default)
   *
   * @param fileId - The file ID
   */
  async deleteFile(fileId: string): Promise<void> {
    await this.delete<undefined>(`/files/${encodeURIComponent(fileId)}`);
  }

  /**
   * Create a permission for a file
   *
   * @param fileId - The file ID
   * @param permission - Permission to create
   * @returns Created permission
   */
  async shareFile(fileId: string, permission: Permission): Promise<Permission> {
    return this.post<Permission>(
      `/files/${encodeURIComponent(fileId)}/permissions`,
      permission
    );
  }

  /**
   * List permissions for a file
   *
   * @param fileId - The file ID
   * @returns List of permissions
   */
  async listPermissions(fileId: string): Promise<Permission[]> {
    const response = await this.get<{ permissions: Permission[] }>(
      `/files/${encodeURIComponent(fileId)}/permissions`
    );
    return response.permissions;
  }

  /**
   * Get information about the current user's Drive
   *
   * @returns About information including storage quota
   */
  async getAbout(): Promise<AboutInfo> {
    return this.get<AboutInfo>('/about', {
      fields: 'user,storageQuota',
    });
  }
}
