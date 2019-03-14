import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { Supplier } from './supplier';

@Injectable({
    providedIn: 'root'
})
export class SupplierService {
    private suppliersUrl = 'api/suppliers';

    constructor(private http: HttpClient) { }

    getSuppliers(): Observable<Supplier[]> {
        return this.http.get<Supplier[]>(this.suppliersUrl)
            .pipe(
                tap(data => console.log(JSON.stringify(data))),
                catchError(this.handleError)
            );
    }

    // Gets a single supplier by id
    getSupplier(id: number): Observable<Supplier> {
        const url = `${this.suppliersUrl}/${id}`;
        return this.http.get<Supplier>(url)
            .pipe(
                tap(data => console.log('getSupplier: ' + JSON.stringify(data))),
                catchError(this.handleError)
            );
    }

    // To get the suppliers for a product
    // Given the product name
    // Gets the product to obtain the Id
    // The query returns an array, so maps to the first product in the array
    // Uses the id to get the suppliers
    // Only returns the suppliers (not the product)
    // getSuppliersForProductByName(productName: string): Observable<Supplier[]> {
    //     const productUrl = `${this.productsUrl}?productName=^${productName}$`;
    //     return this.http.get<Product>(productUrl)
    //         .pipe(
    //             map(products => products[0]),
    //             mergeMap(product => {
    //                 const supplierUrl = `${this.suppliersUrl}?productId=^${product.id}$`;
    //                 return this.http.get<Supplier[]>(supplierUrl);
    //             }),
    //             tap(data => console.log(data)),
    //             catchError(this.handleError)
    //         );
    // }

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
