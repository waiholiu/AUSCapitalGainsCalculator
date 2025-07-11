import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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
  // Spouse-related calculations
  hasSpouse?: boolean;
  spouseIncome?: number;
  spouseTaxWithoutCG?: number;
  spouseTaxWithCG?: number;
  spouseAdditionalTax?: number;
  combinedTaxWithoutCG?: number;
  combinedTaxWithCG?: number;
  combinedAdditionalTax?: number;
  // Add detailed explanations
  explanations?: {
    step1: string;
    step2: string;
    step3: string;
    step4: string;
    taxCalculation: string;
    effectiveTaxRate: number;
    marginalTaxRate: number;
    taxBreakdown?: string;
    medicareLevy?: number;
    incomeTax?: number;
    spouseCalculation?: string;
    combinedCalculation?: string;
    bracketByBracketCalculation?: Array<{
      bracket: string;
      taxableAmount: number;
      rate: number;
      taxOwed: number;
      explanation: string;
    }>;
    spouseBracketByBracketCalculation?: Array<{
      bracket: string;
      taxableAmount: number;
      rate: number;
      taxOwed: number;
      explanation: string;
    }>;
  };
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
  taxBracketsForm: FormGroup;
  results: CalculationResults | null = null;
  showResults = false;
  showDetailedCalculations = false; // Property to control collapsible state
  showTaxBracketEditor = false; // Property to control tax bracket editor visibility
  currentTaxYear: string;
  taxBracketsLastUpdated: string;
  private isLoadingFromQueryParams = false;

  // Get tax brackets from service and make them editable
  private defaultTaxBrackets: TaxBracket[] = [];
  private currentTaxBrackets: TaxBracket[] = [];
  private defaultMedicareLevy: number = 0.02;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.currentTaxYear = TaxBracketService.getCurrentTaxYear();
    this.taxBracketsLastUpdated = TaxBracketService.getLastUpdated();
    this.defaultTaxBrackets = TaxBracketService.getTaxBrackets();
    this.currentTaxBrackets = [...this.defaultTaxBrackets]; // Create a copy for editing
    this.defaultMedicareLevy = TaxBracketService.getMedicareLevy();

    this.calculatorForm = this.fb.group({
      salePrice: ['1000000', [Validators.required, Validators.min(0)]],
      buyPrice: ['500000', [Validators.required, Validators.min(0)]],
      currentIncome: ['0', [Validators.min(0)]],
      hasSpouse: [true],
      spouseIncome: ['0', [Validators.min(0)]]
    });

    // Initialize tax brackets form
    this.taxBracketsForm = this.fb.group({
      brackets: this.fb.array([]),
      medicareLevy: [this.defaultMedicareLevy * 100, [Validators.required, Validators.min(0), Validators.max(100)]]
    });
    
    this.initializeTaxBracketsForm();
  }  ngOnInit() {
    // Try to fetch latest tax brackets on component load
    this.updateTaxBrackets();
    
    // Load values from query parameters first - use setTimeout to ensure form is ready
    setTimeout(() => {
      this.isLoadingFromQueryParams = true;
      this.loadFromQueryParams();
      this.isLoadingFromQueryParams = false;
      
      // Calculate initial results after loading query params
      this.calculateCapitalGains();
      this.showResults = true;
    }, 0);
    
    // Subscribe to form changes for dynamic updates
    this.calculatorForm.valueChanges.subscribe(() => {
      if (this.calculatorForm.valid) {
        this.calculateCapitalGains();
        this.showResults = true;
        if (!this.isLoadingFromQueryParams) {
          this.updateQueryParams();
        }
      } else {
        this.showResults = false;
      }
    });

    // Subscribe to tax bracket form changes
    this.taxBracketsForm.valueChanges.subscribe(() => {
      if (this.taxBracketsForm.valid) {
        this.updateCurrentTaxBrackets();
        this.calculateCapitalGains();
      }
    });
  }

  private initializeTaxBracketsForm() {
    const bracketsArray = this.taxBracketsForm.get('brackets') as FormArray;
    bracketsArray.clear();
    
    this.defaultTaxBrackets.forEach(bracket => {
      bracketsArray.push(this.createTaxBracketFormGroup(bracket));
    });
  }

  private createTaxBracketFormGroup(bracket: TaxBracket): FormGroup {
    return this.fb.group({
      min: [bracket.min, [Validators.required, Validators.min(0)]],
      max: [bracket.max === Infinity ? null : bracket.max, [Validators.min(0)]],
      rate: [bracket.rate * 100, [Validators.required, Validators.min(0), Validators.max(100)]],
      fixedAmount: [bracket.fixedAmount, [Validators.required, Validators.min(0)]],
      description: [this.getBracketDescription(bracket)]
    });
  }

  private getBracketDescription(bracket: TaxBracket): string {
    if (bracket.rate === 0) return 'Tax-free threshold';
    if (bracket.max === Infinity) return `${(bracket.rate * 100)}% tax rate`;
    return `${(bracket.rate * 100)}% tax rate`;
  }

  private updateCurrentTaxBrackets() {
    const bracketsArray = this.taxBracketsForm.get('brackets') as FormArray;
    const medicareLevy = this.taxBracketsForm.get('medicareLevy')?.value / 100 || this.defaultMedicareLevy;
    
    this.currentTaxBrackets = bracketsArray.controls.map(control => {
      const value = control.value;
      return {
        min: value.min,
        max: value.max === null ? Infinity : value.max,
        rate: value.rate / 100,
        fixedAmount: value.fixedAmount
      };
    });
  }

  getTaxBracketsFormArray(): FormArray {
    return this.taxBracketsForm.get('brackets') as FormArray;
  }

  toggleTaxBracketEditor() {
    this.showTaxBracketEditor = !this.showTaxBracketEditor;
  }

  resetTaxBracketsToDefault() {
    this.currentTaxBrackets = [...this.defaultTaxBrackets];
    this.initializeTaxBracketsForm();
    this.taxBracketsForm.patchValue({
      medicareLevy: this.defaultMedicareLevy * 100
    });
    this.calculateCapitalGains();
  }

  async updateTaxBrackets() {
    try {
      const latestBrackets = await TaxBracketService.fetchLatestTaxBrackets();
      if (latestBrackets) {
        this.defaultTaxBrackets = latestBrackets;
        this.currentTaxBrackets = [...latestBrackets];
        this.initializeTaxBracketsForm();
        console.log('Tax brackets updated from external source');
      }
    } catch (error) {
      console.warn('Using fallback tax brackets:', error);
    }
  }  private calculateCapitalGains() {
    const salePrice = Number(this.calculatorForm.get('salePrice')?.value);
    const buyPrice = Number(this.calculatorForm.get('buyPrice')?.value);
    const currentIncome = Number(this.calculatorForm.get('currentIncome')?.value || 0);
    const hasSpouse = this.calculatorForm.get('hasSpouse')?.value || false;
    const spouseIncome = Number(this.calculatorForm.get('spouseIncome')?.value || 0);

    // Step 1: Calculate capital gain/loss
    const capitalGain = salePrice - buyPrice;

    // Step 2: Apply 50% CGT discount (only for gains, not losses)
    const capitalGainAfterDiscount = capitalGain > 0 ? capitalGain * 0.5 : capitalGain;    // Step 3: Apply ownership split (only if there's a spouse)
    const spouseShare = hasSpouse ? capitalGainAfterDiscount * 0.5 : capitalGainAfterDiscount;

    // Step 4: Total capital gains bill (what the person owes)
    const totalCapitalGainsBill = spouseShare;

    // Step 5: Calculate estimated tax based on different income levels
    const estimatedTaxLow = this.calculateTax(30000 + Math.max(0, totalCapitalGainsBill));
    const estimatedTaxMedium = this.calculateTax(80000 + Math.max(0, totalCapitalGainsBill));
    const estimatedTaxHigh = this.calculateTax(150000 + Math.max(0, totalCapitalGainsBill));    // Calculate tax on current income + capital gains
    const currentTaxWithoutCG = this.calculateTax(currentIncome);
    const currentTaxWithCG = this.calculateTax(currentIncome + Math.max(0, totalCapitalGainsBill));
    const actualAdditionalTax = currentTaxWithCG - currentTaxWithoutCG;

    // Spouse calculations (if applicable)
    let spouseTaxWithoutCG = 0;
    let spouseTaxWithCG = 0;
    let spouseAdditionalTax = 0;
    let spouseTaxBreakdownResult: any = null;
    let combinedTaxWithoutCG = 0;
    let combinedTaxWithCG = 0;
    let combinedAdditionalTax = 0;

    if (hasSpouse) {
      spouseTaxWithoutCG = this.calculateTax(spouseIncome);
      spouseTaxWithCG = this.calculateTax(spouseIncome + Math.max(0, totalCapitalGainsBill));
      spouseAdditionalTax = spouseTaxWithCG - spouseTaxWithoutCG;
      
      const spouseTotalIncomeForTax = spouseIncome + Math.max(0, totalCapitalGainsBill);
      spouseTaxBreakdownResult = this.calculateTaxWithBreakdown(spouseTotalIncomeForTax);
      
      combinedTaxWithoutCG = currentTaxWithoutCG + spouseTaxWithoutCG;
      combinedTaxWithCG = currentTaxWithCG + spouseTaxWithCG;
      combinedAdditionalTax = actualAdditionalTax + spouseAdditionalTax;
    }

    // Get detailed tax breakdown for the total income (income + capital gains)
    const totalIncomeForTax = currentIncome + Math.max(0, totalCapitalGainsBill);
    const taxBreakdownResult = this.calculateTaxWithBreakdown(totalIncomeForTax);

    // Calculate effective and marginal tax rates
    const effectiveTaxRate = currentIncome > 0 ? (currentTaxWithoutCG / currentIncome) * 100 : 0;
    const marginalTaxRate = this.getMarginalTaxRate(totalIncomeForTax);

    // Generate detailed explanations
    const explanations = {
      step1: `Capital Gain = Sale Price - Purchase Price = ${this.formatCurrency(salePrice)} - ${this.formatCurrency(buyPrice)} = ${this.formatCurrency(capitalGain)}`,
      step2: capitalGain > 0 
        ? `CGT Discount Applied = ${this.formatCurrency(capitalGain)} × 50% = ${this.formatCurrency(capitalGainAfterDiscount)} (50% discount for assets held over 12 months)`
        : `No CGT discount applied to capital losses. Loss remains ${this.formatCurrency(capitalGain)}`,      step3: hasSpouse 
        ? `Spouse Split = ${this.formatCurrency(capitalGainAfterDiscount)} ÷ 2 = ${this.formatCurrency(spouseShare)} (50/50 ownership split)`
        : `No spouse split applied. Your full share = ${this.formatCurrency(spouseShare)}`,
      step4: hasSpouse 
        ? `Taxable Capital Gain per person = ${this.formatCurrency(totalCapitalGainsBill)}`
        : `Your Taxable Capital Gain = ${this.formatCurrency(totalCapitalGainsBill)}`,
      taxCalculation: currentIncome > 0 
        ? `Your tax calculation: ${this.formatCurrency(currentIncome)} (income) + ${this.formatCurrency(Math.max(0, totalCapitalGainsBill))} (capital gain) = ${this.formatCurrency(totalIncomeForTax)} total taxable income`
        : `Your tax calculation based on capital gain only: ${this.formatCurrency(Math.max(0, totalCapitalGainsBill))} taxable income`,
      taxBreakdown: `Your total tax on ${this.formatCurrency(totalIncomeForTax)} = ${this.formatCurrency(taxBreakdownResult.totalTax)} (Income tax: ${this.formatCurrency(taxBreakdownResult.incomeTax)} + Medicare Levy: ${this.formatCurrency(taxBreakdownResult.medicareLevy)})${currentIncome > 0 ? ` | Additional tax from capital gain: ${this.formatCurrency(actualAdditionalTax)}` : ''}`,
      spouseCalculation: hasSpouse 
        ? `Spouse's tax calculation: ${this.formatCurrency(spouseIncome)} (income) + ${this.formatCurrency(Math.max(0, totalCapitalGainsBill))} (capital gain) = ${this.formatCurrency(spouseIncome + Math.max(0, totalCapitalGainsBill))} total taxable income. Spouse's additional tax: ${this.formatCurrency(spouseAdditionalTax)}`
        : '',
      combinedCalculation: hasSpouse 
        ? `Combined household tax impact: ${this.formatCurrency(combinedTaxWithoutCG)} (without CG) → ${this.formatCurrency(combinedTaxWithCG)} (with CG). Total additional tax: ${this.formatCurrency(combinedAdditionalTax)}`
        : '',
      effectiveTaxRate,
      marginalTaxRate,
      medicareLevy: taxBreakdownResult.medicareLevy,
      incomeTax: taxBreakdownResult.incomeTax,
      bracketByBracketCalculation: taxBreakdownResult.breakdown,
      spouseBracketByBracketCalculation: spouseTaxBreakdownResult?.breakdown || []
    };    this.results = {
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
      totalTaxIncrease: currentTaxWithoutCG > 0 ? ((actualAdditionalTax / currentTaxWithoutCG) * 100) : 0,
      // Spouse data
      hasSpouse,
      spouseIncome,
      spouseTaxWithoutCG,
      spouseTaxWithCG,
      spouseAdditionalTax,
      combinedTaxWithoutCG,
      combinedTaxWithCG,
      combinedAdditionalTax,
      explanations
    };
  }
  private calculateTax(income: number): number {
    if (income <= 0) return 0;
    
    let tax = 0;
    
    // Calculate income tax using current (possibly edited) tax brackets
    for (const bracket of this.currentTaxBrackets) {
      if (income > bracket.min) {
        const taxableInThisBracket = Math.min(income, bracket.max) - bracket.min + 1;
        tax = bracket.fixedAmount + (taxableInThisBracket * bracket.rate);
      }
      
      if (income <= bracket.max) break;
    }
    
    // Add Medicare Levy (using current medicare levy rate)
    const medicareLevy = this.calculateMedicareLevy(income);
    
    return Math.max(0, tax + medicareLevy);
  }

  private calculateMedicareLevy(income: number): number {
    // Medicare Levy threshold for 2025-26: $26,000 for singles
    const medicareThreshold = 26000;
    
    if (income <= medicareThreshold) {
      return 0;
    }
    
    // Use current medicare levy rate (possibly edited)
    const medicareRate = this.getCurrentMedicareLevy();
    return income * medicareRate;
  }

  private getCurrentMedicareLevy(): number {
    const medicareFormValue = this.taxBracketsForm.get('medicareLevy')?.value;
    return medicareFormValue ? medicareFormValue / 100 : this.defaultMedicareLevy;
  }
  private calculateTaxWithBreakdown(income: number): {
    totalTax: number;
    incomeTax: number;
    medicareLevy: number;
    breakdown: Array<{
      bracket: string;
      taxableAmount: number;
      rate: number;
      taxOwed: number;
      explanation: string;
    }>;
  } {
    if (income <= 0) return { totalTax: 0, incomeTax: 0, medicareLevy: 0, breakdown: [] };
    
    let incomeTax = 0;
    const breakdown: Array<{
      bracket: string;
      taxableAmount: number;
      rate: number;
      taxOwed: number;
      explanation: string;
    }> = [];
    
    // Calculate income tax brackets using current (possibly edited) tax brackets
    for (const bracket of this.currentTaxBrackets) {
      if (income > bracket.min) {
        const maxInThisBracket = bracket.max === Infinity ? income : Math.min(income, bracket.max);
        const taxableInThisBracket = maxInThisBracket - bracket.min + 1;
        const taxInThisBracket = taxableInThisBracket * bracket.rate;
        
        if (taxableInThisBracket > 0) {
          breakdown.push({
            bracket: bracket.max === Infinity 
              ? `$${bracket.min.toLocaleString()}+` 
              : `$${bracket.min.toLocaleString()} - $${bracket.max.toLocaleString()}`,
            taxableAmount: taxableInThisBracket,
            rate: bracket.rate * 100,
            taxOwed: bracket.fixedAmount + taxInThisBracket,
            explanation: bracket.fixedAmount > 0 
              ? `$${bracket.fixedAmount.toLocaleString()} (fixed) + ($${taxableInThisBracket.toLocaleString()} × ${(bracket.rate * 100).toFixed(1)}%) = $${(bracket.fixedAmount + taxInThisBracket).toLocaleString()}`
              : `$${taxableInThisBracket.toLocaleString()} × ${(bracket.rate * 100).toFixed(1)}% = $${taxInThisBracket.toLocaleString()}`
          });
          
          incomeTax = bracket.fixedAmount + taxInThisBracket;
        }
      }
      
      if (income <= bracket.max) break;
    }
    
    // Calculate Medicare Levy
    const medicareLevy = this.calculateMedicareLevy(income);
    
    // Add Medicare Levy to breakdown if applicable
    if (medicareLevy > 0) {
      const medicareRate = this.getCurrentMedicareLevy() * 100;
      breakdown.push({
        bracket: 'Medicare Levy',
        taxableAmount: income,
        rate: medicareRate,
        taxOwed: medicareLevy,
        explanation: `$${income.toLocaleString()} × ${medicareRate}% = $${medicareLevy.toLocaleString()}`
      });
    }
    
    return { 
      totalTax: Math.max(0, incomeTax + medicareLevy), 
      incomeTax: Math.max(0, incomeTax),
      medicareLevy: medicareLevy,
      breakdown 
    };
  }

  private getMarginalTaxRate(income: number): number {
    if (income <= 0) return 0;
    
    for (const bracket of this.currentTaxBrackets) {
      if (income >= bracket.min && (bracket.max === Infinity || income <= bracket.max)) {
        return bracket.rate * 100; // Convert to percentage
      }
    }
    
    return 0;
  }  reset() {
    // Reset form to default values instead of clearing
    this.calculatorForm.reset({
      salePrice: '1000000',
      buyPrice: '500000',
      currentIncome: '0',
      hasSpouse: true,
      spouseIncome: '0'
    });
    
    // Clear query parameters
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true
    });
    
    // Recalculate with default values
    this.calculateCapitalGains();
    this.showResults = true;
  }

  toggleDetailedCalculations() {
    this.showDetailedCalculations = !this.showDetailedCalculations;
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
  }  private loadFromQueryParams() {
    const params = this.route.snapshot.queryParams;
    console.log('Raw query params:', params);
    
    // Update form with query parameters if they exist
    const formValues: any = {};
    let hasParams = false;
    
    if (params['buyPrice'] && !isNaN(Number(params['buyPrice']))) {
      formValues.buyPrice = params['buyPrice'];
      hasParams = true;
      console.log('Loading buyPrice:', params['buyPrice']);
    }
    if (params['salePrice'] && !isNaN(Number(params['salePrice']))) {
      formValues.salePrice = params['salePrice'];
      hasParams = true;
      console.log('Loading salePrice:', params['salePrice']);
    }
    if (params['currentIncome'] && !isNaN(Number(params['currentIncome']))) {
      formValues.currentIncome = params['currentIncome'];
      hasParams = true;
      console.log('Loading currentIncome:', params['currentIncome']);
    }
    if (params['hasSpouse'] !== undefined) {
      formValues.hasSpouse = params['hasSpouse'] === 'true';
      hasParams = true;
      console.log('Loading hasSpouse:', params['hasSpouse']);
    }
    if (params['spouseIncome'] && !isNaN(Number(params['spouseIncome']))) {
      formValues.spouseIncome = params['spouseIncome'];
      hasParams = true;
      console.log('Loading spouseIncome:', params['spouseIncome']);
    }
    
    // Only update if we have any valid query parameters
    if (hasParams) {
      console.log('Loading from query params:', formValues);
      console.log('Form before patch:', this.calculatorForm.value);
      this.calculatorForm.patchValue(formValues);
      console.log('Form after patch:', this.calculatorForm.value);
    } else {
      console.log('No valid query parameters found');
    }
  }

  private updateQueryParams() {
    const formValue = this.calculatorForm.value;
    
    const queryParams: any = {
      buyPrice: formValue.buyPrice,
      salePrice: formValue.salePrice,
      currentIncome: formValue.currentIncome,
      hasSpouse: formValue.hasSpouse,
      spouseIncome: formValue.spouseIncome
    };
    
    // Update URL without triggering navigation
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryParams,
      replaceUrl: true
    });
  }

  copyShareableUrl() {
    const currentUrl = window.location.href;
    navigator.clipboard.writeText(currentUrl).then(() => {
      // You could add a toast notification here
      console.log('URL copied to clipboard');
      alert('Shareable URL copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy URL: ', err);
      // Fallback: show the URL in a prompt
      prompt('Copy this URL to share:', currentUrl);
    });
  }

  generateShareableUrl(): string {
    return window.location.href;
  }
}
