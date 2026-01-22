/**
 * Google Sheets API Client
 *
 * Client for interacting with Google Sheets API v4.
 * Provides spreadsheet and cell value operations.
 *
 * @see https://developers.google.com/sheets/api/reference/rest
 */

import { GoogleApiClient } from '../client';
import type { ClientConfig } from '../types';
import type { DriveFile, FileListResponse } from '../drive/types';
import { GOOGLE_MIME_TYPES } from '../constants';
import type {
  AppendValuesOptions,
  AppendValuesResponse,
  BatchGetValuesResponse,
  BatchUpdateValuesRequest,
  BatchUpdateValuesResponse,
  CellValue,
  GetValuesOptions,
  Spreadsheet,
  UpdateValuesOptions,
  UpdateValuesResponse,
  ValueRange,
} from './types';

// Re-export types for convenience
export * from './types';

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';

/**
 * Google Sheets API client
 *
 * Provides methods for:
 * - Listing spreadsheets from Drive
 * - Getting spreadsheet metadata
 * - Reading cell values
 * - Updating cell values
 * - Appending rows
 * - Batch operations
 */
export class GoogleSheetsClient extends GoogleApiClient {
  constructor(config: ClientConfig) {
    super(config, 'sheets');
  }

  /**
   * List all spreadsheets accessible to the user
   *
   * Uses Drive API to find files with spreadsheet MIME type.
   *
   * @param pageSize - Maximum number of spreadsheets to return
   * @returns List of spreadsheet files
   */
  async listSpreadsheets(pageSize = 25): Promise<DriveFile[]> {
    // Use Drive API to list spreadsheets
    const params = new URLSearchParams({
      q: `mimeType='${GOOGLE_MIME_TYPES.SPREADSHEET}'`,
      fields: 'files(id,name,mimeType,modifiedTime,webViewLink,iconLink)',
      orderBy: 'modifiedTime desc',
      pageSize: String(pageSize),
    });

    const response = await this.request<FileListResponse>(
      `${DRIVE_API_BASE}/files?${params.toString()}`
    );

    return response.files;
  }

  /**
   * Get a spreadsheet's metadata
   *
   * @param spreadsheetId - The spreadsheet ID
   * @param includeGridData - Whether to include cell data
   * @returns Spreadsheet metadata
   */
  async getSpreadsheet(
    spreadsheetId: string,
    includeGridData = false
  ): Promise<Spreadsheet> {
    const params: Record<string, string> = {};
    if (includeGridData) {
      params.includeGridData = 'true';
    }

    return this.get<Spreadsheet>(
      `/spreadsheets/${encodeURIComponent(spreadsheetId)}`,
      params
    );
  }

  /**
   * Get values from a range
   *
   * @param spreadsheetId - The spreadsheet ID
   * @param range - A1 notation range (e.g., "Sheet1!A1:B10")
   * @param options - Value rendering options
   * @returns Cell values as 2D array
   *
   * @example
   * const values = await sheets.getValues('abc123', 'Sheet1!A1:C10');
   * // values = [['Name', 'Age'], ['Alice', 30], ['Bob', 25]]
   */
  async getValues(
    spreadsheetId: string,
    range: string,
    options: GetValuesOptions = {}
  ): Promise<CellValue[][]> {
    const params: Record<string, string> = {};
    if (options.valueRenderOption) {
      params.valueRenderOption = options.valueRenderOption;
    }
    if (options.dateTimeRenderOption) {
      params.dateTimeRenderOption = options.dateTimeRenderOption;
    }

    const response = await this.get<ValueRange>(
      `/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}`,
      params
    );

    return response.values ?? [];
  }

  /**
   * Get values from multiple ranges in one request
   *
   * @param spreadsheetId - The spreadsheet ID
   * @param ranges - Array of A1 notation ranges
   * @param options - Value rendering options
   * @returns Map of range to values
   */
  async batchGetValues(
    spreadsheetId: string,
    ranges: string[],
    options: GetValuesOptions = {}
  ): Promise<BatchGetValuesResponse> {
    const params = new URLSearchParams();
    for (const range of ranges) {
      params.append('ranges', range);
    }
    if (options.valueRenderOption) {
      params.set('valueRenderOption', options.valueRenderOption);
    }
    if (options.dateTimeRenderOption) {
      params.set('dateTimeRenderOption', options.dateTimeRenderOption);
    }

    return this.get<BatchGetValuesResponse>(
      `/spreadsheets/${encodeURIComponent(spreadsheetId)}/values:batchGet`,
      Object.fromEntries(params)
    );
  }

