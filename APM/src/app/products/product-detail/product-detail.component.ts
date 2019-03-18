import { Component, OnInit } from '@angular/core';

import { tap, catchError, map, filter } from 'rxjs/operators';

import { ProductService } from '../product.service';
import { Product } from '../product';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'pm-product-detail',
  templateUrl: './product-detail.component.html'
})
export class ProductDetailComponent implements OnInit {
  pageTitle = 'Product Detail';
  errorMessage: string;

  selectedProductId$ = this.productService.selectedProductChanges$;
  product$ = this.productService.selectedProduct$.pipe(
    tap(product => this.displayProduct(product)),
    catchError(err => this.errorMessage = err)
  );
  suppliers$ = this.productService.selectedProductSuppliers$;

  // Create another combined stream with all data used in the view
  vm$ = combineLatest([this.product$, this.suppliers$, this.selectedProductId$])
    .pipe(
      map(([product, suppliers, selectedProductId]) => ({ product, suppliers, selectedProductId }))
    );

  constructor(private productService: ProductService) { }

  ngOnInit() { }

  displayProduct(product: Product): void {
    // Display the appropriate heading
    if (product) {
      this.pageTitle = `Product Detail for: ${product.productName}`;
    } else {
      this.pageTitle = 'No product found';
    }
  }
}
