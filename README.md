# Capital Gains Calculator

A modern Angular application that helps users calculate their capital gains tax liability in Australia.

## Features

- **Simple Input Form**: Enter purchase price, sale price, and optionally your current income
- **Automatic Calculations**: 
  - Calculate capital gain/loss
  - Apply 50% CGT discount (for gains only)
  - Split ownership 50/50 between spouses
  - Calculate final tax liability
- **Tax Estimation**: 
  - Personalized tax calculation based on your current income
  - Alternative scenarios for different income levels
  - Uses current Australian tax brackets (2024-25)
- **Australian Tax Rules**: Built specifically for Australian tax regulations
- **Modern UI**: Beautiful, responsive design with gradient backgrounds
- **Input Validation**: Form validation to ensure accurate calculations
- **Detailed Results**: Clear breakdown of all calculation steps and tax implications

## How It Works

1. **Enter Purchase Price**: The amount you originally paid for the asset
2. **Enter Sale Price**: The amount you sold the asset for
3. **Enter Current Income (Optional)**: Your annual taxable income for personalized tax calculation
4. **Calculate**: The app automatically applies:
   - Capital gains/loss calculation (Sale Price - Purchase Price)
   - 50% CGT discount (applied only to gains, not losses)
   - 50% ownership split between spouses
   - **NEW:** Actual income tax calculation on the capital gains amount
   - Final taxable amount and estimated tax payable

## Tax Calculation Features

- **Personalized Tax Estimates**: Enter your current income to get accurate tax calculations
- **Alternative Scenarios**: See tax implications for different income levels
- **Current Tax Brackets**: Uses 2024-25 Australian income tax brackets
- **Additional Tax Only**: Shows the extra tax you'll pay due to capital gains
- **Medicare Levy Note**: Reminds you about the additional 2% Medicare levy

## Example Calculation:
- **Purchase Price:** $100,000
- **Sale Price:** $200,000  
- **Current Income:** $80,000
- **Capital Gain:** $100,000
- **After 50% CGT Discount:** $50,000
- **Your Share (50% ownership):** $25,000
- **Additional Tax Payable:** ~$8,125 (32.5% tax bracket)

## Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```
4. Open your browser to `http://localhost:4200`

## Development

This project was built with Angular 17 and includes:
- Reactive Forms for input validation
- Modern CSS with gradients and animations
- Responsive design for mobile and desktop
- TypeScript for type safety

## Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run unit tests
- `npm run watch` - Build in watch mode

## Tax Disclaimer

This calculator provides simplified calculations based on general Australian tax rules:
- 50% CGT discount for assets held over 12 months
- 50/50 ownership split between spouses
- Basic capital gains calculation

**Important**: This is for educational purposes only. Always consult a qualified tax professional for accurate tax advice specific to your situation.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this code for your own projects.
