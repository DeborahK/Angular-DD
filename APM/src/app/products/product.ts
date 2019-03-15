/* 
  Defines the product entity
  Note that this shape includes both the categoryId and the category string
*/
export interface Product {
  id: number;
  productName: string;
  productCode: string;
  categoryId: number;
  category?: string;
  price: number;
  description: string;
  supplierIds?: number[];
}
