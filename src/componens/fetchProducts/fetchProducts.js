import { generateAuthKey } from "./helpers/generateAuthKey";

export const fetchProducts = async (currentPage = 0, currentFilter, setIsLoading, setTotalPages) => {
   setIsLoading(true);

   // const action = Object.keys(currentFilter).length > 0 ? "filter" : "get_ids";
   // const itemsPerPage = 50;

   const requestBodyIds = {
      action: 'get_ids',
      params: {
         ...currentFilter,
         offset: currentPage,
         limit: 50,
      },
   };

   try {
      const responseIds = await fetch('http://api.valantis.store:40000/', {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
            'X-Auth': generateAuthKey(),
         },
         body: JSON.stringify(requestBodyIds),
      });

      if (!responseIds.ok) {
         throw new Error(`HTTP error! status: ${responseIds.status}`);
      }

      const data = await responseIds.json();

      if (data && data.result) {
         console.log(data.result)
         // const totalItems = data.result;
         const totalPages = Math.ceil(data.result / 50);
         // debugger
         setTotalPages(totalPages); // Обновляем состояние totalPages
         return data.result;
      }
      setIsLoading(false)
      return [];
   } catch (error) {
      console.error("Ошибка при получении данных из API:", error);
   }
};