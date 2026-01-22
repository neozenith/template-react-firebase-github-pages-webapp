/**
 * Google Sheets API Types
 *
 * Type definitions for Google Sheets API v4 responses and parameters.
 * @see https://developers.google.com/sheets/api/reference/rest
 */

/**
 * Spreadsheet metadata
 */
export interface Spreadsheet {
  /** The spreadsheet ID */
  spreadsheetId: string;
  /** Properties of the spreadsheet */
  properties: SpreadsheetProperties;
  /** The sheets in the spreadsheet */
  sheets?: Sheet[];
  /** The named ranges in the spreadsheet */
  namedRanges?: NamedRange[];
  /** URL to the spreadsheet */
  spreadsheetUrl?: string;
}

/**
 * Spreadsheet properties
 */
export interface SpreadsheetProperties {
  /** The title of the spreadsheet */
  title: string;
  /** The locale of the spreadsheet */
  locale?: string;
  /** The time zone of the spreadsheet */
  timeZone?: string;
  /** The default format of all cells */
  defaultFormat?: CellFormat;
}

/**
 * Sheet (tab) within a spreadsheet
 */
export interface Sheet {
  /** Properties of the sheet */
  properties: SheetProperties;
  /** Data in the sheet */
  data?: GridData[];
}

/**
 * Sheet properties
 */
export interface SheetProperties {
  /** The ID of the sheet */
  sheetId: number;
  /** The name of the sheet */
  title: string;
  /** The index of the sheet (0-based) */
  index: number;
  /** The type of sheet */
  sheetType?: 'GRID' | 'OBJECT' | 'DATA_SOURCE';
  /** Grid properties (for GRID sheets) */
  gridProperties?: GridProperties;
  /** Whether the sheet is hidden */
  hidden?: boolean;
  /** Tab color */
  tabColor?: Color;
  /** Right-to-left */
  rightToLeft?: boolean;
}

/**
 * Grid properties for a sheet
 */
export interface GridProperties {
  rowCount?: number;
  columnCount?: number;
  frozenRowCount?: number;
  frozenColumnCount?: number;
  hideGridlines?: boolean;
}

/**
 * Grid data (cell values)
 */
export interface GridData {
  startRow?: number;
  startColumn?: number;
  rowData?: RowData[];
}

/**
 * Row data
 */
export interface RowData {
  values?: CellData[];
}

/**
 * Cell data
 */
export interface CellData {
  /** The formatted value (for display) */
  formattedValue?: string;
  /** The user-entered value */
  userEnteredValue?: ExtendedValue;
  /** The effective value (computed) */
  effectiveValue?: ExtendedValue;
  /** Cell formatting */
  userEnteredFormat?: CellFormat;
  /** Effective formatting */
  effectiveFormat?: CellFormat;
  /** Hyperlink in the cell */
  hyperlink?: string;
  /** Note attached to the cell */
  note?: string;
}

/**
 * Extended value types
 */
export interface ExtendedValue {
  numberValue?: number;
  stringValue?: string;
  boolValue?: boolean;
  formulaValue?: string;
  errorValue?: ErrorValue;
}

/**
 * Error value
 */
export interface ErrorValue {
  type:
    | 'ERROR'
    | 'NULL_VALUE'
    | 'DIVIDE_BY_ZERO'
    | 'VALUE'
    | 'REF'
    | 'NAME'
    | 'NUM'
    | 'N_A'
    | 'LOADING';
  message?: string;
}

/**
 * Named range
 */
export interface NamedRange {
  namedRangeId?: string;
  name: string;
  range: GridRange;
}

/**
 * Grid range specification
 */
export interface GridRange {
  sheetId?: number;
  startRowIndex?: number;
  endRowIndex?: number;
  startColumnIndex?: number;
  endColumnIndex?: number;
}

/**
 * Cell format
 */
