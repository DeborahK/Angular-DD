import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, ReplaySubject, throwError } from 'rxjs';
import { catchError, mergeMap, take, tap } from 'rxjs/operators';
import { ProductCategory } from './product-category';

@Injectable({
  providedIn: 'root'
})
export class ProductCategoryService {
  private refresh = new ReplaySubject<void>();
  private productsUrl = 'api/productCategories';

  // All product categories
  productCategories$: Observable<ProductCategory[]> = this.refresh.pipe(
    /** any xxxMap will do, merge is the safest. */
    mergeMap(() => this.http.get<ProductCategory[]>(this.productsUrl)),
    /** As its' not completing bcs of the subject, use take to make it behave as usual */
    take(1),
    tap({
      next: data => console.log('getCategories', JSON.stringify(data)),
      complete: () => console.log('competed request!')
    }),
    catchError(this.handleError)
  );

  constructor(private http: HttpClient) {}

  // Refresh the data.
  refreshData(): void {
    this.refresh.next();
  }

  start() {
    this.refreshData();
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
