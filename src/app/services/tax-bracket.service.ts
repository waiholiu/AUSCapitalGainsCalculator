export interface TaxBracket {
  min: number;
  max: number;
  rate: number;
  fixedAmount: number;
}

export interface TaxYear {
  year: string;
  brackets: TaxBracket[];
  medicareLevy: number;
  lastUpdated: string;
}

export const TAX_DATA: { [key: string]: TaxYear } = {
  '2025-26': {
    year: '2025-26',
    brackets: [
      { min: 0, max: 18200, rate: 0, fixedAmount: 0 },
      { min: 18201, max: 45000, rate: 0.16, fixedAmount: 0 },
      { min: 45001, max: 135000, rate: 0.30, fixedAmount: 4288 },
      { min: 135001, max: 190000, rate: 0.37, fixedAmount: 31288 },
      { min: 190001, max: Infinity, rate: 0.45, fixedAmount: 51638 }
    ],
    medicareLevy: 0.02,
    lastUpdated: '2025-06-23'
  }
};

export class TaxBracketService {
  static getCurrentTaxYear(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-based
    
    // Australian financial year runs July 1 to June 30
    if (month >= 6) { // July onwards
      return `${year}-${(year + 1).toString().slice(-2)}`;
    } else {
      return `${year - 1}-${year.toString().slice(-2)}`;
    }
  }
    static getTaxBrackets(year?: string): TaxBracket[] {
    const taxYear = year || this.getCurrentTaxYear();
    return TAX_DATA[taxYear]?.brackets || TAX_DATA['2025-26'].brackets;
  }
  
  static getMedicareLevy(year?: string): number {
    const taxYear = year || this.getCurrentTaxYear();
    return TAX_DATA[taxYear]?.medicareLevy || 0.02;
  }
  
  static getLastUpdated(year?: string): string {
    const taxYear = year || this.getCurrentTaxYear();
    return TAX_DATA[taxYear]?.lastUpdated || 'Unknown';
  }
  
  // Future: Could fetch from external source
  static async fetchLatestTaxBrackets(): Promise<TaxBracket[] | null> {
    try {
      // Example of how you could integrate with a future API
      // const response = await fetch('https://api.example.com/au-tax-brackets');
      // const data = await response.json();
      // return data.brackets;
      
      // For now, return null to indicate no external source
      return null;
    } catch (error) {
      console.warn('Failed to fetch latest tax brackets:', error);
      return null;
    }
  }
}