export interface CellFormat {
  numberFormat?: NumberFormat;
  backgroundColor?: Color;
  borders?: Borders;
  padding?: Padding;
  horizontalAlignment?: 'LEFT' | 'CENTER' | 'RIGHT';
  verticalAlignment?: 'TOP' | 'MIDDLE' | 'BOTTOM';
  wrapStrategy?: 'OVERFLOW_CELL' | 'LEGACY_WRAP' | 'CLIP' | 'WRAP';
  textDirection?: 'LEFT_TO_RIGHT' | 'RIGHT_TO_LEFT';
  textFormat?: TextFormat;
  hyperlinkDisplayType?: 'LINKED' | 'PLAIN_TEXT';
  textRotation?: TextRotation;
}

/**
 * Number format
 */
export interface NumberFormat {
  type:
    | 'TEXT'
    | 'NUMBER'
    | 'PERCENT'
    | 'CURRENCY'
    | 'DATE'
    | 'TIME'
    | 'DATE_TIME'
    | 'SCIENTIFIC';
  pattern?: string;
}

/**
 * Color
 */
export interface Color {
  red?: number;
  green?: number;
  blue?: number;
  alpha?: number;
}

/**
 * Borders
 */
export interface Borders {
  top?: Border;
  bottom?: Border;
  left?: Border;
  right?: Border;
}

/**
 * Border
 */
export interface Border {
  style?:
    | 'NONE'
    | 'DOTTED'
    | 'DASHED'
    | 'SOLID'
    | 'SOLID_MEDIUM'
    | 'SOLID_THICK'
    | 'DOUBLE';
  color?: Color;
  width?: number;
}

/**
 * Padding
 */
export interface Padding {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

/**
 * Text format
 */
export interface TextFormat {
  foregroundColor?: Color;
  fontFamily?: string;
  fontSize?: number;
  bold?: boolean;
  italic?: boolean;
  strikethrough?: boolean;
  underline?: boolean;
}

/**
 * Text rotation
 */
export interface TextRotation {
  angle?: number;
  vertical?: boolean;
}

/**
 * Cell value for read/write operations
 */
export type CellValue = string | number | boolean | null;

/**
 * Value range (used in values.get and values.update)
 */
export interface ValueRange {
  range: string;
  majorDimension?: 'ROWS' | 'COLUMNS';
  /** Cell values - may be undefined if range is empty */
  values?: CellValue[][];
}

/**
 * Options for getting values
 */
export interface GetValuesOptions {
  /** How values should be represented */
  valueRenderOption?: 'FORMATTED_VALUE' | 'UNFORMATTED_VALUE' | 'FORMULA';
  /** How dates should be represented */
  dateTimeRenderOption?: 'SERIAL_NUMBER' | 'FORMATTED_STRING';
}

/**
 * Options for updating values
 */
export interface UpdateValuesOptions {
  /** How input data should be interpreted */
  valueInputOption: 'RAW' | 'USER_ENTERED';
  /** Whether to include the values in the response */
  includeValuesInResponse?: boolean;
}

/**
 * Response from values.update
 */
export interface UpdateValuesResponse {
  spreadsheetId: string;
  updatedRange: string;
  updatedRows: number;
  updatedColumns: number;
  updatedCells: number;
  updatedData?: ValueRange;
}

/**
 * Options for appending values
 */
export interface AppendValuesOptions {
  /** How input data should be interpreted */
  valueInputOption: 'RAW' | 'USER_ENTERED';
  /** How to insert new data */
  insertDataOption?: 'OVERWRITE' | 'INSERT_ROWS';
}

/**
 * Response from values.append
 */
export interface AppendValuesResponse {
  spreadsheetId: string;
  tableRange: string;
  updates: UpdateValuesResponse;
}

/**
 * Batch get values response
 */
export interface BatchGetValuesResponse {
  spreadsheetId: string;
  valueRanges: ValueRange[];
}

/**
 * Batch update values request
 */
export interface BatchUpdateValuesRequest {
  valueInputOption: 'RAW' | 'USER_ENTERED';
  data: ValueRange[];
  includeValuesInResponse?: boolean;
}

/**
 * Batch update values response
 */
export interface BatchUpdateValuesResponse {
  spreadsheetId: string;
  totalUpdatedRows: number;
  totalUpdatedColumns: number;
  totalUpdatedCells: number;
  totalUpdatedSheets: number;
  responses: UpdateValuesResponse[];
}
