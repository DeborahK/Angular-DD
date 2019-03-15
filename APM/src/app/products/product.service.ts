import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { combineLatest, forkJoin, Observable, ReplaySubject, throwError } from 'rxjs';
import { catchError, map, mergeMap, shareReplay, take, tap } from 'rxjs/operators';
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
    take(1),
    tap(data => console.log('getProducts: ', JSON.stringify(data))),
    catchError(this.handleError)
  );

  productsWithCategory$ = forkJoin([
    this.products$,
    this.productCategoryService.productCategories$
  ]).pipe(
    map(([products, categories]) =>
      products.map(
        p =>
          ({
            ...p,
            category: categories.find(c => p.categoryId === c.id).name
          } as Product) // <-- note the type here!
      )
    ),
    shareReplay(1)
  );

  // Currently selected product
  selectedProduct$ = combineLatest(
    this.selectedProductChanges$,
    this.productsWithCategory$
  ).pipe(
    map(([selectedProductId, products]) =>
      products.find(product => product.id === selectedProductId)
    ),
    // Displays this message twice??
    /** yes, one for each subscription. You might want to share() this. */
    tap(product => console.log('changeSelectedProduct', product))
  );

  selectedProductSuppliers$ = this.selectedProduct$.pipe(
    mergeMap(product =>
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
    console.log('init refresh')
    this.start();
  }

  start() {
    // Start the related services
    this.productCategoryService.start();
    this.refresh.next();
  }

  // Gets a single product by id
  private getProduct(id: number): Observable<Product> {
    // const url = `${this.productsUrl}/${id}`;
    return this.products$.pipe(
      /**
       * this will load all products,
       * perhaps keeping a single http call here is better in some cases.
       * all depends on requirements. as an Observables sample I like this better ;)
       */
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
