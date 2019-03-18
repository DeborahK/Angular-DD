import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { combineLatest, Observable, ReplaySubject, throwError } from 'rxjs';
import { catchError, filter, map, mergeMap, shareReplay, switchMap, tap } from 'rxjs/operators';

import { Product } from './product';
import { ProductCategoryService } from '../product-categories/product-category.service';
import { SupplierService } from '../suppliers/supplier.service';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private productsUrl = 'api/products';

  // Use ReplaySubject to "replay" values to new subscribers
  // It buffers the defined number of values, in these cases, 1.

  // Invalidates the cache and refreshes the data from the backend server
  // The generic parameter is void because it does not care what the value is, only that an item is emitted.
  private refresh = new ReplaySubject<void>(1);
  // Retains the currently selected product Id
  // Uses 0 for no selected product (couldn't use null because it is used as a route parameter)
  private selectedProductSource = new ReplaySubject<number>(1);
  // Expose the selectedProduct as an observable for use by any components
  selectedProductChanges$ = this.selectedProductSource.asObservable();

  // LIST OF STREAMS

  // All products
  // Instead of defining the http.get in a method in the service,
  // set the observable directly
  // Use shareReplay to "replay" the data from the observable
  // Subscription remains even if there are no subscribers (navigating to the Welcome page for example)
  products$ = this.http.get<Product[]>(this.productsUrl)
    .pipe(
      tap(data => console.log('getProducts: ', JSON.stringify(data))),
      shareReplay(),
      catchError(this.handleError)
    );

  // All products
  // Same as above, but set up with `refresh` to allow for invalidating the cache
  // Must then `mergeMap` to flatten the inner observable.
  // products$ = this.refresh.pipe(
  //   mergeMap(() => this.http.get<Product[]>(this.productsUrl)),
  //   tap(data => console.log('getProducts: ', JSON.stringify(data))),
  //   shareReplay(),
  //   catchError(this.handleError)
  // );

  // All products with category id mapped to category name
  // Be sure to specify the type to ensure after the map that it knows the correct type
  productsWithCategory$ = combineLatest(
    this.products$,
    this.productCategoryService.productCategories$
  ).pipe(
    map(([products, categories]) =>
      products.map(
        p =>
          ({
            ...p,
            category: categories.find(c => p.categoryId === c.id).name
          } as Product) // <-- note the type here!
      )
    ),
    shareReplay()
  );

  // Currently selected product
  // Subscribed to in both List and Detail pages,
  // so use the shareReply to share it with any component that uses it
  // Location of the shareReplay matters ... won't share anything *after* the shareReplay
  selectedProduct$ = combineLatest(
    this.selectedProductChanges$,
    this.productsWithCategory$
  ).pipe(
    map(([selectedProductId, products]) =>
      products.find(product => product.id === selectedProductId)
    ),
    tap(product => console.log('changeSelectedProduct', product)),
    shareReplay({ bufferSize: 1, refCount: false })
  );

  // filter(Boolean) checks for nulls, which casts anything it gets to a Boolean.
  // Filter(Boolean) of an undefined value returns false
  // filter(Boolean) -> filter(value => !!value)
  // SwitchMap here instead of mergeMap so quickly clicking on
  // the items cancels prior requests.
  selectedProductSuppliers$ = this.selectedProduct$.pipe(
    filter(value => !!value),
    switchMap(product =>
      this.supplierService.getSuppliersByIds(product.supplierIds)
    )
  );

  constructor(
    private http: HttpClient,
    private productCategoryService: ProductCategoryService,
    private supplierService: SupplierService
  ) { }

  // Change the selected product
  changeSelectedProduct(selectedProductId: number | null): void {
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
    this.refresh.next();
  }

  // Gets a single product by id
  // Using the existing list of products.
  // This could instead get the data directly
  // if required, such as on an edit.
  private getProduct(id: number): Observable<Product> {
    return this.products$.pipe(
      map(productlist => productlist.find(row => row.id === id)),
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
