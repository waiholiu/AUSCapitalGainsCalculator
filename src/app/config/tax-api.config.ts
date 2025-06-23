export const TAX_API_CONFIG = {
  // Future API endpoints for tax bracket data
  endpoints: {
    // Example potential APIs (none currently exist)
    ato: 'https://api.ato.gov.au/tax-brackets', // Hypothetical
    treasury: 'https://api.treasury.gov.au/tax-rates', // Hypothetical
    
    // Third-party APIs that might become available
    taxapi: 'https://api.tax-data.com.au/brackets', // Hypothetical
    
    // Fallback to static JSON file that could be hosted separately
    fallback: './assets/data/tax-brackets.json'
  },
  
  // Configuration for when APIs become available
  updateInterval: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  cacheKey: 'au-tax-brackets-cache',
  
  // Manual update reminders
  checkDates: [
    '2024-07-01', // Start of financial year
    '2024-10-01', // Post-budget updates
    '2025-01-01', // Mid-year adjustments
    '2025-05-01'  // Pre-budget preparation
  ]
};

// Instructions for future API integration
export const API_INTEGRATION_NOTES = `
FUTURE API INTEGRATION GUIDE:

1. ATO API (if/when available):
   - Monitor https://developer.ato.gov.au/ for API announcements
   - Check https://data.gov.au/ for new datasets
   
2. Third-party APIs:
   - Consider services like Xero, MYOB APIs that might expose tax rates
   - Monitor fintech APIs for tax calculation services
   
3. Alternative approaches:
   - Web scraping ATO website (check robots.txt and terms)
   - RSS feeds from ATO for tax rate announcements
   - GitHub repos with community-maintained tax data
   
4. Implementation steps when API becomes available:
   a. Update TaxBracketService.fetchLatestTaxBrackets()
   b. Add error handling and fallback logic
   c. Implement caching strategy
   d. Add user notification for tax bracket updates
   e. Consider subscription to API change notifications

5. Data validation:
   - Always validate API response structure
   - Implement sanity checks (e.g., rates between 0-1)
   - Log data changes for audit purposes
   - Maintain backward compatibility

6. User experience:
   - Add loading states during API calls
   - Show "last updated" timestamps
   - Provide manual refresh option
   - Display data source information
`;
