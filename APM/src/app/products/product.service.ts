import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable, throwError, forkJoin, from, BehaviorSubject } from 'rxjs';
import { catchError, tap, map, mergeMap, toArray, shareReplay } from 'rxjs/operators';

import { Product } from './product';
import { Supplier } from '../suppliers/supplier';
import { ProductCategoryService } from '../product-categories/product-category.service';
import { SupplierService } from '../suppliers/supplier.service';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private productsUrl = 'api/products';
  private suppliersUrl = 'api/suppliers';

  // Currently selected product
  selectedProduct$: Observable<Product>;
  selectedProductSuppliers$: Observable<Supplier[]>;
  private selectedProductSource = new BehaviorSubject<number | null>(null);
  selectedProductChanges$ = this.selectedProductSource.asObservable();

  // All products
  products$: Observable<Product[]>;
  productsWithCategory$: Observable<Product[]>;

  constructor(private http: HttpClient,
    private productCategoryService: ProductCategoryService,
    private supplierService: SupplierService) { }

  // Change the selected product
  changeSelectedProduct(selectedProductId: number | null): void {
    // This will only be set if it is bound via an async pipe
    this.selectedProduct$ = this.productsWithCategory$.pipe(
      map(products => products.find(product => product.id === selectedProductId))
    )
    // This will only be set if it is bound via an async pipe
    this.selectedProductSuppliers$ = this.productsWithCategory$
      .pipe(
        map(products => products.find(product => product.id === selectedProductId)),
        tap(x => console.log(x)),
        mergeMap(product => this.supplierService.getSuppliersByIds(product.supplierIds))
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

  // Refresh the data.
  refreshData(): void {
    this.start();
  }

  start() {
    // Start the related services
    this.productCategoryService.start();

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
        tap(data => console.log('getProducts: ', JSON.stringify(data))),
        catchError(this.handleError)
      );
  }

  // Gets a single product by id
  getProduct(id: number): Observable<Product> {
    const url = `${this.productsUrl}/${id}`;
    return this.http.get<Product>(url)
      .pipe(
        tap(data => console.log('getProduct: ', JSON.stringify(data))),
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
