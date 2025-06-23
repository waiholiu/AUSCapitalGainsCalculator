import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TaxBracketService, TaxBracket as ImportedTaxBracket } from '../services/tax-bracket.service';

interface CalculationResults {
  capitalGain: number;
  capitalGainAfterDiscount: number;
  spouseShare: number;
  totalCapitalGainsBill: number;
  estimatedTaxLow: number;
  estimatedTaxMedium: number;
  estimatedTaxHigh: number;
  actualAdditionalTax?: number;
  currentIncome?: number;
  taxWithoutCG?: number;
  taxWithCG?: number;
  totalTaxIncrease?: number;
}

// Keep local interface for backward compatibility
interface TaxBracket {
  min: number;
  max: number;
  rate: number;
  fixedAmount: number;
}

@Component({
  selector: 'app-calculator',
  templateUrl: './calculator.component.html',
  styleUrls: ['./calculator.component.css']
})
export class CalculatorComponent implements OnInit {
  calculatorForm: FormGroup;
  results: CalculationResults | null = null;
  showResults = false;
  currentTaxYear: string;
  taxBracketsLastUpdated: string;

  // Get tax brackets from service
  private taxBrackets: TaxBracket[] = [];

  constructor(private fb: FormBuilder) {
    this.currentTaxYear = TaxBracketService.getCurrentTaxYear();
    this.taxBracketsLastUpdated = TaxBracketService.getLastUpdated();
    this.taxBrackets = TaxBracketService.getTaxBrackets();
    
    this.calculatorForm = this.fb.group({
      salePrice: ['1000000', [Validators.required, Validators.min(0)]],
      buyPrice: ['500000', [Validators.required, Validators.min(0)]],
      currentIncome: ['0', [Validators.min(0)]]
    });
  }  ngOnInit() {
    // Try to fetch latest tax brackets on component load
    this.updateTaxBrackets();
    
    // Calculate initial results
    this.calculateCapitalGains();
    this.showResults = true;
    
    // Subscribe to form changes for dynamic updates
    this.calculatorForm.valueChanges.subscribe(() => {
      if (this.calculatorForm.valid) {
        this.calculateCapitalGains();
        this.showResults = true;
      } else {
        this.showResults = false;
      }
    });
  }

  async updateTaxBrackets() {
    try {
      const latestBrackets = await TaxBracketService.fetchLatestTaxBrackets();
      if (latestBrackets) {
        this.taxBrackets = latestBrackets;
        console.log('Tax brackets updated from external source');
      }
    } catch (error) {
      console.warn('Using fallback tax brackets:', error);
    }  }

  private calculateCapitalGains() {
    const salePrice = Number(this.calculatorForm.get('salePrice')?.value);
    const buyPrice = Number(this.calculatorForm.get('buyPrice')?.value);
    const currentIncome = Number(this.calculatorForm.get('currentIncome')?.value || 0);

    // Step 1: Calculate capital gain/loss
    const capitalGain = salePrice - buyPrice;

    // Step 2: Apply 50% CGT discount (only for gains, not losses)
    const capitalGainAfterDiscount = capitalGain > 0 ? capitalGain * 0.5 : capitalGain;

    // Step 3: Apply 50% spouse ownership split
    const spouseShare = capitalGainAfterDiscount * 0.5;

    // Step 4: Total capital gains bill (assuming this is what each spouse owes)
    const totalCapitalGainsBill = spouseShare;

    // Step 5: Calculate estimated tax based on different income levels
    const estimatedTaxLow = this.calculateTax(30000 + Math.max(0, totalCapitalGainsBill));
    const estimatedTaxMedium = this.calculateTax(80000 + Math.max(0, totalCapitalGainsBill));
    const estimatedTaxHigh = this.calculateTax(150000 + Math.max(0, totalCapitalGainsBill));    // Calculate tax on current income + capital gains
    const currentTaxWithoutCG = this.calculateTax(currentIncome);
    const currentTaxWithCG = this.calculateTax(currentIncome + Math.max(0, totalCapitalGainsBill));
    const actualAdditionalTax = currentTaxWithCG - currentTaxWithoutCG;

    this.results = {
      capitalGain,
      capitalGainAfterDiscount,
      spouseShare,
      totalCapitalGainsBill,
      estimatedTaxLow: estimatedTaxLow - this.calculateTax(30000),
      estimatedTaxMedium: estimatedTaxMedium - this.calculateTax(80000),
      estimatedTaxHigh: estimatedTaxHigh - this.calculateTax(150000),
      actualAdditionalTax: actualAdditionalTax,
      currentIncome,
      taxWithoutCG: currentTaxWithoutCG,
      taxWithCG: currentTaxWithCG,
      totalTaxIncrease: currentTaxWithoutCG > 0 ? ((actualAdditionalTax / currentTaxWithoutCG) * 100) : 0
    };
  }

  private calculateTax(income: number): number {
    if (income <= 0) return 0;
    
    let tax = 0;
    
    for (const bracket of this.taxBrackets) {
      if (income > bracket.min) {
        const taxableInThisBracket = Math.min(income, bracket.max) - bracket.min + 1;
        tax = bracket.fixedAmount + (taxableInThisBracket * bracket.rate);
      }
      
      if (income <= bracket.max) break;
    }
    
    return Math.max(0, tax);
  }

  reset() {
    this.calculatorForm.reset();
    this.results = null;
    this.showResults = false;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount);
  }

  isGain(): boolean {
    return this.results ? this.results.capitalGain > 0 : false;
  }
  isLoss(): boolean {
    return this.results ? this.results.capitalGain < 0 : false;
  }

  getCurrentTaxYear(): string {
    return this.currentTaxYear;
  }

  getTaxBracketsLastUpdated(): string {
    return this.taxBracketsLastUpdated;
  }
}
