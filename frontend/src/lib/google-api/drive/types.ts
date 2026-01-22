/**
 * Google Drive API Types
 *
 * Type definitions for Google Drive API v3 responses and parameters.
 * @see https://developers.google.com/drive/api/v3/reference
 */

/**
 * Drive file metadata
 */
export interface DriveFile {
  /** The ID of the file */
  id: string;
  /** The name of the file */
  name: string;
  /** The MIME type of the file */
  mimeType: string;
  /** Time of last modification (RFC 3339) */
  modifiedTime?: string;
  /** Time of creation (RFC 3339) */
  createdTime?: string;
  /** Size of the file in bytes (for non-Google Docs) */
  size?: string;
  /** A link for opening the file in a relevant Google editor or viewer */
  webViewLink?: string;
  /** A link for downloading the file */
  webContentLink?: string;
  /** Icon link for the file */
  iconLink?: string;
  /** Thumbnail link */
  thumbnailLink?: string;
  /** Whether the user has starred the file */
  starred?: boolean;
  /** Whether the file has been trashed */
  trashed?: boolean;
  /** IDs of parent folders */
  parents?: string[];
  /** Description of the file */
  description?: string;
  /** The file owners */
  owners?: DriveUser[];
  /** The last user to modify the file */
  lastModifyingUser?: DriveUser;
}

/**
 * Drive user information
 */
export interface DriveUser {
  displayName: string;
  emailAddress?: string;
  photoLink?: string;
}

/**
 * Drive file permissions
 */
export interface Permission {
  id?: string;
  type: 'user' | 'group' | 'domain' | 'anyone';
  role:
    | 'owner'
    | 'organizer'
    | 'fileOrganizer'
    | 'writer'
    | 'commenter'
    | 'reader';
  emailAddress?: string;
  domain?: string;
  allowFileDiscovery?: boolean;
}

/**
 * Options for listing files
 */
export interface FileListOptions {
  /** Maximum number of files to return (1-1000) */
  pageSize?: number;
  /** Token for pagination */
  pageToken?: string;
  /** Query string for filtering (Drive query syntax) */
  q?: string;
  /** Ordering of results */
  orderBy?: string;
  /** Fields to include in response (partial response) */
  fields?: string;
  /** Corpus of files to search */
  corpora?: 'user' | 'domain' | 'drive' | 'allDrives';
  /** Whether to include team drives */
  includeItemsFromAllDrives?: boolean;
  /** Whether to support team drives */
  supportsAllDrives?: boolean;
}

/**
 * Response from files.list
 */
export interface FileListResponse {
  files: DriveFile[];
  nextPageToken?: string;
  incompleteSearch?: boolean;
}

/**
 * Options for getting a file
 */
export interface GetFileOptions {
  /** Fields to include in response */
  fields?: string;
  /** Whether to acknowledge download risks */
  acknowledgeAbuse?: boolean;
}

/**
 * File metadata for creating/updating files
 */
export interface FileMetadata {
  name?: string;
  mimeType?: string;
  description?: string;
  parents?: string[];
  starred?: boolean;
}

/**
 * About information for the current user
 */
export interface AboutInfo {
  user: DriveUser;
  storageQuota: {
    limit?: string;
    usage?: string;
    usageInDrive?: string;
    usageInDriveTrash?: string;
  };
}

/**
 * Default fields to request for file listings
 */
export const DEFAULT_FILE_FIELDS =
  'id,name,mimeType,modifiedTime,webViewLink,iconLink';

/**
 * Fields for detailed file information
 */
export const DETAILED_FILE_FIELDS =
  'id,name,mimeType,modifiedTime,createdTime,size,webViewLink,webContentLink,iconLink,thumbnailLink,starred,trashed,parents,description,owners,lastModifyingUser';
