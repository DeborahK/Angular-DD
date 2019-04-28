import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { of, Subject, Observable, combineLatest } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { ProductService } from '../product.service';
import { Product } from '../product';

@Component({
  selector: 'pm-product-list',
  templateUrl: './product-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductListComponent implements OnInit {
  pageTitle = 'Products';
  error$ = new Subject<string>();

  products$: Observable<Product[]> = this.productService.productsWithCategory$
    .pipe(
      catchError(error => {
        this.error$.next(error);
        return of(null);
      }));

  selectedProduct$ = this.productService.selectedProduct$;

  vm$ = combineLatest([this.products$, this.selectedProduct$])
    .pipe(
      map(([products, product]: [Product[], Product]) =>
        ({ products, productId: product ? product.id : 0 }))
    );

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService
  ) { }

  ngOnInit(): void {
    // Read the parameter from the route - supports deep linking
    this.route.paramMap.subscribe(params => {
      const id = +params.get('id');
      this.productService.changeSelectedProduct(id);
    });
  }

  onSelected(productId: number): void {
    // Modify the URL to support deep linking
    this.router.navigate(['/products', productId]);
  }
}
