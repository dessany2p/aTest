export const fetchWithRetry = async (url, options, maxAttempts = 3) => {
   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
         const response = await fetch(url, options);
         if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
         return await response.json();
      } catch (error) {
         console.error(`Attempt ${attempt} failed: ${error}`);
         if (attempt === maxAttempts) throw error;
      }
   }
};