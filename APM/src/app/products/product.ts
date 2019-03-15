import { Supplier } from "../suppliers/supplier";

/* 
  Defines the product entity
  This shape includes both the categoryId and the category string
  This shape includes both the supplierIds and the supplier objects
*/
export interface Product {
  id: number;
  productName: string;
  productCode: string;
  categoryId: number;
  category?: string;
  description: string;
  price: number;
  supplierIds?: number[];
  suppliers?: Supplier[]
}
