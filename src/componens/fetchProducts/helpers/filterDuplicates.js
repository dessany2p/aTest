export const filterDuplicates = (products) => {
   const filteredProducts = new Map();
   products.forEach((product) => {
      if (!filteredProducts.has(product.id)) {
         filteredProducts.set(product.id, product);
      }
   });

   return Array.from(filteredProducts.values());
};