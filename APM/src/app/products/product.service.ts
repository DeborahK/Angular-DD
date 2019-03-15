import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable, of, throwError, forkJoin, from, BehaviorSubject } from 'rxjs';
import { catchError, tap, map, concatMap, mergeMap, first, take, concatAll, mergeAll, toArray, switchMap } from 'rxjs/operators';

import { Product } from './product';
import { Supplier } from '../suppliers/supplier';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private productsUrl = 'api/products';
  private suppliersUrl = 'api/suppliers';
  private products: Product[];

  private selectedProductSource = new BehaviorSubject<number | null>(null);
  selectedProductChanges$ = this.selectedProductSource.asObservable();

  constructor(private http: HttpClient) { }

  changeSelectedProduct(selectedProductId: number | null): void {
    this.selectedProductSource.next(selectedProductId);
  }

  getProducts(): Observable<Product[]> {
    if (this.products) {
        return of(this.products);
    }
    return this.http.get<Product[]>(this.productsUrl)
                    .pipe(
                        tap(data => console.log(JSON.stringify(data))),
                        tap(data => this.products = data),
                        catchError(this.handleError)
                    );
}

  // Gets a single product by id
  getProduct(id: number): Observable<Product> {
    if (id === 0) {
        return of(this.initializeProduct());
    }
    if (this.products) {
        const foundItem = this.products.find(item => item.id === id);
        if (foundItem) {
            return of(foundItem);
        }
    }
    const url = `${this.productsUrl}/${id}`;
    return this.http.get<Product>(url)
                    .pipe(
                        tap(data => console.log('Data: ' + JSON.stringify(data))),
                        catchError(this.handleError)
                    );
}

  // AntiPattern: Nested (or chained) http calls results in nested observables
  // that are difficult to process
  // First, get the product
  // For each supplier for that product, get the supplier info
  // getProductSuppliers(id: number) {
  //   const productUrl = `${this.productsUrl}/${id}`;
  //   return this.http.get<Product>(productUrl)
  //     .pipe(
  //       map(product => 
  //         product.supplierIds.map(supplierId => {
  //           const supplierUrl = `${this.suppliersUrl}/${supplierId}`;
  //           return this.http.get(supplierUrl);
  //         })
  //       ),
  //       catchError(this.handleError)
  //     );
  // }

  // Gets the first supplier.
  // getProductSuppliers(id: number): Observable<Supplier> {
  //   const productUrl = `${this.productsUrl}/${id}`;
  //   return this.http.get<Product>(productUrl)
  //     .pipe(
  //       tap(x => console.log(x)),
  //       mergeMap(product => {
  //         const supplierUrl = `${this.suppliersUrl}/${product.supplierIds[0]}`;
  //         return this.http.get<Supplier>(supplierUrl);
  //       }
  //       ),
  //       catchError(this.handleError)
  //     );
  // }

  // Gets all suppliers for a product using mergeMap and concatAll.
  // But this returns one supplier at a time.
  // getProductSuppliers(id: number): Observable<Supplier> {
  //   const productUrl = `${this.productsUrl}/${id}`;
  //   return this.http.get<Product>(productUrl)
  //     .pipe(
  //       mergeMap(product =>
  //         product.supplierIds.map(supplierId => {
  //           const supplierUrl = `${this.suppliersUrl}/${supplierId}`;
  //           return this.http.get<Supplier>(supplierUrl);
  //         })
  //       ),
  //       concatAll(),
  //       catchError(this.handleError)
  //     );
  // }

  // Gets all suppliers for a product as an array.
  getProductSuppliers(id: number): Observable<Supplier[]> {
    const productUrl = `${this.productsUrl}/${id}`;
    return this.http.get<Product>(productUrl)
      .pipe(
        mergeMap(product =>
          from(product.supplierIds).pipe(
            mergeMap(supplierId => {
              const supplierUrl = `${this.suppliersUrl}/${supplierId}`;
              return this.http.get<Supplier>(supplierUrl);
            })
          )),
        toArray(),
        catchError(this.handleError)
      );
  }

  // Gets all suppliers for a product one by one.
  // If the second mergeMap is changed to switchMap, only one value is displayed.
  getProductSuppliersOneByOne(id: number): Observable<Supplier> {
    const productUrl = `${this.productsUrl}/${id}`;
    return this.http.get<Product>(productUrl)
      .pipe(
        mergeMap(product =>
          from(product.supplierIds).pipe(
            mergeMap(supplierId => {
              const supplierUrl = `${this.suppliersUrl}/${supplierId}`;
              return this.http.get<Supplier>(supplierUrl);
            })
          )),
        catchError(this.handleError)
      );
  }

  // Pass out both using concat??

  private handleError(err) {
    // in a real world app, we may send the server to some remote logging infrastructure
    // instead of just logging it to the console
    let errorMessage: string;
    if (err.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      errorMessage = `An error occurred: ${err.error.message}`;
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      errorMessage = `Backend returned code ${err.status}: ${err.body.error}`;
    }
    console.error(err);
    return throwError(errorMessage);
  }

  private initializeProduct(): Product {
    // Return an initialized object
    return {
      id: 0,
      productName: null,
      productCode: null,
      categoryId: null,
      price: null,
      description: null
    };
  }
}
