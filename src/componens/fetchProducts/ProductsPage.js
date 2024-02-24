import React, { useState, useEffect } from 'react';
import CryptoJS from 'crypto-js'

const filterDuplicates = (products) => {
   const filteredProducts = new Map();

   products.forEach((product) => {
      if (!filteredProducts.has(product.id)) {
         filteredProducts.set(product.id, product);
      }
   });

   return Array.from(filteredProducts.values());
};

const fetchWithRetry = async (url, options, maxAttempts = 3) => {
   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
         // console.log(`Attempt ${attempt}`);
         const response = await fetch(url, options);
         if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
         return await response.json();
      } catch (error) {
         console.error(`Attempt ${attempt} failed: ${error}`);
         if (attempt === maxAttempts) throw error;
      }
   }
};

const ProductsPage = () => {
   const [products, setProducts] = useState([]);
   const [page, setPage] = useState(0); // Управление текущей страницей
   const [filter, setFilter] = useState({}); // Фильтры: product, price, brand

   // Функция для загрузки товаров
   const fetchProducts = async (currentPage, currentFilter) => {
      const password = "Valantis";
      const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const authKey = CryptoJS.MD5(`${password}_${timestamp}`).toString();

      const requestBodyIds = {
         action: "get_ids",
         params: {
            ...currentFilter,
            offset: currentPage * 50,
            limit: 50,
         },
      };

      try {
         const responseIds = await fetch('http://api.valantis.store:40000/', {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
               'X-Auth': authKey,
            },
            body: JSON.stringify(requestBodyIds),
         });

         if (!responseIds.ok) {
            throw new Error(`HTTP error! status: ${responseIds.status}`);
         }

         const data = await responseIds.json();
         if (data && data.result) {
            return data.result;
         }
         return [];
      } catch (error) {
         console.error("Ошибка при получении данных из API:", error);
      }
   };

   // Эффект для загрузки товаров при изменении страницы или фильтров
   useEffect(() => {
      fetchProducts(page, filter).then(productIds => {
         if (productIds.length > 0) {
            fetchProductDetails(productIds); // Вызываем функцию для получения деталей товаров
         }
      });
   }, [page, filter]);

   const fetchProductDetails = async (productIds) => {
      const password = "Valantis";
      const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const authKey = CryptoJS.MD5(`${password}_${timestamp}`).toString();

      const responseDetails = {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
            'X-Auth': authKey,
         },
         body: JSON.stringify({
            action: "get_items",
            params: {
               ids: productIds,
            },
         }),
      }

      try {
         const rawData = await fetchWithRetry('http://api.valantis.store:40000/', responseDetails);
         if (rawData && rawData.result) {
            // console.log("Данные перед фильтрацией:", rawData.result.map(item => item.id));
            const filteredData = filterDuplicates(rawData.result);
            // console.log("Данные после фильтрации:", filteredData.map(item => item.id));
            setProducts(filteredData); // Обновляем состояние продуктов детальной информацией
         }
      } catch (error) {
         console.error("Ошибка при получении данных о товарах:", error);
      }
   };

   // Обработчики событий для пагинации и фильтрации
   const handlePrevPage = () => setPage((prevPage) => Math.max(prevPage - 1, 0));
   const handleNextPage = () => setPage((prevPage) => prevPage + 1);
   const handleFilterChange = (e) => {
      const { name, value } = e.target;
      setFilter((prevFilters) => ({
         ...prevFilters,
         [name]: value,
      }));
   };

   return (
      <div>
         <h2>Товары</h2>
         <div>
            <input name="product" placeholder="Название" onChange={handleFilterChange} />
            <input name="price" placeholder="Цена" type="number" onChange={handleFilterChange} />
            <input name="brand" placeholder="Бренд" onChange={handleFilterChange} />
            <button onClick={() => fetchProducts(page, filter)}>Применить фильтры</button>
         </div>
         <div>
            <button onClick={handlePrevPage}>Предыдущая страница</button>
            <button onClick={handleNextPage}>Следующая страница</button>
         </div>
         <ul>
            {products.map(({ id, product, price, brand }) => (
               <li key={id}>{`ID: ${id}  ${product}  (${brand}) - ${price}₽`}</li>
            ))}
         </ul>

      </div>
   );
};

export default ProductsPage;