  /**
   * Update values in a range
   *
   * @param spreadsheetId - The spreadsheet ID
   * @param range - A1 notation range
   * @param values - 2D array of values to write
   * @param options - Update options
   * @returns Update result
   *
   * @example
   * await sheets.updateValues('abc123', 'Sheet1!A1', [
   *   ['Name', 'Age'],
   *   ['Alice', 30],
   * ], { valueInputOption: 'USER_ENTERED' });
   */
  async updateValues(
    spreadsheetId: string,
    range: string,
    values: CellValue[][],
    options: UpdateValuesOptions = { valueInputOption: 'USER_ENTERED' }
  ): Promise<UpdateValuesResponse> {
    const params: Record<string, string> = {
      valueInputOption: options.valueInputOption,
    };
    if (options.includeValuesInResponse) {
      params.includeValuesInResponse = 'true';
    }

    const searchParams = new URLSearchParams(params);

    return this.put<UpdateValuesResponse>(
      `/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}?${searchParams.toString()}`,
      {
        range,
        majorDimension: 'ROWS',
        values,
      }
    );
  }

  /**
   * Update multiple ranges in one request
   *
   * @param spreadsheetId - The spreadsheet ID
   * @param request - Batch update request
   * @returns Batch update result
   */
  async batchUpdateValues(
    spreadsheetId: string,
    request: BatchUpdateValuesRequest
  ): Promise<BatchUpdateValuesResponse> {
    return this.post<BatchUpdateValuesResponse>(
      `/spreadsheets/${encodeURIComponent(spreadsheetId)}/values:batchUpdate`,
      request
    );
  }

  /**
   * Append rows to a table
   *
   * @param spreadsheetId - The spreadsheet ID
   * @param range - A1 notation of the table (e.g., "Sheet1!A:Z")
   * @param values - Rows to append
   * @param options - Append options
   * @returns Append result
   *
   * @example
   * await sheets.appendRow('abc123', 'Sheet1', ['Alice', 30, 'alice@example.com']);
   */
  async appendValues(
    spreadsheetId: string,
    range: string,
    values: CellValue[][],
    options: AppendValuesOptions = { valueInputOption: 'USER_ENTERED' }
  ): Promise<AppendValuesResponse> {
    const params = new URLSearchParams({
      valueInputOption: options.valueInputOption,
    });
    if (options.insertDataOption) {
      params.set('insertDataOption', options.insertDataOption);
    }

    return this.post<AppendValuesResponse>(
      `/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}:append?${params.toString()}`,
      {
        range,
        majorDimension: 'ROWS',
        values,
      }
    );
  }

  /**
   * Convenience method to append a single row
   *
   * @param spreadsheetId - The spreadsheet ID
   * @param sheetName - Name of the sheet (tab)
   * @param values - Row values to append
   * @returns Append result
   */
  async appendRow(
    spreadsheetId: string,
    sheetName: string,
    values: CellValue[]
  ): Promise<AppendValuesResponse> {
    return this.appendValues(spreadsheetId, `${sheetName}!A:Z`, [values]);
  }

  /**
   * Clear values in a range
   *
   * @param spreadsheetId - The spreadsheet ID
   * @param range - A1 notation range to clear
   */
  async clearValues(spreadsheetId: string, range: string): Promise<void> {
    await this.post<undefined>(
      `/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}:clear`
    );
  }

  /**
   * Create a new spreadsheet
   *
   * @param title - Title for the new spreadsheet
   * @returns Created spreadsheet
   */
  async createSpreadsheet(title: string): Promise<Spreadsheet> {
    return this.post<Spreadsheet>('/spreadsheets', {
      properties: { title },
    });
  }
}
