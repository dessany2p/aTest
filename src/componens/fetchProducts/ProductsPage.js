import React, { useState, useEffect } from 'react';
import { filterDuplicates } from './helpers/filterDuplicates';
import { fetchWithRetry } from './helpers/fetchWithRetry';
import { generateAuthKey } from './helpers/generateAuthKey'
import { fetchProducts } from './fetchProducts';

const ProductsPage = () => {
   const [isLoading, setIsLoading] = useState(false);
   const [products, setProducts] = useState([]);
   const [page, setPage] = useState(0); // Управление текущей страницей63
   const [filter, setFilter] = useState({}); // Фильтры: product, price, brand
   const [totalPages, setTotalPages] = useState(0);

   // Функция для загрузки товаров


   // Эффект для загрузки товаров при изменении страницы или фильтров
   useEffect(() => {
      fetchProducts(page, filter, setIsLoading, setTotalPages).then(productIds => {
         if (productIds.length > 0) {
            fetchProductDetails(productIds); // Вызываем функцию для получения деталей товаров
         }
      })
   }, [page, filter]);

   const [filterOptions, setFilterOptions] = useState({ brand: [], price: [], product: [] }); // Пример

   const fetchFilterOptions = async (fieldName, offset = 0, limit = 1000) => {
      const requestBody = {
         action: "get_fields",
         params: { field: fieldName, offset, limit },
      };
      try {
         const response = await fetch('http://api.valantis.store:40000/', {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
               'X-Auth': generateAuthKey(),
            },
            body: JSON.stringify(requestBody),
         });

         if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
         }

         const data = await response.json();
         if (data && data.result) {
            return data.result.filter(item => item != null);
         }
      } catch (error) {
         console.error(`Ошибка при загрузке данных для ${fieldName}: `, error);
      }
      return [];
   };

   useEffect(() => {
      Promise.all([
         fetchFilterOptions('brand', 0),
         fetchFilterOptions('price', 0),
         fetchFilterOptions('product', 0)
      ]).then(([brands, prices, products]) => {
         setFilterOptions({ brand: brands, price: prices, product: products });
      }).catch(error => console.error("Ошибка при загрузке данных фильтров: ", error));
   }, []);

   const fetchProductDetails = async (productIds) => {
      const responseDetails = {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
            'X-Auth': generateAuthKey(),
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
                     {/* <option value="">Выберите диапазон цен</option>
                     <option value="0-10000">До 10000</option>
                     <option value="10000-50000">10000 - 50000</option>
                     <option value="50000-">Более 50000</option> */}
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
               <ol>
                  {products.map(({ id, product, price, brand }) => (
                     <li key={id}>{`ID: ${id}  ${product}  (${brand}) - ${price}₽`}</li>
                  ))}
               </ol>

            </>
         )}
      </div>
   );
};

export default ProductsPage;