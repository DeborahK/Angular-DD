import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable, throwError, forkJoin, from, BehaviorSubject } from 'rxjs';
import { catchError, tap, map, mergeMap, toArray, shareReplay } from 'rxjs/operators';

import { Product } from './product';
import { Supplier } from '../suppliers/supplier';
import { ProductCategoryService } from '../product-categories/product-category.service';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private productsUrl = 'api/products';
  private suppliersUrl = 'api/suppliers';

  // Currently selected product
  selectedProduct$: Observable<Product>;
  selectedProductWithCategory$: Observable<Product>;
  private selectedProductSource = new BehaviorSubject<number | null>(null);
  selectedProductChanges$ = this.selectedProductSource.asObservable();

  // All products
  products$: Observable<Product[]>;
  productsWithCategory$: Observable<Product[]>;

  constructor(private http: HttpClient,
    private productCategoryService: ProductCategoryService) { }

  // Change the selected product
  changeSelectedProduct(selectedProductId: number | null): void {
    this.selectedProduct$ = this.productsWithCategory$.pipe(
      map(products => products.find(product => product.id === selectedProductId))
    )
    this.selectedProductSource.next(selectedProductId);
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
  // getProductSuppliers(id: number): Observable<Supplier[]> {
  //   const productUrl = `${this.productsUrl}/${id}`;
  //   return this.http.get<Product>(productUrl)
  //     .pipe(
  //       mergeMap(product =>
  //         from(product.supplierIds).pipe(
  //           mergeMap(supplierId => {
  //             const supplierUrl = `${this.suppliersUrl}/${supplierId}`;
  //             return this.http.get<Supplier>(supplierUrl);
  //           })
  //         )),
  //       toArray(),
  //       catchError(this.handleError)
  //     );
  // }

  // Gets all suppliers for a product one by one.
  // If the second mergeMap is changed to switchMap, only one value is displayed.
  // getProductSuppliersOneByOne(id: number): Observable<Supplier> {
  //   const productUrl = `${this.productsUrl}/${id}`;
  //   return this.http.get<Product>(productUrl)
  //     .pipe(
  //       mergeMap(product =>
  //         from(product.supplierIds).pipe(
  //           mergeMap(supplierId => {
  //             const supplierUrl = `${this.suppliersUrl}/${supplierId}`;
  //             return this.http.get<Supplier>(supplierUrl);
  //           })
  //         )),
  //       catchError(this.handleError)
  //     );
  // }

  // Refresh the data.
  refreshData(): void {
    this.start();
  }

  start() {
    // All products
    this.products$ = this.getProducts().pipe(
      shareReplay(1)
    )

    // Products with categoryId foreign key mapped to category string
    // [products, categories] uses destructuring to unpack the values from the arrays
    this.productsWithCategory$ = forkJoin([this.products$, this.productCategoryService.productCategories$]).pipe(
      map(([products, categories]) =>
        products.map(p => ({ ...p, 'category': categories.find(c => p.categoryId === c.id).name }))
      ),
      shareReplay(1)
    );
  }

  private getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.productsUrl)
      .pipe(
        tap(data => console.log(JSON.stringify(data))),
        catchError(this.handleError)
      );
  }

  // Gets a single product by id
  getProduct(id: number): Observable<Product> {
    const url = `${this.productsUrl}/${id}`;
    return this.http.get<Product>(url)
      .pipe(
        tap(data => console.log('Data: ' + JSON.stringify(data))),
        catchError(this.handleError)
      );
  }

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

}
