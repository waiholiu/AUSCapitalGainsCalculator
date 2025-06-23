# Capital Gains Calculator (Australia)

An Angular application that helps users calculate their capital gains tax liability specifically for Australian tax regulations.

## How It Works

Enter your property purchase and sale details, along with your income and that of your spouse (if applicable). The calculator will:
1. Calculate the capital gain from the sale of the property.
2. Apply the 50% Capital Gains Tax (CGT) discount for assets held over 12 months.
3. Estimate the additional tax burden based on your income and your spouse's income.
4. Provide a shareable URL that retains all your input values for easy sharing and future reference.
5. Display a detailed breakdown of the tax impact, including individual and combined analyses for you and your spouse.
6. Show clear indicators of tax increases and additional amounts owed.

## Installation & Development

### Quick Start
1. Clone this repository:
   ```bash
   git clone https://github.com/waiholiu/AUSCapitalGainsCalculator.git
   cd AUSCapitalGainsCalculator
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```
4. Open your browser to `http://localhost:4200`

### Production Build
```bash
npm run build:prod
```

### Deploy to GitHub Pages
```bash
npm run deploy
```

## Scripts

- `npm start` - Start development server
- `npm run build` - Build for production  
- `npm run build:prod` - Build for production with GitHub Pages base href
- `npm run deploy` - Build and deploy to GitHub Pages
- `npm test` - Run unit tests
- `npm run watch` - Build in watch mode

## Live Demo

🌐 **[Try the Calculator Live](https://waiholiu.github.io/AUSCapitalGainsCalculator/)**

## Technology Stack

This project was built with:
- **Angular 17** - Modern web framework
- **TypeScript** - Type-safe JavaScript
- **Reactive Forms** - Input validation and form handling
- **Angular Router** - URL parameter management for sharing
- **CSS3** - Modern styling with gradients and animations
- **GitHub Actions** - Automated deployment to GitHub Pages

## Tax Disclaimer

This calculator provides simplified calculations based on general Australian tax rules:
- 50% CGT discount for assets held over 12 months by Australian tax residents
- 50/50 ownership split assumed between spouses (adjust manually if different)
- Uses 2025-26 Australian income tax brackets and Medicare levy rates
- Calculations include income tax and Medicare levy (2%)
- Does not account for Medicare Levy Surcharge, HECS/HELP debts, or other levies

**Important**: This is for educational and estimation purposes only. Tax laws are complex and individual circumstances vary. Always consult a qualified tax professional or accountant for accurate tax advice specific to your situation.

## License

MIT License - feel free to use this code for your own projects. See [LICENSE](LICENSE) file for details.
