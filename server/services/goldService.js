const axios = require('axios');
const axiosRetry = require('axios-retry').default;

// Configure Axios with retry logic
axiosRetry(axios, { retries: 3, retryDelay: axiosRetry.exponentialDelay });

const cache = {
    goldPrice: null,
    timestamp: null,
    date: null
};

exports.getGoldPrice = async (date) => {
    try {
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        
        // Format dates
        const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const queryDate = date ? date.replace(/-/g, '') : today; // YYYYMMDD
        const formattedMetalPriceDate = queryDate.length === 8 
            ? `${queryDate.slice(0, 4)}-${queryDate.slice(4, 6)}-${queryDate.slice(6)}` 
            : queryDate; // YYYY-MM-DD

        // Check cache
        if (cache.goldPrice && cache.timestamp && cache.date === queryDate && now - cache.timestamp < oneDay) {
            return cache.goldPrice;
        }

        let goldPrice;

        // Primary API: MetalPriceAPI
        try {
            const apiKeyMetalPriceApi = process.env.METAL_PRICE_API_KEY;
            const apiUrlMetalPriceApi = queryDate === today
                ? `https://api.metalpriceapi.com/v1/latest?api_key=${apiKeyMetalPriceApi}&base=USD&currencies=XAU`
                : `https://api.metalpriceapi.com/v1/${formattedMetalPriceDate}?api_key=${apiKeyMetalPriceApi}&base=USD&currencies=XAU`;

            const response = await axios.get(apiUrlMetalPriceApi);
            goldPrice = response.data.rates?.USDXAU;

            if (!goldPrice) throw new Error('Gold price missing in MetalPriceAPI');
        } catch (metalErr) {
            console.error('MetalPriceAPI failed, switching to GoldAPI', metalErr.message);

            // Fallback API: GoldAPI
            try {
                const apiKeyGoldApi = process.env.GOLD_API_KEY;
                const apiUrlGoldApi = queryDate === today
                    ? `https://www.goldapi.io/api/XAU/USD`
                    : `https://www.goldapi.io/api/XAU/USD/${queryDate}`;

                const response = await axios.get(apiUrlGoldApi, {
                    headers: { 'x-access-token': apiKeyGoldApi, 'Content-Type': 'application/json' },
                });
                goldPrice = response.data.price;

                if (!goldPrice) throw new Error('Gold price missing in GoldAPI');
            } catch (goldErr) {
                console.error('Both APIs failed');
                return 0.00; // Fallback to 0 if both fail
            }
        }

        // Calculate mithqal price
        const mithqalPrice = goldPrice * 2.22456;

        // Update cache
        cache.goldPrice = mithqalPrice;
        cache.timestamp = now;
        cache.date = queryDate;

        return mithqalPrice;
    } catch (error) {
        console.error('Unexpected error fetching gold price', error);
        return 0.00;
    }
};
