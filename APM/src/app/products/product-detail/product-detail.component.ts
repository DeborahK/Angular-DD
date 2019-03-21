import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

import { catchError, map } from 'rxjs/operators';

import { ProductService } from '../product.service';
import { Product } from '../product';
import { combineLatest, of, Subject } from 'rxjs';

@Component({
  selector: 'pm-product-detail',
  templateUrl: './product-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductDetailComponent implements OnInit {
  error$ = new Subject<string>();

  selectedProductId$ = this.productService.selectedProductChanges$;
  product$ = this.productService.selectedProduct$.pipe(
    catchError(error => {
      this.error$.next(error);
      return of(null);
    }));
  pageTitle$ = this.product$.pipe(
    map((p: Product) => p ? `Product Detail for: ${p.productName}` : 'No product found')
  );
  productSuppliers$ = this.productService.selectedProductSuppliers$.pipe(
    catchError(error => {
      this.error$.next(error);
      return of(null);
    }));;

  // Create a combined stream with the data used in the view
  vm$ = combineLatest([this.product$, this.productSuppliers$, this.pageTitle$]).pipe(
    map(([product, productSuppliers, pageTitle]) => ({ product, productSuppliers, pageTitle }))
  );

  constructor(private productService: ProductService) { }

  ngOnInit() { }

}
