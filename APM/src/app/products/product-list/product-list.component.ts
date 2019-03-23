import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { of, Subject } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { ProductService } from '../product.service';

@Component({
  selector: 'pm-product-list',
  templateUrl: './product-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductListComponent implements OnInit {
  pageTitle = 'Products';
  error$ = new Subject<string>();

  products$ = this.productService.productsWithCategory$.pipe(
    catchError(error => {
      this.error$.next(error);
      return of(null);
    }));
  selectedProductId$ = this.productService.selectedProductChanges$;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService
  ) {}

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
