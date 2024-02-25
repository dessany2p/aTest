import React, { useState, useEffect } from 'react';
import CryptoJS from 'crypto-js'
import { filterDuplicates } from './helpers/filterDuplicates';
import { fetchWithRetry } from './helpers/fetchWithRetry';

const ProductsPage = () => {
   const [isLoading, setIsLoading] = useState(false);
   const [products, setProducts] = useState([]);
   const [page, setPage] = useState(0); // Управление текущей страницей
   const [filter, setFilter] = useState({}); // Фильтры: product, price, brand
   const [totalPages, setTotalPages] = useState(0);

   // Функция для загрузки товаров
   const fetchProducts = async (currentPage, currentFilter) => {
      setIsLoading(true);
      const password = "Valantis";
      const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const authKey = CryptoJS.MD5(`${password}_${timestamp}`).toString();

      const action = Object.keys(currentFilter).length > 0 ? "filter" : "get_ids";
      const itemsPerPage = 50;

      const requestBodyIds = {
         action: action,
         params: {
            ...currentFilter,
            offset: currentPage * itemsPerPage,
            limit: itemsPerPage,
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
            const totalItems = data.totalItems; // Измените это в соответствии с форматом вашего API
            const totalPages = Math.ceil(totalItems / itemsPerPage);
            setTotalPages(totalPages); // Обновляем состояние totalPages
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
      })
   }, [page, filter]);

   const [filterOptions, setFilterOptions] = useState({ brand: [], price: [], product: [] }); // Пример

   const fetchFilterOptions = async (fieldName, offset = 0, limit = 10) => {
      const password = "Valantis";
      const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const authKey = CryptoJS.MD5(`${password}_${timestamp}`).toString();

      const requestBody = {
         action: "get_fields",
         params: { field: fieldName, offset, limit },
      };
      try {
         const response = await fetch('http://api.valantis.store:40000/', {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
               'X-Auth': authKey,
            },
            body: JSON.stringify(requestBody),
         });

         if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
         }

         const data = await response.json();
         console.log(fieldName, data);
         if (data && data.result) {
            console.log(fieldName, data);
            return data.result.filter(item => item != null);
         }
      } catch (error) {
         console.error(`Ошибка при загрузке данных для ${fieldName}: `, error);
      }
      return [];
   };

   useEffect(() => {
      Promise.all([
         fetchFilterOptions('brand', 0, 10),
         fetchFilterOptions('price', 0, 10),
         fetchFilterOptions('product', 0, 10)
      ]).then(([brands, prices, products]) => {
         setFilterOptions({ brand: brands, price: prices, product: products });
      }).catch(error => console.error("Ошибка при загрузке данных фильтров: ", error));
   }, []);

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
            const filteredData = filterDuplicates(rawData.result);
            setProducts(filteredData); // Обновляем состояние продуктов детальной информацией
         }
      } catch (error) {
         console.error("Ошибка при получении данных о товарах:", error);
      } finally {
         setIsLoading(false)
      }
   };



   // Обработчики событий для пагинации и фильтрации
   const handlePrevPage = () => setPage((prevPage) => Math.max(prevPage - 1, 0));
   const handleNextPage = () => setPage((prevPage) => prevPage + 1);

   const [tempFilter, setTempFilter] = useState({});
   const handleFilterChange = (e) => {
      const { name, value } = e.target;
      setTempFilter(currentTempFilters => ({
         ...currentTempFilters,
         [name]: value
      }));
   };
   const applyFilters = () => {
      setFilter(tempFilter);
   };
   const resetFilters = () => {
      setFilter({}); // Сброс состояния фильтров
      setPage(0); // Возврат к первой странице
   };

   return (
      <div>
         <h2>Товары</h2>
         {isLoading ? (
            <p>Загрузка...</p>
         ) : (
            <>
               <div>
                  <select name="product" onChange={handleFilterChange}>
                     <option value="">Все товары</option>
                     {filterOptions.product.map((product, index) => (
                        <option key={index} value={product}>{product}</option>
                     ))}
                  </select>
                  <select name="priceRange" onChange={handleFilterChange}>
                     <option value="">Выберите диапазон цен</option>
                     <option value="0-10000">До 10000</option>
                     <option value="10000-50000">10000 - 50000</option>
                     <option value="50000-">Более 50000</option>
                  </select>
                  <select name="brand" onChange={handleFilterChange}>
                     <option value="">Все бренды</option>
                     {filterOptions.brand.map((brand, index) => (
                        <option key={index} value={brand}>{brand}</option>
                     ))}
                  </select>

                  <button onClick={applyFilters}>Применить фильтры</button>
                  <button onClick={resetFilters}>Сбросить фильтры</button>
               </div>
               <div>
                  <button onClick={handlePrevPage} disabled={page === 0}>Предыдущая страница</button>
                  <button onClick={handleNextPage} disabled={page >= totalPages - 1}>Следующая страница</button>
               </div>
               <ul>
                  {products.map(({ id, product, price, brand }) => (
                     <li key={id}>{`ID: ${id}  ${product}  (${brand}) - ${price}₽`}</li>
                  ))}
               </ul>
            </>
         )}
      </div>
   );
};

export default ProductsPage;