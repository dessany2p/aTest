import CryptoJS from 'crypto-js';

export const BASE_URL = 'http://api.valantis.store:40000/';
export const PASSWORD = 'Valantis';

export const generateAuthKey = () => {
   const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
   return CryptoJS.MD5(`${PASSWORD}_${timestamp}`).toString();
};