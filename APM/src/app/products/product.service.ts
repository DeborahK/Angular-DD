import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { combineLatest, Observable, ReplaySubject, throwError } from 'rxjs';
import { catchError, filter, map, mergeMap, shareReplay, switchMap, tap } from 'rxjs/operators';
import { ProductCategoryService } from '../product-categories/product-category.service';
import { SupplierService } from '../suppliers/supplier.service';
import { Product } from './product';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private refresh = new ReplaySubject<void>();
  private selectedProductSource = new ReplaySubject<number>();
  private productsUrl = 'api/products';
  private suppliersUrl = 'api/suppliers';

  selectedProductChanges$ = this.selectedProductSource.asObservable();

  // All products
  /** note, all the types are still there, I just don't need to type them out. */
  products$ = this.refresh.pipe(
    mergeMap(() => this.http.get<Product[]>(this.productsUrl)),
    // take(1),// <== Here was the issue, this ubsubscribes from the above. not smart ina service.. sorry.
    tap(data => console.log('getProducts: ', JSON.stringify(data))),
    shareReplay({ bufferSize: 1, refCount: false }),
    catchError(this.handleError)
  );

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
    shareReplay({ bufferSize: 1, refCount: false })
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
  ) {}

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
    console.log('start product refresh');
    this.refresh.next();
  }

  // Gets a single product by id
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
